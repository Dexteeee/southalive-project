import { useEffect, useState } from "react";
import { getAdoptionUpdates, addAdoptionUpdate } from "../services/api";

export default function AdoptionUpdatesModal({ area, onClose }) {
    const [updates, setUpdates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [newYear, setNewYear] = useState(new Date().getFullYear());
    const [newNotes, setNewNotes] = useState("");
    const [saving, setSaving] = useState(false);

    const loadUpdates = () => {
        setLoading(true);
        getAdoptionUpdates(area.areaId)
            .then(setUpdates)
            .catch(() => setError("Unable to load update history."))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadUpdates();
    }, [area.areaId]);

    const handleAdd = async () => {
        if (!newNotes.trim()) return;
        setSaving(true);
        setError(null);
        try {
            await addAdoptionUpdate(area.areaId, { logYear: Number(newYear), notes: newNotes });
            setNewNotes("");
            loadUpdates();
        } catch {
            setError("Failed to add update. This area may not have an active adoption.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-md p-6 w-full max-w-md max-h-[85vh] overflow-y-auto">
                <h3 className="text-lg font-display font-semibold mb-1">{area.areaName}</h3>
                <p className="text-sm text-ink/60 mb-4">Yearly update log</p>

                {error && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mb-3">
                        {error}
                    </p>
                )}

                {loading ? (
                    <p className="text-sm text-ink/50">Loading…</p>
                ) : updates.length === 0 ? (
                    <p className="text-sm text-ink/50 mb-4">No updates logged yet.</p>
                ) : (
                    <div className="space-y-3 mb-5">
                        {updates.map((u) => (
                            <div key={u.updateId} className="border-b border-line pb-2">
                                <p className="text-sm font-medium text-ink">{u.logYear}</p>
                                <p className="text-sm text-ink/70">{u.notes || "—"}</p>
                            </div>
                        ))}
                    </div>
                )}

                <div className="border-t border-line pt-4">
                    <p className="text-xs font-medium mb-2">Add new update(Enter year and notes)</p>
                    <div className="flex gap-2 mb-2">
                        <input
                            type="number"
                            className="w-24 border border-line rounded-sm px-2 py-1.5 text-sm"
                            value={newYear}
                            onChange={(e) => setNewYear(e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="Notes (e.g. still active, cleaned monthly)"
                            className="flex-1 border border-line rounded-sm px-2 py-1.5 text-sm"
                            value={newNotes}
                            onChange={(e) => setNewNotes(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleAdd}
                        disabled={saving || !newNotes.trim()}
                        className="text-sm px-3 py-1.5 rounded-sm font-medium disabled:opacity-50"
                        style={{ backgroundColor: "#FFD401", color: "#1C2B26" }}
                    >
                        {saving ? "Saving…" : "Add update"}
                    </button>
                </div>

                <div className="flex justify-end mt-5">
                    <button onClick={onClose} className="text-sm px-4 py-2 rounded-sm border border-line">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}