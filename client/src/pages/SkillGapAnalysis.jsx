import { useState, useEffect, useCallback } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
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
  const location = useLocation();

  // Company picker
  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [companiesError, setCompaniesError] = useState("");
  const [companyId, setCompanyId] = useState("");

  // Active analysis
  const [analysis, setAnalysis] = useState(null);
  const [progressId, setProgressId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [togglingId, setTogglingId] = useState(null);
  const [activeTitle, setActiveTitle] = useState("");

  // Saved analyses list
  const [savedAnalyses, setSavedAnalyses] = useState([]);
  const [savedLoading, setSavedLoading] = useState(false);

  // Save / rename / delete state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [listError, setListError] = useState("");

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

  const loadSavedAnalyses = useCallback(async () => {
    setSavedLoading(true);
    setListError("");
    try {
      const data = await api.listProgress();
      setSavedAnalyses(data.progress || []);
    } catch (err) {
      setListError(err.message || "Could not load saved analyses.");
    } finally {
      setSavedLoading(false);
    }
  }, []);

  useEffect(() => {
    if (student) {
      loadCompanies();
      loadSavedAnalyses();
    }
  }, [student, loadCompanies, loadSavedAnalyses]);

  // Reopen an analysis when navigated with state.reopenId (from Dashboard).
  useEffect(() => {
    const reopenId = location.state?.reopenId;
    if (!student || !reopenId) return;
    handleReopen(reopenId);
    // Clear the state so it doesn't reopen on every re-render.
    window.history.replaceState({}, document.title);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student, location.state]);

  if (!student) return <Navigate to="/login" replace />;

  // ── Analyze ─────────────────────────────────────────────────────
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
    setProgressId(null);
    setActiveTitle("");
    setSaveSuccess(false);
    setSaveError("");
    try {
      const data = await api.skillGap(companyId);
      setAnalysis(data.analysis);
      setProgressId(data.progressId);
      setTasks(data.analysis.prepTasks || []);
      setActiveTitle(data.progress?.title || "");
      setStatus("success");
    } catch (err) {
      setError(err.message || "Failed to analyze skill gap.");
      setStatus("error");
    }
  }

  // ── Toggle task checkbox ────────────────────────────────────────
  async function handleToggleTask(taskId) {
    if (!progressId || !taskId) return;
    setTogglingId(taskId);
    try {
      const data = await api.toggleTask(progressId, taskId);
      setTasks((prev) =>
        prev.map((t) =>
          t._id === taskId ? { ...t, done: data.task.done } : t
        )
      );
    } catch {
      // Revert is implicit — UI stays in previous state
    } finally {
      setTogglingId(null);
    }
  }

  // ── Save analysis ───────────────────────────────────────────────
  async function handleSave() {
    if (!progressId) return;
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);
    try {
      const title = activeTitle.trim() || `${analysis?.companyName || "Skill Gap"} — ${new Date().toLocaleDateString()}`;
      const data = await api.saveAnalysis(progressId, title);
      setActiveTitle(data.progress.title);
      setSaveSuccess(true);
      await loadSavedAnalyses();
    } catch (err) {
      setSaveError(err.message || "Could not save analysis.");
    } finally {
      setSaving(false);
    }
  }

  // ── Reopen a saved analysis ─────────────────────────────────────
  async function handleReopen(id) {
    setStatus("loading");
    setError("");
    try {
      const data = await api.getProgress(id);
      const p = data.progress;
      setProgressId(p._id);
      setActiveTitle(p.title || "");
      // Reconstruct the analysis view from the saved doc
      setAnalysis({
        companyName: p.companyId?.name || "Unknown",
        readiness: p.readiness,
        readinessFormula: p.readinessFormula,
        matched: p.matched || [],
        missing: p.missing || [],
        eligibility: p.eligibility || [],
        eligibilityPassed: p.eligibilityPassed,
        prepTasks: p.tasks || [],
      });
      setTasks(p.tasks || []);
      setStatus("success");
    } catch (err) {
      setError(err.message || "Could not open analysis.");
      setStatus("error");
    }
  }

  // ── Rename ──────────────────────────────────────────────────────
  async function handleRenameSubmit(e, id) {
    e.preventDefault();
    if (!renameValue.trim()) return;
    try {
      await api.renameAnalysis(id, renameValue.trim());
      setSavedAnalyses((prev) =>
        prev.map((p) => (p._id === id ? { ...p, title: renameValue.trim() } : p))
      );
      if (progressId === id) setActiveTitle(renameValue.trim());
      setRenamingId(null);
      setRenameValue("");
    } catch (err) {
      setListError(err.message || "Could not rename analysis.");
    }
  }

  // ── Delete ──────────────────────────────────────────────────────
  async function handleDelete(id) {
    if (!window.confirm("Delete this saved analysis? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await api.deleteAnalysis(id);
      setSavedAnalyses((prev) => prev.filter((p) => p._id !== id));
      if (progressId === id) {
        setAnalysis(null);
        setTasks([]);
        setProgressId(null);
        setActiveTitle("");
        setStatus("idle");
      }
    } catch (err) {
      setListError(err.message || "Could not delete analysis.");
    } finally {
      setDeletingId(null);
    }
  }

  // ── Progress calculation ────────────────────────────────────────
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.done).length;
  const progressPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const busy = status === "loading";

  return (
    <div>
      <PageHeader
        title="Skill Gap Analysis"
        subtitle="Compare your skills against a company's requirements. Track your progress and save analyses for later."
      />

      {/* Company picker */}
      <form className="card p-6 space-y-4" onSubmit={handleAnalyze}>
        <div>
          <label className="label" htmlFor="company">Target company</label>
          {companiesLoading ? (
            <p className="text-sm text-slate-500 py-2">Loading companies…</p>
          ) : companiesError ? (
            <p className="text-sm text-red-600 py-2">{companiesError}</p>
          ) : (
            <select
              id="company"
              className="input"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              required
            >
              <option value="">Select a company</option>
              {companies.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                  {c.industry ? ` — ${c.industry}` : ""}
                </option>
              ))}
            </select>
          )}
          {!companiesLoading && companies.length === 0 && !companiesError && (
            <p className="mt-1 text-xs text-slate-400">
              No active companies yet.{" "}
              <Link to="/companies" className="text-brand-600">Browse companies</Link>.
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary" disabled={busy || companiesLoading}>
            {busy ? "Analyzing…" : "Analyze Skill Gap"}
          </button>
        </div>
      </form>

      {/* Error */}
      {status === "error" && (
        <div className="mt-6 card p-5 border-red-200 bg-red-50">
          <h3 className="font-semibold text-red-800">Could not analyze</h3>
          <p className="mt-1 text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Analysis results */}
      {status === "success" && analysis && (
        <div className="mt-6 space-y-6">
          {/* Save bar */}
          <div className="card p-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-48">
              <input
                type="text"
                className="input"
                placeholder="Analysis title (optional)"
                value={activeTitle}
                onChange={(e) => {
                  setActiveTitle(e.target.value);
                  setSaveSuccess(false);
                }}
                disabled={saving}
              />
            </div>
            <button
              type="button"
              className="btn-primary"
              onClick={handleSave}
              disabled={saving || !progressId}
            >
              {saving ? "Saving…" : "Save Analysis"}
            </button>
            {saveSuccess && (
              <span className="text-sm text-green-600">Saved!</span>
            )}
            {saveError && (
              <span className="text-sm text-red-600">{saveError}</span>
            )}
          </div>

          {/* Readiness Score + Progress */}
          <div className="card p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Readiness: {analysis.readiness != null ? `${analysis.readiness}%` : "N/A"}
                </h2>
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

            {totalTasks > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-700">Task Progress</span>
                  <span className="text-sm text-slate-500">
                    {doneTasks}/{totalTasks} completed ({progressPct}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Eligibility Checks */}
          {analysis.eligibility.length > 0 && (
            <section>
              <h3 className="mb-3 text-base font-semibold text-slate-900">Eligibility Checks</h3>
              <div className="card p-4 divide-y divide-slate-100">
                {analysis.eligibility.map((e, i) => (
                  <div key={i} className="flex items-start gap-3 py-2 first:pt-0 last:pb-0">
                    <span
                      className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        e.passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
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
                  <span
                    key={i}
                    className="text-sm px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-200"
                  >
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
                  <span
                    key={i}
                    className="text-sm px-3 py-1 bg-red-50 text-red-700 rounded-full border border-red-200"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Prioritized Prep Tasks */}
          {tasks.length > 0 && (
            <section>
              <h3 className="mb-3 text-base font-semibold text-slate-900">
                Prioritized Preparation Tasks
              </h3>
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
                          <h4
                            className={`font-medium ${
                              t.done ? "text-slate-400 line-through" : "text-slate-900"
                            }`}
                          >
                            {t.skill}
                          </h4>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full border ${
                              PRIORITY_STYLES[t.priority] || PRIORITY_STYLES.medium
                            }`}
                          >
                            {t.priority}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">{t.reason}</p>
                        {t.resourceTitles && t.resourceTitles.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {t.resourceTitles.map((title, j) => (
                              <span
                                key={j}
                                className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md"
                              >
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
              <p className="mt-1 text-sm text-green-700">
                You have all the skills this company is looking for.
              </p>
            </div>
          )}
        </div>
      )}

      {/* My Saved Analyses */}
      <section className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-slate-900">My Saved Analyses</h2>
          {!savedLoading && savedAnalyses.length > 0 && (
            <span className="text-xs text-slate-400">{savedAnalyses.length} saved</span>
          )}
        </div>

        {savedLoading ? (
          <p className="text-sm text-slate-500 py-4">Loading saved analyses…</p>
        ) : listError ? (
          <div className="card p-4 border-red-200 bg-red-50">
            <p className="text-sm text-red-700">{listError}</p>
          </div>
        ) : savedAnalyses.length === 0 ? (
          <div className="card p-6 text-center">
            <p className="text-sm text-slate-500">
              No saved analyses yet. Run a skill-gap analysis above and click{" "}
              <strong>Save Analysis</strong> to keep it here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {savedAnalyses.map((p) => {
              const tasksDone = p.tasks?.filter((t) => t.done).length || 0;
              const totalT = p.tasks?.length || 0;
              const pct = totalT > 0 ? Math.round((tasksDone / totalT) * 100) : 0;
              const isRenaming = renamingId === p._id;

              return (
                <div key={p._id} className="card p-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-40">
                      {isRenaming ? (
                        <form
                          onSubmit={(e) => handleRenameSubmit(e, p._id)}
                          className="flex items-center gap-2"
                        >
                          <input
                            type="text"
                            className="input flex-1"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            autoFocus
                          />
                          <button type="submit" className="btn-primary text-xs py-1 px-3">
                            Save
                          </button>
                          <button
                            type="button"
                            className="btn-secondary text-xs py-1 px-3"
                            onClick={() => {
                              setRenamingId(null);
                              setRenameValue("");
                            }}
                          >
                            Cancel
                          </button>
                        </form>
                      ) : (
                        <>
                          <h3 className="font-semibold text-slate-900">
                            {p.title || p.companyId?.name || "Untitled analysis"}
                          </h3>
                          <p className="text-sm text-slate-500">
                            {p.companyId?.name || "Unknown company"}
                            {" · "}
                            {p.matched?.length || 0} matched · {p.missing?.length || 0} missing
                            {p.readiness != null && ` · ${p.readiness}% ready`}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ""}
                          </p>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="w-28 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500">
                        {tasksDone}/{totalT}
                      </span>
                      <button
                        type="button"
                        className="text-sm font-medium text-brand-600 hover:text-brand-700"
                        onClick={() => handleReopen(p._id)}
                      >
                        Open
                      </button>
                      <button
                        type="button"
                        className="text-xs text-slate-500 hover:text-slate-700"
                        onClick={() => {
                          setRenamingId(p._id);
                          setRenameValue(p.title || "");
                        }}
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        className="text-xs text-red-500 hover:text-red-700"
                        disabled={deletingId === p._id}
                        onClick={() => handleDelete(p._id)}
                      >
                        {deletingId === p._id ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
