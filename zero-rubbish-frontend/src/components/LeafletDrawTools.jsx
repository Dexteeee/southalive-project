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


function combineLayersToGeometry(layers) {
    if (layers.length === 0) return null;
    if (layers.length === 1) return layers[0].toGeoJSON().geometry;

    const geometries = layers.map((l) => l.toGeoJSON().geometry);
    const sameType = geometries.every((g) => g.type === geometries[0].type);

    if (sameType && geometries[0].type === "LineString") {
        return { type: "MultiLineString", coordinates: geometries.map((g) => g.coordinates) };
    }
    if (sameType && geometries[0].type === "Polygon") {
        return { type: "MultiPolygon", coordinates: geometries.map((g) => g.coordinates) };
    }
    return { type: "GeometryCollection", geometries };
}

const DRAWN_LINE_COLOR = "#031cfc";
const DRAWN_LINE_WEIGHT = 5;

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
            const initialLayer = L.geoJSON(initialGeometry, {
                style: { color: DRAWN_LINE_COLOR, weight: DRAWN_LINE_WEIGHT },
            });
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
                polyline: areaType === "street"
                    ? { shapeOptions: { color: DRAWN_LINE_COLOR, weight: DRAWN_LINE_WEIGHT } }
                    : false,
                polygon: areaType === "zone"
                    ? { shapeOptions: { color: DRAWN_LINE_COLOR, weight: DRAWN_LINE_WEIGHT, fillOpacity: 0.2 } }
                    : false,
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
            onGeometryChange(combineLayersToGeometry(featureGroup.getLayers()));
        };
        const handleDeleted = () => {
            onGeometryChange(combineLayersToGeometry(featureGroup.getLayers()));
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

// Nominatim's /search only returns one OSM "way" per result, which is often just one
// segment of a street (roads are frequently split at intersections). This queries the
// Overpass API for every way sharing that name near the matched point and combines them
// into a single geometry, so a text-selected street comes pre-drawn along its full length
// instead of a single short segment.
const OVERPASS_SEARCH_RADIUS_METERS = 3000;
const OVERPASS_TIMEOUT_MS = 6000;
// Overpass's main instance rate-limits/blocks aggressively; race a mirror in parallel
// instead of trying them one after another, so a blocked/slow instance doesn't double the wait.
const OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
];

async function queryOverpass(endpoint, query) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OVERPASS_TIMEOUT_MS);
    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `data=${encodeURIComponent(query)}`,
            signal: controller.signal,
        });
        if (!response.ok) return null;
        return await response.json();
    } catch {
        return null;
    } finally {
        clearTimeout(timeout);
    }
}

// Resolves with the first non-null result across all the given promises, rather than the
// first to merely settle — a mirror returning null (failed) shouldn't "win" over one that's
// still working. Resolves null only once every promise has resolved to nothing.
function firstSuccessful(promises) {
    return new Promise((resolve) => {
        let remaining = promises.length;
        promises.forEach((p) => {
            p.then((value) => {
                remaining -= 1;
                if (value) resolve(value);
                else if (remaining === 0) resolve(null);
            });
        });
    });
}

async function fetchWholeStreetGeometry(name, [lat, lon]) {
    const safeName = name.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    const query = `[out:json][timeout:15];way["name"="${safeName}"]["highway"](around:${OVERPASS_SEARCH_RADIUS_METERS},${lat},${lon});out geom;`;

    const data = await firstSuccessful(OVERPASS_ENDPOINTS.map((endpoint) => queryOverpass(endpoint, query)));
    if (!data) return null;

    const ways = (data.elements || []).filter(
        (el) => el.type === "way" && Array.isArray(el.geometry) && el.geometry.length > 1
    );
    if (!ways.length) return null;

    const coordinates = ways.map((way) => way.geometry.map((pt) => [pt.lon, pt.lat]));
    return coordinates.length === 1
        ? { type: "LineString", coordinates: coordinates[0] }
        : { type: "MultiLineString", coordinates };
}

// Search box backed by Nominatim, scoped to Invercargill. Optionally requests each
// result's OSM way geometry (polygon_geojson=1) so a street can be selected without
// anyone having to draw it by hand — and, via Overpass, the street's *whole* length
// rather than just the single segment Nominatim matched.
const MIN_LIVE_SEARCH_LENGTH = 3;
const LIVE_SEARCH_DEBOUNCE_MS = 400;

export function StreetSearch({ onSelect, placeholder = "Search for a street in Invercargill", includeGeometry = false }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [resolvingGeometry, setResolvingGeometry] = useState(false);
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
        const position = [parseFloat(result.lat), parseFloat(result.lon)];
        setQuery(label);
        setShowResults(false);
        if (debounceRef.current) clearTimeout(debounceRef.current);

        // Select immediately with whatever Nominatim already gave us — don't make the
        // volunteer wait on Overpass before the map/street even responds to their click.
        onSelect({ position, label, geometry: result.geojson || null });

        if (includeGeometry) {
            setResolvingGeometry(true);
            fetchWholeStreetGeometry(label, position)
                .then((wholeStreet) => {
                    if (wholeStreet) onSelect({ position, label, geometry: wholeStreet });
                })
                .catch(() => {
                    // Overpass failed/timed out — the single-segment geometry already selected stands.
                })
                .finally(() => setResolvingGeometry(false));
        }
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

            {resolvingGeometry && (
                <p className="text-xs text-ink/50 mt-1">Fetching the full street shape…</p>
            )}
        </div>
    );
}
