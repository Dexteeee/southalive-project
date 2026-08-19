import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { getAreas } from "../services/api";

const ADOPTED_COLOR = "#0EA5E9"; // brand green

// Anchored near Strathern / Bain Park, south Invercargill
const SOUTH_INVERCARGILL_CENTER = [-46.4273, 168.3602];

function Legend() {
    return (
       <div className="absolute bottom-4 left-4 z-[1000] bg-white rounded-lg shadow-md px-4 py-3 text-sm w-max max-w-[220px]">
    <p className="font-semibold text-gray-800 mb-2 bg-white">South Alive - Zero Rubbish Programme</p>
    <div className="flex items-center gap-2 bg-white">
        <span
            className="inline-block w-8 h-1 rounded shrink-0"
            style={{ backgroundColor: ADOPTED_COLOR }}
        />
        <span className="text-gray-600">Streets / Zones that have been adopted</span>
    </div>
</div>
    );
}

export default function EmbedMap() {
    const mapRef = useRef(null);
    const [areas, setAreas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        getAreas()
            .then((data) => {
                // Backend already filters to adopted-only, but keep this
                // as a defensive check in case that ever changes.
                const adopted = data.filter((a) => a.currentStatus === "adopted");
                if (!cancelled) setAreas(adopted);
            })
            .catch(() => {
                if (!cancelled) setError("Unable to load street data.");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const styleFeature = (feature) => {
        const isZone = feature.properties.areaType === "zone";
        return {
            color: ADOPTED_COLOR,
            weight: isZone ? 3 : 5,
            fillColor: ADOPTED_COLOR,
            fillOpacity: isZone ? 0.35 : 0,
        };
    };

    const onEachFeature = (feature, layer) => {
        const { areaName } = feature.properties;
        layer.bindPopup(`<strong>${areaName}</strong><br/>Status: Adopted ✅`);
    };

    const geoJsonData = {
        type: "FeatureCollection",
        features: areas.map((a) => ({
            type: "Feature",
            geometry: a.geometry,
            properties: {
                areaId: a.areaId,
                areaName: a.areaName,
                areaType: a.areaType,
            },
        })),
    };

    if (loading) {
        return (
            <div
                className="flex items-center justify-center text-gray-500"
                style={{ height: "600px" }}
            >
                Loading map…
            </div>
        );
    }

    if (error) {
        return (
            <div
                className="flex items-center justify-center text-red-500"
                style={{ height: "600px" }}
            >
                {error}
            </div>
        );
    }

    return (
        <div
            className="relative w-full rounded-lg overflow-hidden shadow"
            style={{ height: "600px" }}
        >
            <MapContainer
                center={SOUTH_INVERCARGILL_CENTER}
                zoom={15}
                scrollWheelZoom={true}
                style={{ width: "100%", height: "100%" }}
                whenCreated={(map) => {
                    mapRef.current = map;
                    setTimeout(() => map.invalidateSize(), 100);
                }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <GeoJSON
                    data={geoJsonData}
                    style={styleFeature}
                    onEachFeature={onEachFeature}
                />
            </MapContainer>
            <Legend />
        </div>
    );
}