import { useState, useEffect, useCallback } from "react";
import { Navigate } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api.js";

export default function AdminAudit() {
  const { student, loading: authLoading } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState("");

  const isSuperAdmin = student?.role === "super_admin";
  if (authLoading) return <div className="text-center py-16 text-slate-500">Loading...</div>;
  if (!student) return <Navigate to="/admin/login" replace />;
  if (!isSuperAdmin) return <Navigate to="/admin/dashboard" replace />;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page, limit: 50 };
      if (actionFilter) params.action = actionFilter;
      const data = await api.adminAuditLogs(params);
      setLogs(data.logs || []);
      setTotalPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageHeader title="Audit Log" subtitle={`Total: ${total} entries. Super Admin only.`} />

      <div className="mb-4 flex gap-3">
        <select className="input sm:w-56" value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}>
          <option value="">All Actions</option>
          <option value="create_drive">Create Drive</option>
          <option value="update_drive">Update Drive</option>
          <option value="change_drive_status">Change Drive Status</option>
          <option value="archive_drive">Archive Drive</option>
          <option value="update_application_status">Update Application Status</option>
          <option value="create_announcement">Create Announcement</option>
          <option value="update_announcement">Update Announcement</option>
          <option value="delete_announcement">Delete Announcement</option>
          <option value="update_company">Update Company</option>
          <option value="archive_company">Archive Company</option>
          <option value="change_role">Change Role</option>
          <option value="archive_user">Archive User</option>
        </select>
      </div>

      {error && <div className="card p-4 border-red-200 bg-red-50 mb-4"><p className="text-sm text-red-700">{error}</p></div>}

      {loading && <div className="card p-8 text-center text-slate-500">Loading...</div>}

      {!loading && !error && logs.length > 0 && (
        <>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Action</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 hidden sm:table-cell">Actor</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Resource</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 hidden lg:table-cell">Details</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{log.action}</td>
                    <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">{log.actorName || log.actor}</td>
                    <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{log.resource}</td>
                    <td className="px-4 py-3 text-slate-500 hidden lg:table-cell max-w-xs truncate">{log.details}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
              <span className="text-sm text-slate-600">Page {page} of {totalPages}</span>
              <button className="btn-secondary" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          )}
        </>
      )}

      {!loading && !error && logs.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">📜</p>
          <h3 className="text-lg font-semibold text-slate-700 mb-1">No audit entries</h3>
          <p className="text-sm text-slate-500">Admin actions will be logged here.</p>
        </div>
      )}
    </div>
  );
}
