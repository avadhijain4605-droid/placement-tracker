import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api.js";

const STATUS_STYLES = {
  draft: "bg-slate-100 text-slate-600",
  published: "bg-green-100 text-green-700",
  closed: "bg-amber-100 text-amber-700",
  archived: "bg-red-100 text-red-700",
};

function formatPackage(pkg) {
  if (!pkg || (!pkg.minAmount && !pkg.maxAmount)) return "Not specified";
  const min = pkg.minAmount || pkg.maxAmount;
  const max = pkg.maxAmount || pkg.minAmount;
  const range = min === max ? `${min}` : `${min} - ${max}`;
  const periodMap = { lpa: "LPA", monthly: "/month", "one-time": " (one-time)", stipend: " stipend" };
  return `${pkg.currency || "INR"} ${range} ${periodMap[pkg.period] || "LPA"}`;
}

function daysLeft(deadline) {
  const diff = new Date(deadline) - new Date();
  if (diff < 0) return "Expired";
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}

export default function Opportunities() {
  const { student } = useAuth();
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [jobType, setJobType] = useState("");
  const [workMode, setWorkMode] = useState("");
  const [eligibilityFilter, setEligibilityFilter] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const loadDrives = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (debouncedSearch) params.q = debouncedSearch;
      if (jobType) params.jobType = jobType;
      if (workMode) params.workMode = workMode;
      params.sort = "deadline";
      const data = await api.listDrives(params);
      setDrives(data.drives || []);
    } catch (err) {
      setError(err.message || "Could not load opportunities.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, jobType, workMode]);

  useEffect(() => {
    loadDrives();
  }, [loadDrives]);

  return (
    <div>
      <PageHeader
        title="Placement Opportunities"
        subtitle="Browse active placement drives and check your eligibility."
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          className="input flex-1"
          placeholder="Search by job title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input sm:w-40" value={jobType} onChange={(e) => setJobType(e.target.value)}>
          <option value="">All Types</option>
          <option value="full-time">Full-time</option>
          <option value="internship">Internship</option>
          <option value="other">Other</option>
        </select>
        <select className="input sm:w-40" value={workMode} onChange={(e) => setWorkMode(e.target.value)}>
          <option value="">All Modes</option>
          <option value="onsite">Onsite</option>
          <option value="remote">Remote</option>
          <option value="hybrid">Hybrid</option>
        </select>
      </div>

      {error && <div className="card p-4 border-red-200 bg-red-50 mb-4"><p className="text-sm text-red-700">{error}</p></div>}

      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-5 bg-slate-200 rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-slate-100 rounded w-1/2 mb-4"></div>
              <div className="h-3 bg-slate-100 rounded w-full mb-2"></div>
              <div className="h-3 bg-slate-100 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && drives.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">📋</p>
          <h3 className="text-lg font-semibold text-slate-700 mb-1">No opportunities found</h3>
          <p className="text-sm text-slate-500">Check back later or try adjusting your filters.</p>
        </div>
      )}

      {!loading && !error && drives.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {drives.map((d) => {
            const expired = new Date(d.applicationDeadline) < new Date();
            return (
              <Link
                key={d._id}
                to={`/drives/${d._id}`}
                className="card p-5 hover:shadow-md hover:border-brand-200 transition group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-slate-900 group-hover:text-brand-600 transition">{d.jobTitle}</h3>
                    <p className="text-sm text-slate-500">{d.company?.name || "—"}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[d.status] || STATUS_STYLES.published}`}>
                    {d.status}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span className="px-2 py-0.5 bg-slate-100 rounded-md">{d.jobType}</span>
                  <span className="px-2 py-0.5 bg-slate-100 rounded-md">{d.workMode}</span>
                  {d.jobLocation && <span className="px-2 py-0.5 bg-slate-100 rounded-md">{d.jobLocation}</span>}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">{formatPackage(d.package)}</span>
                  <span className={`text-xs font-medium ${expired ? "text-red-600" : "text-slate-500"}`}>
                    {daysLeft(d.applicationDeadline)}
                  </span>
                </div>
                {d.requiredSkills?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {d.requiredSkills.slice(0, 3).map((s) => (
                      <span key={s} className="text-xs px-2 py-0.5 bg-brand-50 text-brand-700 rounded-full">{s}</span>
                    ))}
                    {d.requiredSkills.length > 3 && <span className="text-xs text-slate-400">+{d.requiredSkills.length - 3} more</span>}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
