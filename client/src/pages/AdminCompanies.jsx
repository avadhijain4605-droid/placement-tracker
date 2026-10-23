import { useState, useEffect, useCallback } from "react";
import { Link, Navigate } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api.js";

export default function AdminCompanies() {
  const { student } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [archivingId, setArchivingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const isAdmin = student?.role === "admin" || student?.role === "super_admin";
  if (!student) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { archived: "true" };
      if (search) params.q = search;
      const data = await api.listCompanies(params);
      setCompanies(data.companies || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleArchive(id) {
    if (!confirm("Archive this company? It will be hidden from students but retained in the database.")) return;
    setArchivingId(id);
    try {
      await api.archiveCompany(id);
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setArchivingId(null);
    }
  }

  function startEdit(c) {
    setEditingId(c._id);
    setEditForm({
      name: c.name || "",
      industry: c.industry || "",
      headquarters: c.headquarters || "",
      website: c.website || "",
      description: c.description || "",
      logoUrl: c.logoUrl || "",
      recruiterName: c.recruiterContact?.name || "",
      recruiterEmail: c.recruiterContact?.email || "",
      recruiterPhone: c.recruiterContact?.phone || "",
    });
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateCompany(editingId, {
        name: editForm.name,
        industry: editForm.industry,
        headquarters: editForm.headquarters,
        website: editForm.website,
        description: editForm.description,
        logoUrl: editForm.logoUrl,
        recruiterContact: {
          name: editForm.recruiterName,
          email: editForm.recruiterEmail,
          phone: editForm.recruiterPhone,
        },
      });
      setEditingId(null);
      setEditForm(null);
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Manage Companies"
        subtitle="Edit company details and recruiter contacts."
        actions={<Link to="/companies" className="btn-secondary">View as Student</Link>}
      />

      <div className="mb-4">
        <input className="input" placeholder="Search companies..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {error && <div className="card p-4 border-red-200 bg-red-50 mb-4"><p className="text-sm text-red-700">{error}</p></div>}

      {loading && <div className="card p-8 text-center text-slate-500">Loading...</div>}

      {!loading && !error && companies.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">🏢</p>
          <h3 className="text-lg font-semibold text-slate-700 mb-1">No companies found</h3>
        </div>
      )}

      {!loading && !error && companies.length > 0 && (
        <div className="space-y-3">
          {companies.map((c) => (
            <div key={c._id} className="card p-5">
              {editingId === c._id && editForm ? (
                <form onSubmit={handleSaveEdit} className="space-y-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <input className="input" placeholder="Name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
                    <input className="input" placeholder="Industry" value={editForm.industry} onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })} />
                    <input className="input" placeholder="Headquarters" value={editForm.headquarters} onChange={(e) => setEditForm({ ...editForm, headquarters: e.target.value })} />
                    <input className="input" placeholder="Website" value={editForm.website} onChange={(e) => setEditForm({ ...editForm, website: e.target.value })} />
                  </div>
                  <textarea className="input min-h-16" placeholder="Description" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-xs font-medium text-slate-500 uppercase mb-2">Recruiter Contact</p>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <input className="input" placeholder="Name" value={editForm.recruiterName} onChange={(e) => setEditForm({ ...editForm, recruiterName: e.target.value })} />
                      <input className="input" placeholder="Email" value={editForm.recruiterEmail} onChange={(e) => setEditForm({ ...editForm, recruiterEmail: e.target.value })} />
                      <input className="input" placeholder="Phone" value={editForm.recruiterPhone} onChange={(e) => setEditForm({ ...editForm, recruiterPhone: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
                    <button type="button" className="btn-secondary" onClick={() => { setEditingId(null); setEditForm(null); }}>Cancel</button>
                  </div>
                </form>
              ) : (
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h3 className="font-semibold text-slate-900">{c.name}</h3>
                    <p className="text-sm text-slate-500">{c.industry} • {c.headquarters || "—"}</p>
                    {c.archived && <span className="mt-1 inline-block text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">Archived</span>}
                    {c.recruiterContact?.name && (
                      <p className="mt-2 text-xs text-slate-400">Recruiter: {c.recruiterContact.name} • {c.recruiterContact.email || c.recruiterContact.phone || "—"}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/companies/${c._id}`} className="text-xs text-brand-600 hover:underline">View</Link>
                    <button onClick={() => startEdit(c)} className="text-xs text-slate-600 hover:underline">Edit</button>
                    {!c.archived && (
                      <button onClick={() => handleArchive(c._id)} disabled={archivingId === c._id} className="text-xs text-red-600 hover:underline">
                        {archivingId === c._id ? "..." : "Archive"}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
