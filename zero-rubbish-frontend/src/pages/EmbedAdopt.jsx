// src/pages/EmbedAdopt.jsx
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { registerVolunteer } from "../services/api";

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
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.consent) return;

        setSubmitting(true);
        setError(null);

        try {
            await registerVolunteer({
                name: form.name,
                phoneNo: form.phone,
                emailAddress: form.email,
                address: form.address,
                requestedAreaName: form.street,
            });
            setSubmitted(true);
        } catch (err) {
            setError("Something went wrong submitting your request. Please try again.");
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
        <form onSubmit={handleSubmit} className="max-w-sm mx-auto mt-6 space-y-3 px-4 text-sm">
            <h2 className="text-lg font-semibold">Adopt-a-Street Application Form</h2>

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
                <label className="block text-xs font-medium mb-1">Address <span className="text-gray-400 font-normal">(optional)</span></label>
                <input type="text" name="address" value={form.address} onChange={handleChange} className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>

            <div>
                <label className="block text-xs font-medium mb-1">Street to adopt</label>
                <input type="text" name="street" required value={form.street} onChange={handleChange} className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>

            <label className="flex items-start gap-2 text-xs">
                <input type="checkbox" name="consent" checked={form.consent} onChange={handleChange} className="mt-0.5" />
                I consent to South Alive storing my contact details for the purpose of coordinating this street adoption.
            </label>

            <button
                type="submit"
                disabled={!form.consent || submitting}
                className="w-full py-1.5 rounded font-medium text-sm disabled:opacity-50"
                style={{ backgroundColor: "#FFD401", color: "#1F2937" }}
            >
                {submitting ? "Submitting…" : "Submit request"}
            </button>
        </form>
    );
}