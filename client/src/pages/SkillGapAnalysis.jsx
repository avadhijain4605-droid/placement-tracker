import { useState, useEffect, useCallback } from "react";
import { Link, Navigate } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api.js";

const PRIORITY_STYLES = {
  high: "bg-red-50 text-red-700 border-red-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function SkillGapAnalysis() {
  const { student } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [companiesError, setCompaniesError] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [progressId, setProgressId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [togglingId, setTogglingId] = useState(null);

  const loadCompanies = useCallback(async () => {
    setCompaniesLoading(true);
    setCompaniesError("");
    try {
      const data = await api.listCompanies(true);
      setCompanies(data.companies || []);
    } catch (err) {
      setCompaniesError(err.message || "Could not load companies.");
    } finally {
      setCompaniesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (student) loadCompanies();
  }, [student, loadCompanies]);

  if (!student) return <Navigate to="/login" replace />;

  async function handleAnalyze(e) {
    e.preventDefault();
    if (!companyId) {
      setError("Please select a target company.");
      return;
    }
    setStatus("loading");
    setError("");
    setAnalysis(null);
    setTasks([]);
    try {
      const data = await api.skillGap(companyId);
      setAnalysis(data.analysis);
      setProgressId(data.progressId);
      setTasks(data.analysis.prepTasks || []);
      setStatus("success");
    } catch (err) {
      setError(err.message || "Failed to analyze skill gap.");
      setStatus("error");
    }
  }

  async function handleToggleTask(taskId) {
    if (!progressId) return;
    setTogglingId(taskId);
    try {
      const data = await api.toggleTask(progressId, taskId);
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, done: data.task.done } : t))
      );
    } catch {
      // silently ignore — UI stays in previous state
    } finally {
      setTogglingId(null);
    }
  }

  const busy = status === "loading";

  return (
    <div>
      <PageHeader
        title="Skill Gap Analysis"
        subtitle="Compare your skills against a company's requirements. Eligibility checks are deterministic — no AI involved."
      />

      <form className="card p-6 space-y-4" onSubmit={handleAnalyze}>
        <div>
          <label className="label" htmlFor="company">Target company</label>
          {companiesLoading ? (
            <p className="text-sm text-slate-500 py-2">Loading companies…</p>
          ) : companiesError ? (
            <p className="text-sm text-red-600 py-2">{companiesError}</p>
          ) : (
            <select id="company" className="input" value={companyId} onChange={(e) => setCompanyId(e.target.value)} required>
              <option value="">Select a company</option>
              {companies.map((c) => (
                <option key={c._id} value={c._id}>{c.name}{c.industry ? ` — ${c.industry}` : ""}</option>
              ))}
            </select>
          )}
          {!companiesLoading && companies.length === 0 && !companiesError && (
            <p className="mt-1 text-xs text-slate-400">
              No active companies yet. <Link to="/companies" className="text-brand-600">Browse companies</Link>.
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary" disabled={busy || companiesLoading}>
            {busy ? "Analyzing…" : "Analyze Skill Gap"}
          </button>
        </div>
      </form>

      {status === "error" && (
        <div className="mt-6 card p-5 border-red-200 bg-red-50">
          <h3 className="font-semibold text-red-800">Could not analyze</h3>
          <p className="mt-1 text-sm text-red-700">{error}</p>
        </div>
      )}

      {status === "success" && analysis && (
        <div className="mt-6 space-y-6">
          {/* Readiness Score */}
          <div className="card p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Readiness: {analysis.readiness != null ? `${analysis.readiness}%` : "N/A"}</h2>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  <span className="font-medium">Formula:</span> {analysis.readinessFormula}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Readiness measures skill coverage only. Eligibility is reported separately below.
                </p>
              </div>
              <div className="flex gap-2">
                <span className="rounded-full bg-green-50 text-green-700 text-sm font-medium px-3 py-1 border border-green-200">
                  {analysis.matched.length} matched
                </span>
                <span className="rounded-full bg-red-50 text-red-700 text-sm font-medium px-3 py-1 border border-red-200">
                  {analysis.missing.length} missing
                </span>
              </div>
            </div>
          </div>

          {/* Eligibility Checks */}
          {analysis.eligibility.length > 0 && (
            <section>
              <h3 className="mb-3 text-base font-semibold text-slate-900">Eligibility Checks</h3>
              <div className="card p-4 divide-y divide-slate-100">
                {analysis.eligibility.map((e, i) => (
                  <div key={i} className="flex items-start gap-3 py-2 first:pt-0 last:pb-0">
                    <span className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${e.passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {e.passed ? "✓" : "✕"}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{e.label}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{e.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Matched Skills */}
          {analysis.matched.length > 0 && (
            <section>
              <h3 className="mb-3 text-base font-semibold text-slate-900">Matched Skills</h3>
              <div className="flex flex-wrap gap-2">
                {analysis.matched.map((s, i) => (
                  <span key={i} className="text-sm px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-200">
                    {s}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Missing Skills */}
          {analysis.missing.length > 0 && (
            <section>
              <h3 className="mb-3 text-base font-semibold text-slate-900">Missing Skills</h3>
              <div className="flex flex-wrap gap-2">
                {analysis.missing.map((s, i) => (
                  <span key={i} className="text-sm px-3 py-1 bg-red-50 text-red-700 rounded-full border border-red-200">
                    {s}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Prioritized Prep Tasks */}
          {tasks.length > 0 && (
            <section>
              <h3 className="mb-3 text-base font-semibold text-slate-900">Prioritized Preparation Tasks</h3>
              <div className="space-y-3">
                {tasks.map((t, i) => (
                  <div key={t._id || i} className="card p-4">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleToggleTask(t._id)}
                        disabled={togglingId === t._id}
                        className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition ${
                          t.done
                            ? "bg-green-500 border-green-500 text-white"
                            : "border-slate-300 hover:border-brand-400"
                        }`}
                      >
                        {t.done && "✓"}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className={`font-medium ${t.done ? "text-slate-400 line-through" : "text-slate-900"}`}>
                            {t.skill}
                          </h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${PRIORITY_STYLES[t.priority] || PRIORITY_STYLES.medium}`}>
                            {t.priority}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">{t.reason}</p>
                        {t.resourceTitles && t.resourceTitles.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {t.resourceTitles.map((title, j) => (
                              <span key={j} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                                {title}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {analysis.missing.length === 0 && (
            <div className="card p-6 bg-green-50 border-green-200">
              <h3 className="font-semibold text-green-800">All required skills matched!</h3>
              <p className="mt-1 text-sm text-green-700">You have all the skills this company is looking for.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
