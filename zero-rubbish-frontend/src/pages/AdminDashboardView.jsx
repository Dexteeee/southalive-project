import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getVolunteers, getAdminAreas } from "../services/api";

function StatCard({ label, value, color, to }) {
    const content = (
        <div className="bg-white border border-line rounded-md p-5 hover:shadow-md transition-shadow">
            <p className="text-sm text-ink/60 mb-1">{label}</p>
            <p className="text-3xl font-display font-semibold" style={{ color }}>
                {value}
            </p>
        </div>
    );
    return to ? <Link to={to}>{content}</Link> : content;
}

export default function AdminDashboardView() {
    const [volunteers, setVolunteers] = useState([]);
    const [areas, setAreas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        Promise.all([getVolunteers(), getAdminAreas()])
            .then(([volunteerData, areaData]) => {
                if (cancelled) return;
                setVolunteers(volunteerData);
                setAreas(areaData);
            })
            .catch(() => {
                if (!cancelled) setError("Unable to load dashboard data.");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const pendingCount = volunteers.filter((v) => v.status === "Pending").length;
    const approvedCount = volunteers.filter((v) => v.status === "Approved").length;
    const rejectedCount = volunteers.filter((v) => v.status === "Rejected").length;
    const areaCount = areas.length;

    const recentPending = volunteers
        .filter((v) => v.status === "Pending")
        .sort((a, b) => new Date(a.registrationDate) - new Date(b.registrationDate))
        .slice(0, 5);

    if (loading) {
        return (
            <div className="p-6 text-ink/60">Loading dashboard…</div>
        );
    }

    if (error) {
        return (
            <div className="p-6 text-red-600">{error}</div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-display font-semibold mb-6 text-ink">Admin Dashboard</h1>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard label="Pending registrations" value={pendingCount} color="#F2994A" to="/admin/volunteers?status=Pending" />
                <StatCard label="Approved volunteers" value={approvedCount} color="#07C160" to="/admin/volunteers?status=Approved" />
                <StatCard label="Rejected" value={rejectedCount} color="#94A3B8" to="/admin/volunteers?status=Rejected" />
                <StatCard label="Adopted streets" value={areaCount} color="#1C2B26" to="/admin/streets" />
            </div>

            <div className="bg-white border border-line rounded-md p-5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-display font-semibold text-ink">
                        Awaiting review
                    </h2>
                    {pendingCount > 5 && (
                        <Link to="/admin/volunteers?status=Pending" className="text-sm text-ink/60 hover:underline">
                            View all {pendingCount} →
                        </Link>
                    )}
                </div>

                {recentPending.length === 0 ? (
                    <p className="text-sm text-ink/50">No pending registrations right now.</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-ink/50 border-b border-line">
                                <th className="pb-2 font-medium">Name</th>
                                <th className="pb-2 font-medium">Requested area</th>
                                <th className="pb-2 font-medium">Submitted</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentPending.map((v) => (
                                <tr key={v.volunteerId} className="border-b border-line last:border-0">
                                    <td className="py-2">{v.name}</td>
                                    <td className="py-2">{v.requestedAreaName}</td>
                                    <td className="py-2 text-ink/60">
                                        {new Date(v.registrationDate).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                <Link
                    to="/admin/volunteers"
                    className="inline-block mt-4 text-sm font-medium py-2 px-4 rounded-sm"
                    style={{ backgroundColor: "#FFD401", color: "#1C2B26" }}
                >
                    Go to Volunteers →
                </Link>
            </div>
        </div>
    );
}