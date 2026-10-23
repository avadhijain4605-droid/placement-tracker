import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
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

export default function StudentApplications() {
  const { student } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    if (!student) return;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const params = statusFilter ? { status: statusFilter } : {};
        const data = await api.listApplications(params);
        setApplications(data.applications || []);
      } catch (err) {
        setError(err.message || "Could not load applications.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [student, statusFilter]);

  if (!student) return <Navigate to="/login" replace />;

  async function handleWithdraw(id) {
    if (!confirm("Are you sure you want to withdraw this application?")) return;
    try {
      await api.withdrawApplication(id);
      setApplications((prev) => prev.map((a) => a._id === id ? { ...a, status: "withdrawn" } : a));
    } catch (err) {
      alert(err.message || "Could not withdraw.");
    }
  }

  return (
    <div>
      <PageHeader
        title="My Applications"
        subtitle="Track the status of your placement applications."
      />

      <div className="mb-4">
        <select className="input sm:w-48" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="applied">Applied</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="assessment">Assessment</option>
          <option value="interview">Interview</option>
          <option value="selected">Selected</option>
          <option value="rejected">Rejected</option>
          <option value="withdrawn">Withdrawn</option>
        </select>
      </div>

      {error && <div className="card p-4 border-red-200 bg-red-50 mb-4"><p className="text-sm text-red-700">{error}</p></div>}

      {loading && <div className="card p-8 text-center text-slate-500">Loading...</div>}

      {!loading && !error && applications.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">📝</p>
          <h3 className="text-lg font-semibold text-slate-700 mb-1">No applications yet</h3>
          <p className="text-sm text-slate-500">Browse placement opportunities and apply!</p>
          <Link to="/opportunities" className="btn-primary mt-4 inline-block">Browse Opportunities</Link>
        </div>
      )}

      {!loading && !error && applications.length > 0 && (
        <div className="space-y-3">
          {applications.map((app) => (
            <div key={app._id} className="card p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="font-semibold text-slate-900">{app.drive?.jobTitle || "—"}</h3>
                  <p className="text-sm text-slate-500">{app.company?.name || "—"}</p>
                  <p className="text-xs text-slate-400 mt-1">Applied on {new Date(app.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${STATUS_STYLES[app.status] || STATUS_STYLES.applied}`}>
                    {app.status}
                  </span>
                  {app.status !== "withdrawn" && app.status !== "selected" && app.status !== "rejected" && (
                    <button onClick={() => handleWithdraw(app._id)} className="text-xs text-red-600 hover:underline">
                      Withdraw
                    </button>
                  )}
                </div>
              </div>

              {app.statusHistory?.length > 0 && (
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <p className="text-xs font-medium text-slate-500 uppercase mb-2">Status History</p>
                  <div className="space-y-1.5">
                    {app.statusHistory.map((h, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className={`px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[h.status] || "bg-slate-100 text-slate-600"}`}>
                          {h.status}
                        </span>
                        <span className="text-slate-400">{new Date(h.changedAt).toLocaleDateString()}</span>
                        {h.note && <span className="text-slate-500">— {h.note}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {app.coverNote && (
                <div className="mt-3 text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
                  <span className="font-medium text-slate-700">Cover note: </span>{app.coverNote}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
