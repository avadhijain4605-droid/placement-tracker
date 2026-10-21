import { useEffect, useState, useCallback } from "react";
import { Link, Navigate } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api.js";

const PRIORITY_STYLES = {
  high: "bg-red-50 text-red-700 border-red-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function AiPrepPlan() {
  const { student } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [companiesError, setCompaniesError] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [days, setDays] = useState(7);
  const [plan, setPlan] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

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

  async function handleGenerate(e) {
    e.preventDefault();
    if (!companyId) {
      setError("Please select a target company.");
      return;
    }
    setStatus("loading");
    setError("");
    setPlan(null);
    try {
      const data = await api.generatePlan(companyId, days);
      setPlan(data.plan);
      setStatus("success");
    } catch (err) {
      setError(err.message || "Failed to generate plan.");
      setStatus("error");
    }
  }

  const busy = status === "loading";

  return (
    <div>
      <PageHeader
        title="AI Preparation Plan"
        subtitle="A personalized prep roadmap generated from your profile and the company's requirements."
      />

      <form className="card p-6 space-y-4" onSubmit={handleGenerate}>
        <div className="grid sm:grid-cols-2 gap-4">
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
          <div>
            <label className="label" htmlFor="days">Days available to prepare</label>
            <input
              id="days"
              type="number"
              min={1}
              max={60}
              className="input"
              value={days}
              onChange={(e) => setDays(Number.parseInt(e.target.value, 10) || 1)}
              required
            />
            <p className="mt-1 text-xs text-slate-400">Between 1 and 60 days.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary" disabled={busy || companiesLoading}>
            {busy ? "Generating…" : "Generate plan"}
          </button>
          {busy && <span className="text-sm text-slate-500">Gemini is building your roadmap…</span>}
        </div>
      </form>

      {status === "error" && (
        <div className="mt-6 card p-5 border-red-200 bg-red-50">
          <h3 className="font-semibold text-red-800">Could not generate plan</h3>
          <p className="mt-1 text-sm text-red-700">{error}</p>
          {/profile is incomplete/i.test(error) && (
            <Link to="/profile" className="mt-2 inline-block text-sm font-medium text-red-700 underline">
              Complete your profile
            </Link>
          )}
        </div>
      )}

      {status === "success" && plan && <PlanView plan={plan} />}
    </div>
  );
}

function PlanView({ plan }) {
  return (
    <div className="mt-6 space-y-6">
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Your preparation plan</h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">{plan.summary}</p>
          </div>
          <span className="shrink-0 rounded-full bg-brand-50 text-brand-700 text-sm font-medium px-3 py-1 border border-brand-200">
            {plan.durationDays} days
          </span>
        </div>
      </div>

      <section>
        <h3 className="mb-3 text-base font-semibold text-slate-900">Priority topics</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {plan.priorityTopics.map((p, i) => (
            <div key={i} className="card p-4">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-slate-900">{p.topic}</h4>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${PRIORITY_STYLES[p.priority] || PRIORITY_STYLES.low}`}>
                  {p.priority}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{p.reason}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-base font-semibold text-slate-900">Daily tasks</h3>
        <div className="space-y-3">
          {plan.dailyTasks.map((d, i) => (
            <div key={i} className="card p-4">
              <div className="flex items-center justify-between gap-3">
                <h4 className="font-medium text-slate-900">
                  Day {d.day}: <span className="font-normal text-slate-700">{d.title}</span>
                </h4>
                {typeof d.estMinutes === "number" && (
                  <span className="text-xs text-slate-500">~{d.estMinutes} min</span>
                )}
              </div>
              {d.topics?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {d.topics.map((t, j) => (
                    <span key={j} className="text-xs rounded-md bg-slate-100 text-slate-700 px-2 py-0.5">{t}</span>
                  ))}
                </div>
              )}
              {d.practice?.length > 0 && (
                <ul className="mt-2 list-disc list-inside text-sm text-slate-600 space-y-1">
                  {d.practice.map((p, j) => <li key={j}>{p}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      {plan.resources?.length > 0 && (
        <section>
          <h3 className="mb-3 text-base font-semibold text-slate-900">Recommended resources</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {plan.resources.map((r, i) => (
              <div key={i} className="card p-4">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-slate-900">{r.name}</h4>
                  <span className="text-xs text-slate-500">{r.type}</span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{r.reason}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
