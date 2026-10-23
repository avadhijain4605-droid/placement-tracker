import { useState, useEffect, useCallback } from "react";
import { Navigate } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api.js";

const ROLE_STYLES = {
  student: "bg-blue-100 text-blue-700",
  admin: "bg-amber-100 text-amber-700",
  super_admin: "bg-purple-100 text-purple-700",
};

export default function AdminStudents() {
  const { student } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [gradYear, setGradYear] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [detailId, setDetailId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [actionId, setActionId] = useState(null);

  const isAdmin = student?.role === "admin" || student?.role === "super_admin";
  if (!student) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page, limit: 20 };
      if (search) params.q = search;
      if (gradYear) params.graduationYear = gradYear;
      const data = await api.adminStudents(params);
      setStudents(data.students || []);
      setTotalPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, gradYear, page]);

  useEffect(() => { load(); }, [load]);

  async function handleViewDetail(id) {
    if (detailId === id) { setDetailId(null); setDetail(null); return; }
    try {
      const data = await api.adminStudentDetail(id);
      setDetailId(id);
      setDetail(data.student);
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleSuspend(id) {
    if (!confirm("Suspend this student? They will lose access to their account.")) return;
    setActionId(id);
    try {
      await api.adminSuspendStudent(id);
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionId(null);
    }
  }

  async function handleReactivate(id) {
    if (!confirm("Reactivate this student account?")) return;
    setActionId(id);
    try {
      await api.adminReactivateStudent(id);
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionId(null);
    }
  }

  return (
    <div>
      <PageHeader title="Student Management" subtitle={`${total} registered student${total !== 1 ? "s" : ""} — view profiles, suspend or reactivate accounts.`} />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          className="input flex-1 min-w-40"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <input
          className="input w-32"
          type="number"
          placeholder="Grad Year"
          value={gradYear}
          onChange={(e) => { setGradYear(e.target.value); setPage(1); }}
        />
      </div>

      {error && <div className="card p-4 border-red-200 bg-red-50 mb-4"><p className="text-sm text-red-700">{error}</p></div>}

      {loading && <div className="card p-8 text-center text-slate-500">Loading students...</div>}

      {!loading && !error && students.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">🎓</p>
          <h3 className="text-lg font-semibold text-slate-700 mb-1">No students found</h3>
          <p className="text-sm text-slate-500">Try adjusting your search or filters.</p>
        </div>
      )}

      {!loading && !error && students.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-3 px-3 font-medium">Name</th>
                  <th className="py-3 px-3 font-medium">Email</th>
                  <th className="py-3 px-3 font-medium">Branch</th>
                  <th className="py-3 px-3 font-medium">Grad Year</th>
                  <th className="py-3 px-3 font-medium">CGPA</th>
                  <th className="py-3 px-3 font-medium">Role</th>
                  <th className="py-3 px-3 font-medium">Status</th>
                  <th className="py-3 px-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-3 font-medium text-slate-900">{s.name}</td>
                    <td className="py-3 px-3 text-slate-600">{s.email}</td>
                    <td className="py-3 px-3 text-slate-600">{s.branch || "—"}</td>
                    <td className="py-3 px-3 text-slate-600">{s.graduationYear || "—"}</td>
                    <td className="py-3 px-3 text-slate-600">{s.cgpa != null ? s.cgpa.toFixed(1) : "—"}</td>
                    <td className="py-3 px-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_STYLES[s.role] || ROLE_STYLES.student}`}>
                        {s.role}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {s.archived
                        ? <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">Suspended</span>
                        : <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Active</span>
                      }
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleViewDetail(s._id)} className="text-xs text-brand-600 hover:underline">
                          {detailId === s._id ? "Hide" : "View"}
                        </button>
                        {s.archived ? (
                          <button onClick={() => handleReactivate(s._id)} disabled={actionId === s._id} className="text-xs text-green-600 hover:underline disabled:opacity-50">
                            {actionId === s._id ? "..." : "Reactivate"}
                          </button>
                        ) : (
                          <button onClick={() => handleSuspend(s._id)} disabled={actionId === s._id} className="text-xs text-red-600 hover:underline disabled:opacity-50">
                            {actionId === s._id ? "..." : "Suspend"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {detail && detailId && (
            <div className="card p-6 mt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-900">{detail.name}</h3>
                <button onClick={() => { setDetailId(null); setDetail(null); }} className="text-sm text-slate-400 hover:text-slate-600">Close</button>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div><span className="text-xs text-slate-400">Email</span><p className="text-sm text-slate-700">{detail.email}</p></div>
                <div><span className="text-xs text-slate-400">College</span><p className="text-sm text-slate-700">{detail.college || "—"}</p></div>
                <div><span className="text-xs text-slate-400">Branch</span><p className="text-sm text-slate-700">{detail.branch || "—"}</p></div>
                <div><span className="text-xs text-slate-400">Graduation Year</span><p className="text-sm text-slate-700">{detail.graduationYear || "—"}</p></div>
                <div><span className="text-xs text-slate-400">CGPA</span><p className="text-sm text-slate-700">{detail.cgpa != null ? detail.cgpa.toFixed(1) : "—"}</p></div>
                <div><span className="text-xs text-slate-400">Backlogs</span><p className="text-sm text-slate-700">{detail.backlogs ?? 0}</p></div>
              </div>
              {detail.skills?.length > 0 && (
                <div className="mb-3">
                  <span className="text-xs text-slate-400">Skills</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {detail.skills.map((sk, i) => <span key={i} className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">{sk}</span>)}
                  </div>
                </div>
              )}
              {detail.projects?.length > 0 && (
                <div className="mb-3">
                  <span className="text-xs text-slate-400">Projects</span>
                  <div className="mt-1 space-y-1">
                    {detail.projects.map((p, i) => (
                      <div key={i} className="text-sm text-slate-700">
                        <span className="font-medium">{p.title}</span>
                        {p.description && <span className="text-slate-500"> — {p.description}</span>}
                        {p.link && <a href={p.link} target="_blank" rel="noreferrer" className="text-brand-600 text-xs ml-1">Link</a>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {detail.certifications?.length > 0 && (
                <div className="mb-3">
                  <span className="text-xs text-slate-400">Certifications</span>
                  <div className="mt-1 space-y-1">
                    {detail.certifications.map((c, i) => (
                      <div key={i} className="text-sm text-slate-700">
                        <span className="font-medium">{c.name}</span>
                        {c.issuer && <span className="text-slate-500"> — {c.issuer}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {detail.codingProfiles?.length > 0 && (
                <div>
                  <span className="text-xs text-slate-400">Coding Profiles</span>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {detail.codingProfiles.map((cp, i) => (
                      <a key={i} href={cp.url} target="_blank" rel="noreferrer" className="text-xs text-brand-600 hover:underline capitalize">{cp.platform}</a>
                    ))}
                  </div>
                </div>
              )}
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
