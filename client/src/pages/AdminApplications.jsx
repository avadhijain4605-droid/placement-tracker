import { useState, useEffect, useCallback } from "react";
import { Navigate } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api.js";

const STATUS_STYLES = {
  applied: "bg-blue-100 text-blue-700",
  shortlisted: "bg-cyan-100 text-cyan-700",
  assessment: "bg-purple-100 text-purple-700",
  interview: "bg-indigo-100 text-indigo-700",
  selected: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  withdrawn: "bg-slate-100 text-slate-600",
};

const STATUSES = ["applied", "shortlisted", "assessment", "interview", "selected", "rejected", "withdrawn"];

export default function AdminApplications() {
  const { student, loading: authLoading } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const isAdmin = student?.role === "admin" || student?.role === "super_admin";
  if (authLoading) return <div className="text-center py-16 text-slate-500">Loading...</div>;
  if (!student) return <Navigate to="/admin/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const data = await api.listApplications(params);
      setApplications(data.applications || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleStatusUpdate(id, newStatus) {
    setUpdatingId(id);
    try {
      const data = await api.updateApplicationStatus(id, newStatus, "");
      setApplications((prev) => prev.map((a) => a._id === id ? { ...a, status: newStatus, statusHistory: data.application.statusHistory } : a));
    } catch (err) {
      alert(err.message || "Failed to update status.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div>
      <PageHeader title="Student Applications" subtitle="Review and update application statuses." />

      <div className="mb-4">
        <select className="input sm:w-48" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {error && <div className="card p-4 border-red-200 bg-red-50 mb-4"><p className="text-sm text-red-700">{error}</p></div>}

      {loading && <div className="card p-8 text-center text-slate-500">Loading...</div>}

      {!loading && !error && applications.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">📭</p>
          <h3 className="text-lg font-semibold text-slate-700 mb-1">No applications found</h3>
          <p className="text-sm text-slate-500">Applications will appear here once students start applying.</p>
        </div>
      )}

      {!loading && !error && applications.length > 0 && (
        <div className="space-y-3">
          {applications.map((app) => (
            <div key={app._id} className="card p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="font-semibold text-slate-900">{app.student?.name || "—"}</h3>
                  <p className="text-sm text-slate-500">{app.student?.email}</p>
                  <p className="text-sm text-slate-600 mt-1">{app.drive?.jobTitle} • {app.company?.name}</p>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-400">
                    {app.student?.branch && <span>Branch: {app.student.branch}</span>}
                    {app.student?.cgpa != null && <span>CGPA: {app.student.cgpa}</span>}
                    {app.student?.graduationYear && <span>Year: {app.student.graduationYear}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${STATUS_STYLES[app.status]}`}>
                    {app.status}
                  </span>
                  <select
                    className="input sm:w-36 text-xs"
                    value={app.status}
                    onChange={(e) => handleStatusUpdate(app._id, e.target.value)}
                    disabled={updatingId === app._id || app.status === "withdrawn"}
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {app.coverNote && (
                <div className="mt-3 text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
                  <span className="font-medium text-slate-700">Cover note: </span>{app.coverNote}
                </div>
              )}

              {app.statusHistory?.length > 0 && (
                <details className="mt-3">
                  <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700">Status history ({app.statusHistory.length})</summary>
                  <div className="mt-2 space-y-1">
                    {app.statusHistory.map((h, i) => (
                      <div key={i} className="text-xs text-slate-500 flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full ${STATUS_STYLES[h.status] || "bg-slate-100"}`}>{h.status}</span>
                        <span>{new Date(h.changedAt).toLocaleDateString()}</span>
                        {h.note && <span>— {h.note}</span>}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
