import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api.js";

const CATEGORY_STYLES = {
  "new-drive": "bg-green-100 text-green-700",
  deadline: "bg-red-100 text-red-700",
  assessment: "bg-purple-100 text-purple-700",
  interview: "bg-indigo-100 text-indigo-700",
  eligibility: "bg-amber-100 text-amber-700",
  general: "bg-slate-100 text-slate-600",
};

const CATEGORY_LABELS = {
  "new-drive": "New Drive",
  deadline: "Deadline",
  assessment: "Assessment",
  interview: "Interview",
  eligibility: "Eligibility",
  general: "General",
};

export default function Announcements() {
  const { student } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("");

  const isAdmin = student?.role === "admin" || student?.role === "super_admin";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = category ? { category } : {};
      const data = await api.listAnnouncements(params);
      setAnnouncements(data.announcements || []);
    } catch (err) {
      setError(err.message || "Could not load announcements.");
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageHeader
        title="Announcements"
        subtitle="Stay updated with the latest placement cell announcements."
        actions={isAdmin && <Link to="/admin/announcements" className="btn-primary">Manage</Link>}
      />

      <div className="mb-4">
        <select className="input sm:w-48" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          <option value="new-drive">New Drive</option>
          <option value="deadline">Deadline</option>
          <option value="assessment">Assessment</option>
          <option value="interview">Interview</option>
          <option value="eligibility">Eligibility</option>
          <option value="general">General</option>
        </select>
      </div>

      {error && <div className="card p-4 border-red-200 bg-red-50 mb-4"><p className="text-sm text-red-700">{error}</p></div>}

      {loading && <div className="card p-8 text-center text-slate-500">Loading...</div>}

      {!loading && !error && announcements.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">📢</p>
          <h3 className="text-lg font-semibold text-slate-700 mb-1">No announcements</h3>
          <p className="text-sm text-slate-500">Check back later for updates.</p>
        </div>
      )}

      {!loading && !error && announcements.length > 0 && (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <div key={ann._id} className="card p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-semibold text-slate-900">{ann.title}</h3>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium shrink-0 ${CATEGORY_STYLES[ann.category] || CATEGORY_STYLES.general}`}>
                  {CATEGORY_LABELS[ann.category] || ann.category}
                </span>
              </div>
              <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{ann.content}</p>
              <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
                <span>{ann.publishedAt ? new Date(ann.publishedAt).toLocaleDateString() : new Date(ann.createdAt).toLocaleDateString()}</span>
                {ann.drive && <Link to={`/drives/${ann.drive._id}`} className="text-brand-600 hover:underline">View drive →</Link>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
