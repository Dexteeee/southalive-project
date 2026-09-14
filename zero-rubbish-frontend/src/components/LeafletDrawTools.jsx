import { useEffect, useRef } from "react";
import { useState } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";

// Fix for default marker icons not showing in Vite builds (known Leaflet + bundler quirk)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Lets someone draw a street (line) or zone (polygon) on the map, optionally starting
// from a geometry that was already captured elsewhere (e.g. a volunteer's own submission).
export function DrawControl({ areaType, onGeometryChange, initialGeometry }) {
    const map = useMap();
    const featureGroupRef = useRef(null);
    const drawControlRef = useRef(null);

    useEffect(() => {
        const featureGroup = new L.FeatureGroup();
        map.addLayer(featureGroup);
        featureGroupRef.current = featureGroup;

        if (initialGeometry) {
            const initialLayer = L.geoJSON(initialGeometry);
            initialLayer.eachLayer((layer) => featureGroup.addLayer(layer));
            if (featureGroup.getLayers().length > 0) {
                const bounds = featureGroup.getBounds();
                if (bounds.isValid()) map.fitBounds(bounds, { maxZoom: 17 });
            }
        }

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
        const handleEdited = () => {
            const layers = featureGroup.getLayers();
            if (layers.length > 0) {
                onGeometryChange(layers[0].toGeoJSON().geometry);
            }
        };
        const handleDeleted = () => {
            onGeometryChange(null);
        };

        map.on(L.Draw.Event.CREATED, handleCreated);
        map.on(L.Draw.Event.EDITED, handleEdited);
        map.on(L.Draw.Event.DELETED, handleDeleted);

        return () => {
            map.off(L.Draw.Event.CREATED, handleCreated);
            map.off(L.Draw.Event.EDITED, handleEdited);
            map.off(L.Draw.Event.DELETED, handleDeleted);
            map.removeControl(drawControl);
            map.removeLayer(featureGroup);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, areaType]);

    return null;
}

// A "find my location" button rendered as a native Leaflet control (matches the
// look of the zoom buttons). Uses the browser's geolocation via map.locate().
const LOCATE_ICON = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3"></path>
    </svg>
`;

export function LocateControl({ position = "topleft" }) {
    const map = useMap();
    const markerRef = useRef(null);
    const accuracyCircleRef = useRef(null);

    useEffect(() => {
        if (!navigator.geolocation) return undefined;

        const control = L.control({ position });
        let button;

        control.onAdd = () => {
            const container = L.DomUtil.create("div", "leaflet-bar leaflet-control");
            button = L.DomUtil.create("a", "", container);
            button.href = "#";
            button.title = "Show my location";
            button.style.display = "flex";
            button.style.alignItems = "center";
            button.style.justifyContent = "center";
            button.innerHTML = LOCATE_ICON;

            L.DomEvent.disableClickPropagation(container);
            L.DomEvent.on(button, "click", (e) => {
                L.DomEvent.preventDefault(e);
                button.style.opacity = "0.5";
                map.locate({ setView: false, enableHighAccuracy: true, maxZoom: 17 });
            });

            return container;
        };
        control.addTo(map);

        const handleLocationFound = (e) => {
            if (button) button.style.opacity = "1";
            map.flyTo(e.latlng, 17, { duration: 1 });

            if (markerRef.current) map.removeLayer(markerRef.current);
            if (accuracyCircleRef.current) map.removeLayer(accuracyCircleRef.current);

            const accuracyLabel =
                e.accuracy > 1000
                    ? `~${(e.accuracy / 1000).toFixed(1)}km`
                    : `~${Math.round(e.accuracy)}m`;
            const isImprecise = e.accuracy > 150;

            accuracyCircleRef.current = L.circle(e.latlng, {
                radius: e.accuracy,
                color: "#1F6FEB",
                weight: 1,
                fillColor: "#1F6FEB",
                fillOpacity: 0.08,
            }).addTo(map);

            markerRef.current = L.circleMarker(e.latlng, {
                radius: 8,
                color: "#1F6FEB",
                fillColor: "#1F6FEB",
                fillOpacity: 0.6,
                weight: 2,
            })
                .addTo(map)
                .bindPopup(
                    isImprecise
                        ? `You are approximately here (accurate to ${accuracyLabel}). Your browser's location can be imprecise — check the map and adjust if needed.`
                        : `You are here (accurate to ${accuracyLabel})`
                )
                .openPopup();
        };
        const handleLocationError = () => {
            if (button) button.style.opacity = "1";
            alert("Unable to find your location. Please check your browser's location permissions.");
        };

        map.on("locationfound", handleLocationFound);
        map.on("locationerror", handleLocationError);

        return () => {
            map.off("locationfound", handleLocationFound);
            map.off("locationerror", handleLocationError);
            control.remove();
            if (markerRef.current) map.removeLayer(markerRef.current);
            if (accuracyCircleRef.current) map.removeLayer(accuracyCircleRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, position]);

    return null;
}

// Flies/zooms to a location. When `radius` (meters) is given — e.g. a geolocation
// accuracy figure — zooms out to fit that whole uncertainty circle in view instead
// of zooming to street level, so an imprecise fix doesn't look misleadingly exact.
export function MapFlyTo({ position, radius }) {
    const map = useMap();
    useEffect(() => {
        if (!position) return;
        if (radius && radius > 50) {
            map.fitBounds(L.latLng(position).toBounds(radius * 2.2), { maxZoom: 17 });
        } else {
            map.flyTo(position, 17, { duration: 1 });
        }
    }, [position, radius, map]);
    return null;
}

// Search box backed by Nominatim, scoped to Invercargill. Optionally requests each
// result's OSM way geometry (polygon_geojson=1) so a street can be selected without
// anyone having to draw it by hand.
const MIN_LIVE_SEARCH_LENGTH = 3;
const LIVE_SEARCH_DEBOUNCE_MS = 400;

export function StreetSearch({ onSelect, placeholder = "Search for a street in Invercargill", includeGeometry = false }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const debounceRef = useRef(null);
    const requestIdRef = useRef(0);

    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    const runSearch = async (searchQuery) => {
        const trimmed = searchQuery.trim();
        if (!trimmed) {
            setResults([]);
            setShowResults(false);
            return;
        }

        const requestId = ++requestIdRef.current;
        setSearching(true);
        setShowResults(true);
        try {
            const params = new URLSearchParams({
                format: "json",
                limit: "5",
                countrycodes: "nz",
                q: `${trimmed}, Invercargill, New Zealand`,
            });
            if (includeGeometry) params.set("polygon_geojson", "1");

            const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
            const data = await response.json();
            if (requestId === requestIdRef.current) setResults(data);
        } catch {
            if (requestId === requestIdRef.current) setResults([]);
        } finally {
            if (requestId === requestIdRef.current) setSearching(false);
        }
    };

    const handleSearchClick = (e) => {
        e?.preventDefault();
        if (debounceRef.current) clearTimeout(debounceRef.current);
        runSearch(query);
    };

    const handleQueryChange = (value) => {
        setQuery(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (value.trim().length < MIN_LIVE_SEARCH_LENGTH) {
            setResults([]);
            setShowResults(false);
            return;
        }
        debounceRef.current = setTimeout(() => runSearch(value), LIVE_SEARCH_DEBOUNCE_MS);
    };

    const handleSelect = (result) => {
        const label = result.display_name.split(",")[0];
        onSelect({
            position: [parseFloat(result.lat), parseFloat(result.lon)],
            label,
            geometry: result.geojson || null,
        });
        setQuery(label);
        setShowResults(false);
        if (debounceRef.current) clearTimeout(debounceRef.current);
    };

    return (
        <div className="relative">
            <div className="flex gap-2">
                <input
                    type="text"
                    placeholder={placeholder}
                    className="flex-1 border border-line rounded-sm px-2 py-1.5 text-sm"
                    value={query}
                    onChange={(e) => handleQueryChange(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleSearchClick(e);
                    }}
                />
                <button
                    type="button"
                    onClick={handleSearchClick}
                    disabled={searching}
                    className="text-sm px-3 py-1.5 rounded-sm border border-line disabled:opacity-50"
                >
                    {searching ? "..." : "Search"}
                </button>
            </div>

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
