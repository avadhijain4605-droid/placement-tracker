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

const CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "new-drive", label: "New Drive" },
  { value: "deadline", label: "Deadline" },
  { value: "assessment", label: "Assessment" },
  { value: "interview", label: "Interview" },
  { value: "eligibility", label: "Eligibility" },
  { value: "general", label: "General" },
];

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function Announcements() {
  const { student } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("");
  const [selected, setSelected] = useState(null);

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

  // Separate upcoming deadlines from general announcements
  const upcomingDeadlines = announcements
    .filter((a) => a.category === "deadline" || a.expiresAt)
    .map((a) => ({
      ...a,
      daysLeft: a.expiresAt ? daysUntil(a.expiresAt) : daysUntil(a.publishedAt),
    }))
    .filter((a) => a.daysLeft != null && a.daysLeft >= 0 && a.daysLeft <= 14)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 3);

  return (
    <div>
      <PageHeader
        title="Announcements"
        subtitle="Stay updated with the latest placement cell announcements."
        actions={isAdmin && <Link to="/admin/announcements" className="btn-primary">Manage</Link>}
      />

      {/* Upcoming deadlines callout */}
      {upcomingDeadlines.length > 0 && !selected && (
        <div className="mb-6 card p-5 border-red-200 bg-red-50">
          <h3 className="font-semibold text-red-800 mb-3">Upcoming Deadlines</h3>
          <div className="space-y-2">
            {upcomingDeadlines.map((d) => (
              <button
                key={d._id}
                type="button"
                onClick={() => setSelected(d)}
                className="block w-full text-left rounded-lg bg-white/60 hover:bg-white p-3 transition border border-red-100"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-900">{d.title}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    d.daysLeft <= 2 ? "bg-red-600 text-white" : "bg-red-100 text-red-700"
                  }`}>
                    {d.daysLeft === 0 ? "Today" : d.daysLeft === 1 ? "1 day left" : `${d.daysLeft} days left`}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="mb-6 card p-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${CATEGORY_STYLES[selected.category] || CATEGORY_STYLES.general}`}>
                {CATEGORY_LABELS[selected.category] || selected.category}
              </span>
              <h2 className="text-lg font-semibold text-slate-900">{selected.title}</h2>
            </div>
            <button type="button" className="text-slate-400 hover:text-slate-600 text-sm" onClick={() => setSelected(null)}>
              Close
            </button>
          </div>
          <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{selected.content}</p>
          <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
            <span>{selected.publishedAt ? new Date(selected.publishedAt).toLocaleDateString() : new Date(selected.createdAt).toLocaleDateString()}</span>
            {selected.expiresAt && (
              <span className="text-red-600 font-medium">
                Expires: {new Date(selected.expiresAt).toLocaleDateString()}
              </span>
            )}
            {selected.drive && <Link to={`/drives/${selected.drive._id}`} className="text-brand-600 hover:underline">View drive →</Link>}
          </div>
        </div>
      )}

      {/* Category filter */}
      <div className="mb-4 flex items-center gap-3">
        <select className="input sm:w-56" value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        {category && (
          <button type="button" className="text-sm text-slate-500 hover:text-slate-700" onClick={() => setCategory("")}>
            Clear filter
          </button>
        )}
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
          {announcements.map((ann) => {
            const daysLeft = ann.expiresAt ? daysUntil(ann.expiresAt) : null;
            const isUrgent = ann.category === "deadline" || (daysLeft != null && daysLeft <= 7);
            return (
              <div
                key={ann._id}
                className={`card p-5 cursor-pointer hover:shadow-md transition ${isUrgent ? "border-l-4 border-l-red-400" : ""}`}
                onClick={() => setSelected(ann)}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-semibold text-slate-900">{ann.title}</h3>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium shrink-0 ${CATEGORY_STYLES[ann.category] || CATEGORY_STYLES.general}`}>
                    {CATEGORY_LABELS[ann.category] || ann.category}
                  </span>
                </div>
                <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">{ann.content}</p>
                <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
                  <span>{ann.publishedAt ? new Date(ann.publishedAt).toLocaleDateString() : new Date(ann.createdAt).toLocaleDateString()}</span>
                  {daysLeft != null && daysLeft >= 0 && (
                    <span className="text-red-600 font-medium">
                      {daysLeft === 0 ? "Expires today" : daysLeft === 1 ? "1 day left" : `${daysLeft} days left`}
                    </span>
                  )}
                  {ann.drive && <Link to={`/drives/${ann.drive._id}`} className="text-brand-600 hover:underline" onClick={(e) => e.stopPropagation()}>View drive →</Link>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
