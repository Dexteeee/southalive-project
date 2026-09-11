import { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, useMap, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";
import { approveVolunteer } from "../services/api";

const SOUTH_INVERCARGILL_CENTER = [-46.4317, 168.3601];

// Fix for default marker icons not showing in Vite builds (known Leaflet + bundler quirk)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function DrawControl({ areaType, onGeometryChange }) {
    const map = useMap();
    const featureGroupRef = useRef(null);
    const drawControlRef = useRef(null);

    useEffect(() => {
        const featureGroup = new L.FeatureGroup();
        map.addLayer(featureGroup);
        featureGroupRef.current = featureGroup;

        const drawControl = new L.Control.Draw({
            position: "topleft",
            draw: {
                rectangle: false,
                circle: false,
                circlemarker: false,
                marker: false,
                polyline: areaType === "street",
                polygon: areaType === "zone",
            },
            edit: {
                featureGroup,
                remove: true,
            },
        });
        map.addControl(drawControl);
        drawControlRef.current = drawControl;

        const handleCreated = (e) => {
            featureGroup.clearLayers();
            featureGroup.addLayer(e.layer);
            onGeometryChange(e.layer.toGeoJSON().geometry);
        };
        const handleDeleted = () => {
            onGeometryChange(null);
        };

        map.on(L.Draw.Event.CREATED, handleCreated);
        map.on(L.Draw.Event.DELETED, handleDeleted);

        return () => {
            map.off(L.Draw.Event.CREATED, handleCreated);
            map.off(L.Draw.Event.DELETED, handleDeleted);
            map.removeControl(drawControl);
            map.removeLayer(featureGroup);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, areaType]);

    return null;
}

function MapFlyTo({ position }) {
    const map = useMap();
    useEffect(() => {
        if (position) {
            map.flyTo(position, 17, { duration: 1 });
        }
    }, [position, map]);
    return null;
}

function StreetSearch({ onLocationFound }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) {
            setResults([]);
            return;
        }
        setSearching(true);
        setShowResults(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=nz&q=${encodeURIComponent(
                    query + ", Invercargill, New Zealand"
                )}`
            );
            const data = await response.json();
            setResults(data);
        } catch {
            setResults([]);
        } finally {
            setSearching(false);
        }
    };

    const handleSelect = (result) => {
        onLocationFound({
            position: [parseFloat(result.lat), parseFloat(result.lon)],
            label: result.display_name.split(",")[0],
        });
        setQuery(result.display_name.split(",")[0]);
        setShowResults(false);
    };

    return (
        <div className="mb-3 relative">
            <form onSubmit={handleSearch} className="flex gap-2">
                <input
                    type="text"
                    placeholder="Search for a street in Invercargill"
                    className="flex-1 border border-line rounded-sm px-2 py-1.5 text-sm"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <button
                    type="submit"
                    disabled={searching}
                    className="text-sm px-3 py-1.5 rounded-sm border border-line disabled:opacity-50"
                >
                    {searching ? "..." : "Search"}
                </button>
            </form>

            {showResults && results.length > 0 && (
                <ul className="absolute z-[1100] bg-white border border-line rounded-sm w-full mt-1 max-h-40 overflow-y-auto text-sm shadow-md">
                    {results.map((r, i) => (
                        <li
                            key={i}
                            className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-line last:border-0"
                            onClick={() => handleSelect(r)}
                        >
                            {r.display_name}
                        </li>
                    ))}
                </ul>
            )}

            {showResults && !searching && results.length === 0 && (
                <p className="text-xs text-ink/50 mt-1">No results found. Try a different search.</p>
            )}
        </div>
    );
}

export default function ApproveVolunteerModal({ volunteer, onClose, onApproved }) {
    const [areaName, setAreaName] = useState(volunteer.requestedAreaName);
    const [areaType, setAreaType] = useState("street");
    const [drawnGeoJson, setDrawnGeoJson] = useState(null);
    const [searchResult, setSearchResult] = useState(null); // { position, label }
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async () => {
        if (!drawnGeoJson) {
            setError("Please draw the street or zone on the map before approving.");
            return;
        }
        if (!areaName.trim()) {
            setError("Area name is required.");
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            await approveVolunteer(volunteer.volunteerId, {
                areaName,
                areaType,
                geometryGeoJson: JSON.stringify(drawnGeoJson),
            });
            onApproved();
        } catch (err) {
            setError(
                err.response?.data || "Failed to approve volunteer. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-md p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-display font-semibold mb-1">Approve volunteer</h3>
                <p className="text-sm text-ink/60 mb-4">
                    Draw the street or zone {volunteer.name} is adopting, then confirm.
                </p>

                {error && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mb-3">
                        {error}
                    </p>
                )}

                <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                        <label className="block text-xs font-medium mb-1">Area name</label>
                        <input
                            className="w-full border border-line rounded-sm px-2 py-1.5 text-sm"
                            value={areaName}
                            onChange={(e) => setAreaName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1">Area type</label>
                        <select
                            className="w-full border border-line rounded-sm px-2 py-1.5 text-sm"
                            value={areaType}
                            onChange={(e) => {
                                setAreaType(e.target.value);
                                setDrawnGeoJson(null);
                            }}
                        >
                            <option value="street">Street (line)</option>
                            <option value="zone">Zone (area/polygon)</option>
                        </select>
                    </div>
                </div>

                <label className="block text-xs font-medium mb-1">Search for a street</label>
                <StreetSearch onLocationFound={setSearchResult} />

                <p className="text-xs text-ink/50 mb-2">
                    Use the drawing tools on the map (top-left) to draw a{" "}
                    {areaType === "zone" ? "polygon" : "line"} for this{" "}
                    {areaType === "zone" ? "zone" : "street"}.
                </p>

                <div className="rounded-md overflow-hidden border border-line" style={{ height: "350px" }}>
                    <MapContainer
                        center={SOUTH_INVERCARGILL_CENTER}
                        zoom={15}
                        style={{ width: "100%", height: "100%" }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <DrawControl areaType={areaType} onGeometryChange={setDrawnGeoJson} />
                        <MapFlyTo position={searchResult?.position} />
                        {searchResult && (
                            <Marker position={searchResult.position}>
                                <Popup>{searchResult.label}</Popup>
                            </Marker>
                        )}
                    </MapContainer>
                </div>

                {drawnGeoJson && (
                    <p className="text-xs text-green-700 mt-2">
                        ✓ Geometry captured ({drawnGeoJson.type})
                    </p>
                )}

                <div className="flex justify-end gap-2 mt-5">
                    <button
                        onClick={onClose}
                        className="text-sm px-4 py-2 rounded-sm border border-line"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="text-sm px-4 py-2 rounded-sm font-medium disabled:opacity-50"
                        style={{ backgroundColor: "#07C160", color: "white" }}
                    >
                        {submitting ? "Approving…" : "Approve & create area"}
                    </button>
                </div>
            </div>
        </div>
    );
}