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

export default function AdminUsers() {
  const { student, loading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [changingId, setChangingId] = useState(null);

  const isSuperAdmin = student?.role === "super_admin";
  if (authLoading) return <div className="text-center py-16 text-slate-500">Loading...</div>;
  if (!student) return <Navigate to="/admin/login" replace />;
  if (!isSuperAdmin) return <Navigate to="/admin/dashboard" replace />;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.adminUsers();
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRoleChange(id, role) {
    if (id === student._id && role !== "super_admin") {
      alert("You cannot demote yourself.");
      return;
    }
    if (!confirm(`Change this user's role to ${role}?`)) return;
    setChangingId(id);
    try {
      await api.adminChangeRole(id, role);
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, role } : u));
    } catch (err) {
      alert(err.message);
    } finally {
      setChangingId(null);
    }
  }

  async function handleArchive(id) {
    if (id === student._id) { alert("You cannot archive yourself."); return; }
    if (!confirm("Archive this user? They will lose access.")) return;
    try {
      await api.adminArchiveUser(id);
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, archived: true } : u));
    } catch (err) {
      alert(err.message);
    }
  }

  const filtered = users.filter((u) =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="User Management" subtitle="Manage user roles and access. Super Admin only." />

      <div className="mb-4">
        <input className="input" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {error && <div className="card p-4 border-red-200 bg-red-50 mb-4"><p className="text-sm text-red-700">{error}</p></div>}

      {loading && <div className="card p-8 text-center text-slate-500">Loading...</div>}

      {!loading && !error && filtered.length > 0 && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 hidden sm:table-cell">Email</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Role</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((u) => (
                <tr key={u._id} className={`hover:bg-slate-50 ${u.archived ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3">
                    <span className="font-medium text-slate-900">{u.name}</span>
                    {u.archived && <span className="ml-2 text-xs text-red-600">(archived)</span>}
                    <p className="text-xs text-slate-400 sm:hidden">{u.email}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${ROLE_STYLES[u.role] || ROLE_STYLES.student}`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <select
                      className="input sm:w-32 text-xs"
                      value={u.role}
                      onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      disabled={changingId === u._id || u.archived}
                    >
                      <option value="student">Student</option>
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                    {!u.archived && u._id !== student._id && (
                      <button onClick={() => handleArchive(u._id)} className="ml-2 text-xs text-red-600 hover:underline">Archive</button>
                    )}
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
