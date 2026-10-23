import { useState, useEffect, useCallback } from "react";
import { Link, Navigate } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api.js";

const STATUS_STYLES = {
  draft: "bg-slate-100 text-slate-600",
  published: "bg-green-100 text-green-700",
  closed: "bg-amber-100 text-amber-700",
  archived: "bg-red-100 text-red-700",
};

export default function AdminDrives() {
  const { student, loading: authLoading } = useAuth();
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const isAdmin = student?.role === "admin" || student?.role === "super_admin";
  if (authLoading) return <div className="text-center py-16 text-slate-500">Loading...</div>;
  if (!student) return <Navigate to="/admin/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (search) params.q = search;
      const data = await api.listDrives(params);
      setDrives(data.drives || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleStatusChange(id, newStatus) {
    try {
      await api.updateDriveStatus(id, newStatus);
      setDrives((prev) => prev.map((d) => d._id === id ? { ...d, status: newStatus } : d));
    } catch (err) {
      alert(err.message || "Failed to update status.");
    }
  }

  async function handleArchive(id) {
    if (!confirm("Are you sure you want to archive this drive?")) return;
    try {
      await api.deleteDrive(id);
      setDrives((prev) => prev.map((d) => d._id === id ? { ...d, status: "archived" } : d));
    } catch (err) {
      alert(err.message || "Failed to archive.");
    }
  }

  return (
    <div>
      <PageHeader
        title="Placement Drives"
        subtitle="Create, publish, and manage placement drives."
        actions={<Link to="/admin/drives/new" className="btn-primary">+ New Drive</Link>}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input className="input flex-1" placeholder="Search by job title..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input sm:w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="closed">Closed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {error && <div className="card p-4 border-red-200 bg-red-50 mb-4"><p className="text-sm text-red-700">{error}</p></div>}

      {loading && <div className="card p-8 text-center text-slate-500">Loading...</div>}

      {!loading && !error && drives.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">📋</p>
          <h3 className="text-lg font-semibold text-slate-700 mb-1">No drives yet</h3>
          <Link to="/admin/drives/new" className="btn-primary mt-4 inline-block">Create your first drive</Link>
        </div>
      )}

      {!loading && !error && drives.length > 0 && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Job Title</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 hidden sm:table-cell">Company</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Deadline</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {drives.map((d) => (
                <tr key={d._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link to={`/admin/drives/${d._id}/edit`} className="font-medium text-slate-900 hover:text-brand-600">{d.jobTitle}</Link>
                    <p className="text-xs text-slate-400 sm:hidden">{d.company?.name}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">{d.company?.name || "—"}</td>
                  <td className="px-4 py-3 text-slate-600 hidden md:table-cell">
                    {d.applicationDeadline ? new Date(d.applicationDeadline).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_STYLES[d.status]}`}>{d.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {d.status === "draft" && (
                        <button onClick={() => handleStatusChange(d._id, "published")} className="text-xs text-green-600 hover:underline">Publish</button>
                      )}
                      {d.status === "published" && (
                        <button onClick={() => handleStatusChange(d._id, "closed")} className="text-xs text-amber-600 hover:underline">Close</button>
                      )}
                      {d.status !== "archived" && (
                        <button onClick={() => handleArchive(d._id)} className="text-xs text-red-600 hover:underline">Archive</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
