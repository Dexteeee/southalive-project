// src/pages/EmbedAdopt.jsx
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import { DrawControl, MapFlyTo, StreetSearch, LocateControl } from "../components/LeafletDrawTools";
import { registerVolunteer } from "../services/api";
import usePageTitle from "../hooks/usePageTitle";
import southAliveLogo from "../assets/South-Alive-Logo-Letina.png";

const SOUTH_INVERCARGILL_CENTER = [-46.4273, 168.3602];

function MethodOption({ value, label, selected, onSelect }) {
    return (
        <button
            type="button"
            onClick={() => onSelect(value)}
            className={`flex-1 text-left border rounded px-4 py-3 text-sm flex items-center gap-2 ${selected ? "border-2" : "border-gray-300"
                }`}
            style={selected ? { borderColor: "#1F6FEB", backgroundColor: "#EFF6FF" } : {}}
        >
            <span
                className="w-4 h-4 rounded-full border shrink-0 flex items-center justify-center"
                style={selected ? { borderColor: "#1F6FEB" } : { borderColor: "#9CA3AF" }}
            >
                {selected && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#1F6FEB" }} />}
            </span>
            {label}
        </button>
    );
}

export default function EmbedAdopt() {
    const [searchParams] = useSearchParams();
    const prefilledStreet = searchParams.get("street") || "";

    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        street: prefilledStreet,
        consent: false,
    });
    const [method, setMethod] = useState(prefilledStreet ? "text" : null);
    const [geometry, setGeometry] = useState(null);
    const [pickedLocation, setPickedLocation] = useState(null); // { position, label } - used by both methods
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    usePageTitle(submitted ? "Registration Submitted | Zero Rubbish" : "Street Adoption Form | Zero Rubbish");

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    };

    const handleMethodChange = (value) => {
        setMethod(value);
        setGeometry(null);
        setPickedLocation(null);
    };

    const handleTextSelect = (result) => {
        setForm((prev) => ({ ...prev, street: result.label }));
        setGeometry(result.geometry || null);
        setPickedLocation({ position: result.position, label: result.label });
    };

    const handleMapLocationFound = (result) => {
        setForm((prev) => ({ ...prev, street: result.label }));
        setPickedLocation({ position: result.position, label: result.label });
    };

    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) {
            setError("Your browser doesn't support location services.");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                setError(null);
                const { latitude, longitude, accuracy } = pos.coords;

                let label = "Your location";
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=17&addressdetails=1`
                    );
                    const data = await response.json();
                    label = data?.address?.road || data?.display_name?.split(",")[0] || label;
                } catch {
                    // Reverse geocoding failed — fall back to the generic label.
                }

                setForm((prev) => ({ ...prev, street: label }));
                setPickedLocation({ position: [latitude, longitude], label, accuracy });
            },
            () => setError("Unable to access your location. Please check your browser's location permissions."),
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.consent) return;
        if (!method) {
            setError("Please choose how you'd like to select your street.");
            return;
        }
        if (!form.street.trim()) {
            setError("Please provide the street you'd like to adopt.");
            return;
        }
        if (method === "map" && !geometry) {
            setError("Please draw your street on the map before submitting.");
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            await registerVolunteer({
                name: form.name,
                phoneNo: form.phone,
                emailAddress: form.email,
                address: form.address,
                requestedAreaName: form.street,
                areaType: "street",
                geometryGeoJson: geometry ? JSON.stringify(geometry) : undefined,
            });
            setSubmitted(true);
        } catch (err) {
            setError(
                err.response?.data || "Something went wrong submitting your request. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="max-w-sm mx-auto mt-10 text-center px-4">
                <h2 className="text-lg font-semibold mb-1">Thanks, {form.name}!</h2>
                <p className="text-sm text-gray-600">
                    Your request to adopt <strong>{form.street}</strong> has been submitted.
                    A coordinator will review it shortly.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto mt-6 mb-14 space-y-3 px-6 text-sm border-2 rounded-md p-4 shadow-lg" style={{ borderColor: "#FFD401" }}>
            <img
                src={southAliveLogo}
                alt="South Alive"
                className="h-12 mx-auto mb-4"
            />
            <form onSubmit={handleSubmit} className=" space-y-3 px-6 text-sm"  >
                <h2 className="text-lg font-semibold">Zero Rubbish Street Adoption Registration Form</h2>

                {error && (
                    <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1.5">
                        {error}
                    </p>
                )}

                <div>
                    <label className="block text-xs font-medium mb-1">Full name</label>
                    <input type="text" name="name" required value={form.name} onChange={handleChange} className="w-full border rounded px-2 py-1.5 text-sm" />
                </div>

                <div>
                    <label className="block text-xs font-medium mb-1">Email</label>
                    <input type="email" name="email" required value={form.email} onChange={handleChange} className="w-full border rounded px-2 py-1.5 text-sm" />
                </div>

                <div>
                    <label className="block text-xs font-medium mb-1">Phone</label>
                    <input type="tel" name="phone" required value={form.phone} onChange={handleChange} className="w-full border rounded px-2 py-1.5 text-sm" />
                </div>

                <div>
                    <label className="block text-xs font-medium mb-1">Address</label>
                    <input type="text" name="address" value={form.address} onChange={handleChange} className="w-full border rounded px-2 py-1.5 text-sm" />
                </div>

                <div className="pt-2">
                    <p className="font-semibold mb-1">Select the location you would like to adopt:<span className="text-red-500">*</span></p>
                    <p className="text-xs text-gray-600 mb-1">
                        Please use the map or text box below to select the location you would like to adopt.
                    </p>
                    <a
                        href="/embed/map"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs underline"
                        style={{ color: "#1F6FEB" }}
                    >
                        Check out our Adopt-A-Street map to see which streets have already been adopted
                    </a>
                </div>

                <div className="flex gap-3">
                    <MethodOption
                        value="map"
                        label="Map (preferred method)"
                        selected={method === "map"}
                        onSelect={handleMethodChange}
                    />
                    <MethodOption
                        value="text"
                        label="Text"
                        selected={method === "text"}
                        onSelect={handleMethodChange}
                    />
                </div>

                {method === "map" && (
                    <div className="space-y-2 pt-1">
                        <div className="border rounded-md p-3 bg-gray-50 space-y-1.5">
                            <p className="text-xs font-semibold">Instructions:</p>
                            <p className="text-xs text-gray-600">Step 1. Zoom to the location you are adopting by:</p>
                            <ul className="text-xs text-gray-600 list-disc pl-8 space-y-0.5">
                                <li>Using + or –</li>
                                <li>Holding down ctrl while scrolling</li>
                                <li>Typing a nearby address in the search field on the map</li>
                            </ul>
                            <p className="text-xs text-gray-600">Step 2. Click once on the draw button, under the - .</p>
                            <p className="text-xs text-gray-600">
                                Step 3. Mark your street by drawing a line: click once on your starting point, move your
                                cursor along the street to the end point, then double-click on the end point.
                            </p>
                            <p className="text-xs text-gray-500">
                                Made a mistake? Use the edit or delete tool and redraw — only your final line is submitted.
                            </p>
                        </div>

                        <div className="rounded-md border overflow-visible">
                            <div className="p-2 border-b bg-white space-y-1">
                                <StreetSearch onSelect={handleMapLocationFound} placeholder="Find address or place" />
                                <button
                                    type="button"
                                    onClick={handleUseCurrentLocation}
                                    className="text-xs underline"
                                    style={{ color: "#1F6FEB" }}
                                >
                                    📍 Use current location
                                </button>
                            </div>

                            <div className="rounded-b-md overflow-hidden" style={{ height: "300px" }}>
                                <MapContainer
                                    center={SOUTH_INVERCARGILL_CENTER}
                                    zoom={15}
                                    style={{ width: "100%", height: "100%" }}
                                >
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    <DrawControl areaType="street" onGeometryChange={setGeometry} />
                                    <LocateControl position="topright" />
                                    <MapFlyTo position={pickedLocation?.position} radius={pickedLocation?.accuracy} />
                                    {pickedLocation && (
                                        <>
                                            {pickedLocation.accuracy && (
                                                <Circle
                                                    center={pickedLocation.position}
                                                    radius={pickedLocation.accuracy}
                                                    color="#1F6FEB"
                                                    weight={1}
                                                    fillColor="#1F6FEB"
                                                    fillOpacity={0.08}
                                                />
                                            )}
                                            <Marker position={pickedLocation.position}>
                                                <Popup>
                                                    {pickedLocation.accuracy
                                                        ? `${pickedLocation.label} (accurate to ~${Math.round(pickedLocation.accuracy)}m)`
                                                        : pickedLocation.label}
                                                </Popup>
                                            </Marker>
                                        </>
                                    )}
                                </MapContainer>
                            </div>
                        </div>

                        {form.street && (
                            <p className="text-xs text-gray-600">
                                Selected: <strong>{form.street}</strong>
                            </p>
                        )}

                        {pickedLocation?.accuracy > 150 && (
                            <p className="text-xs text-amber-600">
                                ⚠ Your device reported this location to within ~{Math.round(pickedLocation.accuracy)}m, which
                                isn't very precise (common on desktop browsers without GPS). Please check the shaded circle
                                on the map and search for your street or zoom in and draw manually if it looks off.
                            </p>
                        )}

                        {geometry && (
                            <p className="text-xs text-green-700">✓ Street drawn — ready to submit.</p>
                        )}
                    </div>
                )}

                {method === "text" && (
                    <div className="space-y-2 pt-1">
                        <label className="block text-sm font-medium">Search and select your street</label>
                        <p className="text-xs text-gray-500 ">
                            Note: Selecting a street here adopts the whole street. If you'd rather adopt just part of it, use the drawing tool on the map instead.
                        </p>
                        <StreetSearch onSelect={handleTextSelect} includeGeometry />

                        {form.street ? (
                            <div className="flex items-center justify-between border rounded px-2 py-1.5 bg-gray-50">
                                <span>
                                    <span className="text-gray-500">Adopting: </span>
                                    <strong>{form.street}</strong>
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setForm((prev) => ({ ...prev, street: "" }));
                                        setGeometry(null);
                                        setPickedLocation(null);
                                    }}
                                    className="text-xs underline text-gray-500"
                                >
                                    Clear
                                </button>
                            </div>
                        ) : (
                            <p className="text-xs text-gray-500">Search above and select your street from the results.</p>
                        )}

                        {pickedLocation && (
                            <div className="rounded-md overflow-hidden border" style={{ height: "200px" }}>
                                <MapContainer
                                    center={pickedLocation.position}
                                    zoom={16}
                                    style={{ width: "100%", height: "100%" }}
                                    dragging={false}
                                    scrollWheelZoom={false}
                                    doubleClickZoom={false}
                                >
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    <Marker position={pickedLocation.position}>
                                        <Popup>{pickedLocation.label}</Popup>
                                    </Marker>
                                </MapContainer>
                            </div>
                        )}

                        {geometry && (
                            <p className="text-xs text-green-700">✓ Location found.</p>
                        )}
                    </div>
                )}

                <label className="flex items-start gap-2 text-xs pt-1">
                    <input type="checkbox" name="consent" checked={form.consent} onChange={handleChange} className="mt-0.5" />
                    I consent to South Alive storing my contact details for the purpose of coordinating this street adoption.
                </label>

                <button
                    type="submit"
                    disabled={!form.consent || submitting}
                    className="w-full py-1.5 rounded font-medium text-sm disabled:opacity-50"
                    style={{ backgroundColor: "#FFD401", color: "#1F2937", marginBottom: "1rem" }}
                >
                    {submitting ? "Submitting…" : "SUBMIT"}
                </button>
            </form>
        </div>
    );
}
