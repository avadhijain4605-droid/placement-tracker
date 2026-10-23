import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api.js";

export default function AdminAnalytics() {
  const { student } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isAdmin = student?.role === "admin" || student?.role === "super_admin";
  if (!student) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  useEffect(() => {
    api.adminAnalytics()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const stats = data?.stats || {};
  const popularCompanies = data?.popularCompanies || [];
  const topMissing = data?.topMissingSkills || [];
  const topMatched = data?.topMatchedSkills || [];

  const maxMissing = topMissing.length > 0 ? topMissing[0].count : 1;
  const maxMatched = topMatched.length > 0 ? topMatched[0].count : 1;
  const maxPopular = popularCompanies.length > 0 ? popularCompanies[0].count : 1;

  return (
    <div>
      <PageHeader title="AI & Career Intelligence" subtitle="Analytics from preparation plans, skill-gap analyses, and career activity." />

      {error && <div className="card p-4 border-red-200 bg-red-50 mb-4"><p className="text-sm text-red-700">{error}</p></div>}

      {loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-2/3 mb-3"></div>
              <div className="h-8 bg-slate-100 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && (
        <>
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="card p-5">
              <p className="text-sm text-slate-500">Prep Plans Generated</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{stats.totalPrepPlans ?? "—"}</p>
              <p className="mt-1 text-xs text-slate-400">Skill-gap analyses saved</p>
            </div>
            <div className="card p-5">
              <p className="text-sm text-slate-500">Avg. Readiness</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{stats.avgReadiness != null ? `${stats.avgReadiness}%` : "—"}</p>
              <p className="mt-1 text-xs text-slate-400">Across all analyses</p>
            </div>
            <div className="card p-5">
              <p className="text-sm text-slate-500">Eligibility Passed</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{stats.eligibilityPassed}/{stats.eligibilityTotal}</p>
              <p className="mt-1 text-xs text-slate-400">Of total analyses</p>
            </div>
            <div className="card p-5">
              <p className="text-sm text-slate-500">Readiness Range</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {stats.minReadiness != null ? `${stats.minReadiness}%` : "—"}{stats.maxReadiness != null ? `–${stats.maxReadiness}%` : ""}
              </p>
              <p className="mt-1 text-xs text-slate-400">Min – max</p>
            </div>
          </section>

          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <section className="card p-6">
              <h2 className="text-base font-semibold text-slate-900 mb-4">Most Frequently Selected Companies</h2>
              {popularCompanies.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No prep data yet.</p>
              ) : (
                <div className="space-y-2">
                  {popularCompanies.map((c) => (
                    <div key={c.companyId} className="flex items-center gap-3">
                      <span className="text-sm text-slate-600 w-32 truncate">{c.name}</span>
                      <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${Math.round((c.count / maxPopular) * 100)}%` }} />
                      </div>
                      <span className="text-sm font-medium text-slate-700 w-8 text-right">{c.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="card p-6">
              <h2 className="text-base font-semibold text-slate-900 mb-4">Most Common Missing Skills</h2>
              {topMissing.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No skill-gap data yet.</p>
              ) : (
                <div className="space-y-2">
                  {topMissing.map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-sm text-slate-600 w-32 truncate">{s.skill}</span>
                      <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-red-400 rounded-full transition-all" style={{ width: `${Math.round((s.count / maxMissing) * 100)}%` }} />
                      </div>
                      <span className="text-sm font-medium text-slate-700 w-8 text-right">{s.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <section className="card p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Most Common Matched Skills</h2>
            {topMatched.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No skill data yet.</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2">
                {topMatched.map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-sm text-slate-600 w-32 truncate">{s.skill}</span>
                    <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-400 rounded-full transition-all" style={{ width: `${Math.round((s.count / maxMatched) * 100)}%` }} />
                    </div>
                    <span className="text-sm font-medium text-slate-700 w-8 text-right">{s.count}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
