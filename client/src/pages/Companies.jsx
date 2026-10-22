import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import { api } from "../api.js";

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [industry, setIndustry] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [sortBy, setSortBy] = useState("name");

  // Debounce search input by 300ms.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load industries once for the filter dropdown.
  useEffect(() => {
    api.listIndustries().then((data) => setIndustries(data.industries || [])).catch(() => {});
  }, []);

  const loadCompanies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (debouncedSearch) params.q = debouncedSearch;
      if (industry) params.industry = industry;
      if (activeFilter) params.active = activeFilter;
      if (sortBy) params.sort = sortBy;
      const data = await api.listCompanies(params);
      setCompanies(data.companies || []);
    } catch (err) {
      setError(err.message || "Failed to load companies.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, industry, activeFilter, sortBy]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  return (
    <div>
      <PageHeader
        title="Companies"
        subtitle="Browse hiring companies, roles, and placement insights."
      />

      {/* Search & Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          className="input flex-1"
          placeholder="Search by name, skill, or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="input sm:w-48"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
        >
          <option value="">All Industries</option>
          {industries.map((ind) => (
            <option key={ind} value={ind}>{ind}</option>
          ))}
        </select>
        <select
          className="input sm:w-36"
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <select
          className="input sm:w-40"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="name">Name (A-Z)</option>
          <option value="-name">Name (Z-A)</option>
          <option value="recent">Newest</option>
          <option value="industry">Industry</option>
        </select>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 mb-4">
          <p className="text-sm text-red-700 font-medium">{error}</p>
          <button
            onClick={loadCompanies}
            className="mt-2 text-sm text-red-600 underline hover:text-red-800"
          >
            Try again
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-5 bg-slate-200 rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-slate-100 rounded w-1/2 mb-4"></div>
              <div className="h-3 bg-slate-100 rounded w-full mb-2"></div>
              <div className="h-3 bg-slate-100 rounded w-2/3"></div>
              <div className="mt-4 flex gap-2">
                <div className="h-6 bg-slate-100 rounded w-16"></div>
                <div className="h-6 bg-slate-100 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && companies.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">🔍</p>
          <h3 className="text-lg font-semibold text-slate-700 mb-1">No companies found</h3>
          <p className="text-sm text-slate-500">
            Try adjusting your search or filters to see more results.
          </p>
        </div>
      )}

      {/* Company cards */}
      {!loading && !error && companies.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((c) => (
            <Link
              key={c._id}
              to={`/companies/${c._id}`}
              className="card p-5 hover:shadow-md hover:border-brand-200 transition group"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-slate-900 group-hover:text-brand-600 transition">
                  {c.name}
                </h3>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    c.active
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {c.active ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="text-sm text-slate-600 mb-3">{c.industry || "—"}</p>
              <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                {c.description || "No description available."}
              </p>
              {c.requiredSkills && c.requiredSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {c.requiredSkills.slice(0, 4).map((s) => (
                    <span
                      key={s}
                      className="text-xs px-2 py-0.5 bg-brand-50 text-brand-700 rounded-full"
                    >
                      {s}
                    </span>
                  ))}
                  {c.requiredSkills.length > 4 && (
                    <span className="text-xs text-slate-400">
                      +{c.requiredSkills.length - 4} more
                    </span>
                  )}
                </div>
              )}
              {c.roles && c.roles.length > 0 && (
                <p className="mt-3 text-xs text-slate-400">
                  {c.roles[0].title} • {c.roles[0].package || "—"}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
