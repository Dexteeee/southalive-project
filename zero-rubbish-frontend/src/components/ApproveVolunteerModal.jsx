import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { DrawControl, MapFlyTo, StreetSearch } from "./LeafletDrawTools";
import { approveVolunteer } from "../services/api";

const SOUTH_INVERCARGILL_CENTER = [-46.4317, 168.3601];

function parseInitialGeometry(volunteer) {
    if (!volunteer.requestedGeometryGeoJson) return null;
    try {
        return JSON.parse(volunteer.requestedGeometryGeoJson);
    } catch {
        return null;
    }
}

export default function ApproveVolunteerModal({ volunteer, onClose, onApproved }) {
    const initialGeometry = parseInitialGeometry(volunteer);

    const [areaName, setAreaName] = useState(volunteer.requestedAreaName);
    const [areaType, setAreaType] = useState(volunteer.requestedAreaType || "street");
    const [drawnGeoJson, setDrawnGeoJson] = useState(initialGeometry);
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
                <p className="text-sm text-red-500 mb-4 ">
                    {initialGeometry
                        ? `New applicant ${volunteer.name} already submitted a location below — adjust it if needed, then confirm.`
                        : `Draw the street or zone >${volunteer.name} is adopting, then confirm.`}
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
                <div className="mb-3">
                    <StreetSearch onSelect={setSearchResult} />
                </div>

                <p className="text-xs text-ink/50 mb-2">
                    Use the drawing tools on the map to draw a{" "}
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
                        <DrawControl
                            areaType={areaType}
                            onGeometryChange={setDrawnGeoJson}
                            initialGeometry={areaType === (volunteer.requestedAreaType || "street") ? initialGeometry : null}
                        />
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