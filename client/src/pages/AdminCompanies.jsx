import { useState, useEffect, useCallback } from "react";
import { Link, Navigate } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api.js";

const emptyForm = {
  name: "",
  industry: "",
  headquarters: "",
  website: "",
  description: "",
  logoUrl: "",
  recruiterName: "",
  recruiterEmail: "",
  recruiterPhone: "",
};

export default function AdminCompanies() {
  const { student } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [archivingId, setArchivingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const isAdmin = student?.role === "admin" || student?.role === "super_admin";
  if (!student) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const pageSize = 10;

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

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(companies.length / pageSize);
  const paginated = companies.slice((page - 1) * pageSize, page * pageSize);

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

  async function handleDelete(id) {
    if (!confirm("Permanently delete this company? This cannot be undone. Placement experiences referencing this company will have their company reference removed.")) return;
    setDeletingId(id);
    try {
      await api.deleteCompany(id);
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingId(null);
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

  async function handleCreate(e) {
    e.preventDefault();
    if (!createForm.name.trim()) {
      setCreateError("Company name is required.");
      return;
    }
    setCreating(true);
    setCreateError("");
    try {
      await api.createCompany({
        name: createForm.name,
        industry: createForm.industry,
        headquarters: createForm.headquarters,
        website: createForm.website,
        description: createForm.description,
        logoUrl: createForm.logoUrl,
        recruiterContact: {
          name: createForm.recruiterName,
          email: createForm.recruiterEmail,
          phone: createForm.recruiterPhone,
        },
      });
      setShowCreate(false);
      setCreateForm(emptyForm);
      await load();
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Manage Companies"
        subtitle="Add, edit, archive, or delete company records."
        actions={
          <div className="flex gap-2">
            <button onClick={() => setShowCreate(!showCreate)} className="btn-primary">
              {showCreate ? "Cancel" : "+ Add Company"}
            </button>
            <Link to="/companies" className="btn-secondary">View as Student</Link>
          </div>
        }
      />

      {showCreate && (
        <form onSubmit={handleCreate} className="card p-6 mb-4 space-y-3">
          <h3 className="font-semibold text-slate-900">Add New Company</h3>
          {createError && <div className="p-3 rounded-lg bg-red-50 border border-red-200"><p className="text-sm text-red-700">{createError}</p></div>}
          <div className="grid sm:grid-cols-2 gap-3">
            <input className="input" placeholder="Company name *" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} required />
            <input className="input" placeholder="Industry" value={createForm.industry} onChange={(e) => setCreateForm({ ...createForm, industry: e.target.value })} />
            <input className="input" placeholder="Headquarters" value={createForm.headquarters} onChange={(e) => setCreateForm({ ...createForm, headquarters: e.target.value })} />
            <input className="input" placeholder="Website" value={createForm.website} onChange={(e) => setCreateForm({ ...createForm, website: e.target.value })} />
          </div>
          <textarea className="input min-h-16" placeholder="Description" value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} />
          <input className="input" placeholder="Logo URL" value={createForm.logoUrl} onChange={(e) => setCreateForm({ ...createForm, logoUrl: e.target.value })} />
          <div className="border-t border-slate-100 pt-3">
            <p className="text-xs font-medium text-slate-500 uppercase mb-2">Recruiter Contact (admin only)</p>
            <div className="grid sm:grid-cols-3 gap-3">
              <input className="input" placeholder="Name" value={createForm.recruiterName} onChange={(e) => setCreateForm({ ...createForm, recruiterName: e.target.value })} />
              <input className="input" placeholder="Email" value={createForm.recruiterEmail} onChange={(e) => setCreateForm({ ...createForm, recruiterEmail: e.target.value })} />
              <input className="input" placeholder="Phone" value={createForm.recruiterPhone} onChange={(e) => setCreateForm({ ...createForm, recruiterPhone: e.target.value })} />
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={creating}>{creating ? "Creating..." : "Create Company"}</button>
        </form>
      )}

      <div className="mb-4">
        <input className="input" placeholder="Search companies..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>

      {error && <div className="card p-4 border-red-200 bg-red-50 mb-4"><p className="text-sm text-red-700">{error}</p></div>}

      {loading && <div className="card p-8 text-center text-slate-500">Loading...</div>}

      {!loading && !error && companies.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">🏢</p>
          <h3 className="text-lg font-semibold text-slate-700 mb-1">No companies found</h3>
          <p className="text-sm text-slate-500">Click "Add Company" to create one.</p>
        </div>
      )}

      {!loading && !error && companies.length > 0 && (
        <>
          <div className="space-y-3">
            {paginated.map((c) => (
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
                        <button onClick={() => handleArchive(c._id)} disabled={archivingId === c._id} className="text-xs text-amber-600 hover:underline">
                          {archivingId === c._id ? "..." : "Archive"}
                        </button>
                      )}
                      <button onClick={() => handleDelete(c._id)} disabled={deletingId === c._id} className="text-xs text-red-600 hover:underline">
                        {deletingId === c._id ? "..." : "Delete"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

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
