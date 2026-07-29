// src/pages/EmbedAdopt.jsx
import { useState } from "react";
import { useSearchParams } from "react-router-dom";

export default function EmbedAdopt() {
    const [searchParams] = useSearchParams();
    const prefilledStreet = searchParams.get("street") || "";

    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        street: prefilledStreet,
        consent: false,
    });
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.consent) return;

        // TEMPORARY: mock submit — replace with axios.post('/register', form) later
        console.log("Adoption request submitted:", form);
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <div className="max-w-md mx-auto mt-16 text-center px-4">
                <h2 className="text-xl font-semibold mb-2">Thanks, {form.name}!</h2>
                <p className="text-gray-600">
                    Your request to adopt <strong>{form.street}</strong> has been submitted.
                    A coordinator will review it shortly.
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-10 space-y-4 px-4">
            <h2 className="text-xl font-semibold">Adopt a Street</h2>

            <div>
                <label className="block text-sm font-medium mb-1">Full name</label>
                <input type="text" name="name" required value={form.name} onChange={handleChange} className="w-full border rounded px-3 py-2" />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input type="email" name="email" required value={form.email} onChange={handleChange} className="w-full border rounded px-3 py-2" />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input type="tel" name="phone" required value={form.phone} onChange={handleChange} className="w-full border rounded px-3 py-2" />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Street to adopt</label>
                <input type="text" name="street" required value={form.street} onChange={handleChange} className="w-full border rounded px-3 py-2" />
            </div>

            <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" name="consent" checked={form.consent} onChange={handleChange} className="mt-1" />
                I consent to South Alive storing my contact details for the purpose of coordinating this street adoption.
            </label>

            <button
                type="submit"
                disabled={!form.consent}
                className="w-full py-2 rounded font-medium disabled:opacity-50"
                style={{ backgroundColor: "#FFD401", color: "#1F2937" }}
            >
                Submit request
            </button>
        </form>
    );
}