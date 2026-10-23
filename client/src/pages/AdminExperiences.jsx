import { useState, useEffect, useCallback } from "react";
import { Navigate } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api.js";

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  approved: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

const OUTCOME_STYLES = {
  offered: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  "in-progress": "bg-blue-100 text-blue-700",
  withdrawn: "bg-slate-100 text-slate-600",
};

export default function AdminExperiences() {
  const { student, loading: authLoading } = useAuth();
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionId, setActionId] = useState(null);
  const [previewId, setPreviewId] = useState(null);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const isAdmin = student?.role === "admin" || student?.role === "super_admin";
  if (authLoading) return <div className="text-center py-16 text-slate-500">Loading...</div>;
  if (!student) return <Navigate to="/admin/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { status: statusFilter, page, limit: 20 };
      if (search) params.q = search;
      const data = await api.adminExperiences(params);
      setExperiences(data.experiences || []);
      setTotalPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, page]);

  useEffect(() => { load(); }, [load]);

  async function handleModerate(id, status) {
    if (status === "rejected") {
      setRejectId(id);
      setRejectReason("");
      return;
    }
    setActionId(id);
    try {
      await api.moderateExperience(id, status);
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionId(null);
    }
  }

  async function handleConfirmReject() {
    if (!rejectId) return;
    setActionId(rejectId);
    try {
      await api.moderateExperience(rejectId, "rejected", rejectReason);
      setRejectId(null);
      setRejectReason("");
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionId(null);
    }
  }

  const previewExp = experiences.find((e) => e._id === previewId);

  return (
    <div>
      <PageHeader title="Experience Moderation" subtitle={`${total} submission${total !== 1 ? "s" : ""} — review and approve student-submitted placement experiences.`} />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex gap-1">
          {["pending", "approved", "rejected"].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition capitalize ${
                statusFilter === s ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <input
          className="input flex-1 min-w-40"
          placeholder="Search student name or role..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {error && <div className="card p-4 border-red-200 bg-red-50 mb-4"><p className="text-sm text-red-700">{error}</p></div>}

      {loading && <div className="card p-8 text-center text-slate-500">Loading experiences...</div>}

      {!loading && !error && experiences.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">📋</p>
          <h3 className="text-lg font-semibold text-slate-700 mb-1">No {statusFilter} experiences</h3>
          <p className="text-sm text-slate-500">New submissions will appear here for review.</p>
        </div>
      )}

      {!loading && !error && experiences.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-3 px-3 font-medium">Student</th>
                  <th className="py-3 px-3 font-medium">Company</th>
                  <th className="py-3 px-3 font-medium">Role</th>
                  <th className="py-3 px-3 font-medium">Outcome</th>
                  <th className="py-3 px-3 font-medium">Status</th>
                  <th className="py-3 px-3 font-medium">Submitted</th>
                  <th className="py-3 px-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {experiences.map((e) => (
                  <tr key={e._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-3 font-medium text-slate-900">{e.studentName}</td>
                    <td className="py-3 px-3 text-slate-600">{e.company?.name || "—"}</td>
                    <td className="py-3 px-3 text-slate-600">{e.role}</td>
                    <td className="py-3 px-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${OUTCOME_STYLES[e.outcome] || "bg-slate-100 text-slate-600"}`}>
                        {e.outcome}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${STATUS_STYLES[e.moderationStatus] || STATUS_STYLES.pending}`}>
                        {e.moderationStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-400">
                      {e.postedAt ? new Date(e.postedAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setPreviewId(previewId === e._id ? null : e._id)} className="text-xs text-brand-600 hover:underline">
                          {previewId === e._id ? "Hide" : "Preview"}
                        </button>
                        {e.moderationStatus !== "approved" && (
                          <button onClick={() => handleModerate(e._id, "approved")} disabled={actionId === e._id} className="text-xs text-green-600 hover:underline disabled:opacity-50">
                            {actionId === e._id ? "..." : "Approve"}
                          </button>
                        )}
                        {e.moderationStatus !== "rejected" && (
                          <button onClick={() => handleModerate(e._id, "rejected")} disabled={actionId === e._id} className="text-xs text-red-600 hover:underline disabled:opacity-50">
                            {actionId === e._id ? "..." : "Reject"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {previewExp && (
            <div className="card p-6 mt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-900">Preview — {previewExp.studentName}</h3>
                <button onClick={() => setPreviewId(null)} className="text-sm text-slate-400 hover:text-slate-600">Close</button>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div><span className="text-xs text-slate-400">Company</span><p className="text-sm text-slate-700">{previewExp.company?.name || "—"}</p></div>
                <div><span className="text-xs text-slate-400">Role</span><p className="text-sm text-slate-700">{previewExp.role}</p></div>
                <div><span className="text-xs text-slate-400">Package</span><p className="text-sm text-slate-700">{previewExp.package || "—"}</p></div>
                <div><span className="text-xs text-slate-400">Difficulty</span><p className="text-sm text-slate-700 capitalize">{previewExp.difficulty}</p></div>
              </div>
              {previewExp.overallExperience && (
                <div className="mb-3">
                  <span className="text-xs text-slate-400">Overall Experience</span>
                  <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{previewExp.overallExperience}</p>
                </div>
              )}
              {previewExp.tips && (
                <div className="mb-3">
                  <span className="text-xs text-slate-400">Tips</span>
                  <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{previewExp.tips}</p>
                </div>
              )}
              {previewExp.rounds?.length > 0 && (
                <div>
                  <span className="text-xs text-slate-400">Rounds</span>
                  <div className="mt-1 space-y-2">
                    {previewExp.rounds.map((r, i) => (
                      <div key={i} className="p-3 rounded-lg bg-slate-50">
                        <p className="text-sm font-medium text-slate-800">{r.name || `Round ${i + 1}`} <span className="text-xs text-slate-400 capitalize">({r.type})</span></p>
                        {r.details && <p className="text-sm text-slate-600 mt-1">{r.details}</p>}
                        {r.questionsAsked?.length > 0 && (
                          <ul className="mt-1 text-sm text-slate-500 list-disc list-inside">
                            {r.questionsAsked.map((q, j) => <li key={j}>{q}</li>)}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {previewExp.moderationStatus === "rejected" && previewExp.rejectionReason && (
                <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200">
                  <span className="text-xs text-red-400">Rejection Reason</span>
                  <p className="text-sm text-red-700 mt-1">{previewExp.rejectionReason}</p>
                </div>
              )}
            </div>
          )}

          {rejectId && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Reject Submission</h3>
                <p className="text-sm text-slate-500 mb-4">Provide a reason for rejection (optional but recommended).</p>
                <textarea
                  className="input min-h-20"
                  placeholder="e.g. Insufficient detail about interview rounds..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
                <div className="flex gap-2 mt-4">
                  <button onClick={handleConfirmReject} className="btn-primary" disabled={actionId === rejectId}>
                    {actionId === rejectId ? "Rejecting..." : "Confirm Reject"}
                  </button>
                  <button onClick={() => { setRejectId(null); setRejectReason(""); }} className="btn-secondary">Cancel</button>
                </div>
              </div>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="btn-secondary disabled:opacity-50">Prev</button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="btn-secondary disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
