import { useCallback, useEffect, useState } from "react";
import { getAdminAreas, endAdoption } from "../services/api";
import AdoptionUpdatesModal from "../components/AdoptionUpdatesModal";

const TYPE_LABELS = {
    street: "Street",
    zone: "Zone",
};

export default function StreetsView() {
    const [areas, setAreas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updatesArea, setUpdatesArea] = useState(null);
    const [actionError, setActionError] = useState(null);

    const loadAreas = useCallback(() => {
        setLoading(true);
        setError(null);
        getAdminAreas()
            .then(setAreas)
            .catch(() => setError("Unable to load streets and zones."))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        loadAreas();
    }, [loadAreas]);

    const handleEndAdoption = async (area) => {
        if (
            !window.confirm(
                `End the adoption of "${area.areaName}"? It will no longer show as adopted on the public map, and will become available for a new volunteer.`
            )
        )
            return;

        setActionError(null);
        try {
            await endAdoption(area.areaId);
            loadAreas();
        } catch (err) {
            setActionError(
                err.response?.data?.message || "Failed to end this adoption."
            );
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-display font-semibold mb-6 text-ink">
                Streets &amp; Zones
            </h1>

            {actionError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mb-4">
                    {actionError}
                </p>
            )}

            {loading && <p className="text-ink/60">Loading…</p>}
            {error && <p className="text-red-600">{error}</p>}

            {!loading && !error && (
                <div className="bg-white border border-line rounded-md overflow-hidden">
                    {areas.length === 0 ? (
                        <p className="p-6 text-sm text-ink/50">
                            No adopted areas yet. Approve a volunteer registration to create one.
                        </p>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-ink/50 border-b border-line bg-paper">
                                    <th className="px-4 py-2 font-medium">Area name</th>
                                    <th className="px-4 py-2 font-medium">Type</th>
                                    <th className="px-4 py-2 font-medium">Status</th>
                                    <th className="px-4 py-2 font-medium">Adopted by</th>
                                    <th className="px-4 py-2 font-medium">Since</th>
                                    <th className="px-4 py-2 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {areas.map((a) => (
                                    <tr key={a.areaId} className="border-b border-line last:border-0">
                                        <td className="px-4 py-3">{a.areaName}</td>
                                        <td className="px-4 py-3 text-ink/70">
                                            {TYPE_LABELS[a.areaType] || a.areaType}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className="text-xs font-medium px-2 py-0.5 rounded-full"
                                                style={{
                                                    backgroundColor:
                                                        a.currentStatus === "adopted" ? "#07C16020" : "#94A3B820",
                                                    color: a.currentStatus === "adopted" ? "#07C160" : "#64748B",
                                                }}
                                            >
                                                {a.currentStatus}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {a.volunteerName ? (
                                                <div>
                                                    <div>{a.volunteerName}</div>
                                                    <div className="text-xs text-ink/50">{a.volunteerEmail}</div>
                                                </div>
                                            ) : (
                                                <span className="text-ink/40">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-ink/60">
                                            {a.startDate
                                                ? new Date(a.startDate).toLocaleDateString()
                                                : "—"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-2 flex-wrap">
                                                <button
                                                    className="text-xs px-2 py-1 rounded-sm border border-line"
                                                    onClick={() => setUpdatesArea(a)}
                                                >
                                                    View log
                                                </button>
                                                {a.currentStatus === "adopted" && (
                                                    <button
                                                        className="text-xs px-2 py-1 rounded-sm border border-red-200 text-red-600"
                                                        onClick={() => handleEndAdoption(a)}
                                                    >
                                                        End adoption
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {updatesArea && (
                <AdoptionUpdatesModal area={updatesArea} onClose={() => setUpdatesArea(null)} />
            )}
        </div>
    );
}