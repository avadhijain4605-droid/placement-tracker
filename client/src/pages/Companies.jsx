import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import { api } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Companies() {
  const { student } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [industry, setIndustry] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [sortBy, setSortBy] = useState("name");

  // AI Enrichment state
  const [enrichOpen, setEnrichOpen] = useState(false);
  const [enrichName, setEnrichName] = useState("");
  const [enriching, setEnriching] = useState(false);
  const [enrichError, setEnrichError] = useState(null);
  const [enrichedProfile, setEnrichedProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(null);

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

  async function handleEnrich(e) {
    e.preventDefault();
    if (!enrichName.trim()) return;
    setEnriching(true);
    setEnrichError(null);
    setEnrichedProfile(null);
    setSaveSuccess(null);
    try {
      const data = await api.enrichCompany(enrichName.trim());
      setEnrichedProfile(data.profile);
    } catch (err) {
      setEnrichError(err.message || "Failed to generate company profile.");
    } finally {
      setEnriching(false);
    }
  }

  async function handleSaveProfile() {
    if (!enrichedProfile) return;
    setSaving(true);
    setEnrichError(null);
    setSaveSuccess(null);
    try {
      const data = await api.createCompany(enrichedProfile);
      setSaveSuccess(data.company.name);
      setEnrichedProfile(null);
      setEnrichName("");
      setEnrichOpen(false);
      await loadCompanies();
    } catch (err) {
      setEnrichError(err.message || "Failed to save company.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Companies"
        subtitle="Browse hiring companies, roles, and placement insights."
        actions={
          student && (
            <button
              onClick={() => { setEnrichOpen(!enrichOpen); setEnrichedProfile(null); setEnrichError(null); setSaveSuccess(null); }}
              className="btn-primary"
            >
              {enrichOpen ? "Close" : "AI Enrich Company"}
            </button>
          )
        }
      />

      {/* AI Enrichment Panel */}
      {enrichOpen && student && (
        <div className="card p-6 mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">AI Company Intelligence</h3>
          <p className="text-sm text-slate-500 mb-4">
            Type a company name and PathAI will generate a full intelligence profile — industry, roles, eligibility, required skills, OA patterns, interview questions, and prep resources. Review it, then save to the database.
          </p>

          {saveSuccess && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 mb-4">
              <p className="text-sm text-green-700 font-medium">"{saveSuccess}" has been saved to the database.</p>
            </div>
          )}

          <form onSubmit={handleEnrich} className="flex gap-3 mb-4">
            <input
              className="input flex-1"
              placeholder="Enter company name (e.g. Stripe, Zomato, Tesla...)"
              value={enrichName}
              onChange={(e) => setEnrichName(e.target.value)}
              disabled={enriching}
            />
            <button type="submit" className="btn-primary" disabled={enriching || !enrichName.trim()}>
              {enriching ? "Generating..." : "Generate Profile"}
            </button>
          </form>

          {enriching && (
            <div className="flex items-center gap-3 py-8">
              <div className="w-5 h-5 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
              <p className="text-sm text-slate-500">PathAI is researching the company and building an intelligence profile...</p>
            </div>
          )}

          {enrichError && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 mb-4">
              <p className="text-sm text-red-700 font-medium">{enrichError}</p>
              {/authentication required/i.test(enrichError) && (
                <Link to="/login" className="mt-1 inline-block text-sm text-red-600 underline">Log in to use this feature</Link>
              )}
            </div>
          )}

          {enrichedProfile && (
            <EnrichedProfilePreview profile={enrichedProfile} onSave={handleSaveProfile} saving={saving} />
          )}
        </div>
      )}

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

function EnrichedProfilePreview({ profile, onSave, saving }) {
  return (
    <div className="border-t border-slate-200 pt-4 mt-4">
      <h4 className="font-semibold text-slate-900 mb-1">{profile.name}</h4>
      <p className="text-sm text-slate-600 mb-1">{profile.industry} • {profile.headquarters || "—"}</p>
      <p className="text-sm text-slate-600 mb-4">{profile.description}</p>

      {profile.requiredSkills && profile.requiredSkills.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-slate-500 uppercase mb-1">Required Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {profile.requiredSkills.map((s) => (
              <span key={s} className="text-xs px-2 py-0.5 bg-brand-50 text-brand-700 rounded-full">{s}</span>
            ))}
          </div>
        </div>
      )}

      {profile.hiringProcess && profile.hiringProcess.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-slate-500 uppercase mb-1">Hiring Process</p>
          <p className="text-sm text-slate-700">{profile.hiringProcess.join(" → ")}</p>
        </div>
      )}

      {profile.roles && profile.roles.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-slate-500 uppercase mb-1">Roles</p>
          <div className="space-y-1">
            {profile.roles.map((r, i) => (
              <p key={i} className="text-sm text-slate-700">
                {r.title} • {r.package || "—"} • {r.location || "—"}
              </p>
            ))}
          </div>
        </div>
      )}

      {profile.oaPatterns && profile.oaPatterns.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-slate-500 uppercase mb-1">OA Patterns</p>
          <div className="space-y-1">
            {profile.oaPatterns.map((oa, i) => (
              <p key={i} className="text-sm text-slate-700">
                {oa.round} ({oa.difficulty}, {oa.duration || "—"}) — {oa.description || ""}
              </p>
            ))}
          </div>
        </div>
      )}

      {profile.interviewQuestions && profile.interviewQuestions.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-slate-500 uppercase mb-1">Interview Questions ({profile.interviewQuestions.length})</p>
          <ul className="text-sm text-slate-700 space-y-1 list-disc list-inside">
            {profile.interviewQuestions.slice(0, 4).map((q, i) => (
              <li key={i}>{q.question} <span className="text-xs text-slate-400">({q.type}, {q.difficulty})</span></li>
            ))}
            {profile.interviewQuestions.length > 4 && (
              <li className="text-xs text-slate-400">+{profile.interviewQuestions.length - 4} more...</li>
            )}
          </ul>
        </div>
      )}

      {profile.preparationResources && profile.preparationResources.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-slate-500 uppercase mb-1">Preparation Resources</p>
          <ul className="text-sm text-slate-700 space-y-1 list-disc list-inside">
            {profile.preparationResources.map((r, i) => (
              <li key={i}>{r.title} <span className="text-xs text-slate-400">({r.type})</span></li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onSave} disabled={saving} className="btn-primary">
          {saving ? "Saving..." : "Save to Database"}
        </button>
        <span className="text-xs text-slate-400 self-center">
          Review the profile above before saving. You can edit it later.
        </span>
      </div>
    </div>
  );
}
