import { useState, useEffect, useCallback } from "react";
import { Navigate } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api.js";

const CATEGORIES = [
  { value: "new-drive", label: "New Drive" },
  { value: "deadline", label: "Deadline" },
  { value: "assessment", label: "Assessment" },
  { value: "interview", label: "Interview" },
  { value: "eligibility", label: "Eligibility" },
  { value: "general", label: "General" },
];

export default function AdminAnnouncements() {
  const { student } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({ title: "", content: "", category: "general", published: false });

  const isAdmin = student?.role === "admin" || student?.role === "super_admin";
  if (!student) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.listAnnouncements();
      setAnnouncements(data.announcements || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function resetForm() {
    setForm({ title: "", content: "", category: "general", published: false });
    setEditing(null);
    setShowForm(false);
    setFormError("");
  }

  function startEdit(ann) {
    setForm({ title: ann.title, content: ann.content, category: ann.category, published: ann.published });
    setEditing(ann._id);
    setShowForm(true);
    setFormError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      setFormError("Title and content are required.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      if (editing) {
        await api.updateAnnouncement(editing, form);
      } else {
        await api.createAnnouncement(form);
      }
      resetForm();
      await load();
    } catch (err) {
      setFormError(err.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    try {
      await api.deleteAnnouncement(id);
      await load();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleTogglePublish(ann) {
    try {
      await api.updateAnnouncement(ann._id, { published: !ann.published });
      await load();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div>
      <PageHeader
        title="Announcements"
        subtitle="Create and manage placement announcements."
        actions={<button className="btn-primary" onClick={() => { resetForm(); setShowForm(!showForm); }}>{showForm ? "Cancel" : "+ New Announcement"}</button>}
      />

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-6 mb-6 space-y-4">
          {formError && <div className="rounded-lg bg-red-50 border border-red-200 p-3"><p className="text-sm text-red-700">{formError}</p></div>}
          <div>
            <label className="label" htmlFor="annTitle">Title *</label>
            <input id="annTitle" className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div>
            <label className="label" htmlFor="annContent">Content *</label>
            <textarea id="annContent" className="input min-h-24" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="annCategory">Category</label>
              <select id="annCategory" className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2 mt-6">
              <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
              <span className="text-sm text-slate-700">Publish immediately</span>
            </label>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Create"}</button>
            <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button>
          </div>
        </form>
      )}

      {error && <div className="card p-4 border-red-200 bg-red-50 mb-4"><p className="text-sm text-red-700">{error}</p></div>}

      {loading && <div className="card p-8 text-center text-slate-500">Loading...</div>}

      {!loading && !error && announcements.length === 0 && !showForm && (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">📢</p>
          <h3 className="text-lg font-semibold text-slate-700 mb-1">No announcements yet</h3>
          <p className="text-sm text-slate-500">Click "New Announcement" to create one.</p>
        </div>
      )}

      {!loading && !error && announcements.length > 0 && (
        <div className="space-y-3">
          {announcements.map((ann) => (
            <div key={ann._id} className="card p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h3 className="font-semibold text-slate-900">{ann.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ann.published ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                    {ann.published ? "Published" : "Draft"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleTogglePublish(ann)} className="text-xs text-brand-600 hover:underline">
                    {ann.published ? "Unpublish" : "Publish"}
                  </button>
                  <button onClick={() => startEdit(ann)} className="text-xs text-slate-600 hover:underline">Edit</button>
                  <button onClick={() => handleDelete(ann._id)} className="text-xs text-red-600 hover:underline">Delete</button>
                </div>
              </div>
              <p className="text-sm text-slate-600 line-clamp-3">{ann.content}</p>
              <p className="mt-2 text-xs text-slate-400 capitalize">{ann.category} • {new Date(ann.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
