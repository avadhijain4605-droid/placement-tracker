import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import { api } from "../api.js";

export default function CompanyDetails() {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Form state
  const [form, setForm] = useState({
    studentName: "",
    role: "",
    package: "",
    outcome: "offered",
    difficulty: "medium",
    overallExperience: "",
    tips: "",
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [companyData, expData] = await Promise.all([
          api.getCompany(id),
          api.listExperiences({ companyId: id }),
        ]);
        setCompany(companyData.company);
        setExperiences(expData.experiences || []);
      } catch (err) {
        setError(err.message || "Failed to load company details.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      const data = await api.submitExperience({
        companyId: id,
        studentName: form.studentName,
        role: form.role,
        package: form.package,
        outcome: form.outcome,
        difficulty: form.difficulty,
        overallExperience: form.overallExperience,
        tips: form.tips,
      });
      setExperiences([data.experience, ...experiences]);
      setSubmitSuccess(true);
      setShowForm(false);
      setForm({ studentName: "", role: "", package: "", outcome: "offered", difficulty: "medium", overallExperience: "", tips: "" });
    } catch (err) {
      setSubmitError(err.message || "Failed to submit experience.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div>
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-slate-100 rounded w-1/2 mb-8"></div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card p-5">
                <div className="h-4 bg-slate-200 rounded w-1/2 mb-3"></div>
                <div className="h-3 bg-slate-100 rounded w-full mb-2"></div>
                <div className="h-3 bg-slate-100 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Company Details" actions={<Link to="/companies" className="btn-secondary">← Back</Link>} />
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-700 font-medium">{error}</p>
          <Link to="/companies" className="mt-2 inline-block text-sm text-red-600 underline hover:text-red-800">
            Back to companies
          </Link>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div>
        <PageHeader title="Company Not Found" actions={<Link to="/companies" className="btn-secondary">← Back</Link>} />
        <p className="text-sm text-slate-500">This company does not exist.</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={company.name}
        subtitle={`${company.industry || ""} • ${company.headquarters || ""}`}
        actions={<Link to="/companies" className="btn-secondary">← Back</Link>}
      />

      {company.description && (
        <p className="text-sm text-slate-600 mb-6 max-w-3xl">{company.description}</p>
      )}

      {/* Roles */}
      {company.roles && company.roles.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Open Roles</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {company.roles.map((r, i) => (
              <div key={i} className="card p-4">
                <h3 className="font-medium text-slate-900">{r.title}</h3>
                {r.package && <p className="text-sm text-slate-600 mt-1">Package: {r.package}</p>}
                {r.location && <p className="text-sm text-slate-600">Location: {r.location}</p>}
                {r.eligibility && <p className="text-xs text-slate-500 mt-1">{r.eligibility}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Eligibility Criteria */}
      {company.eligibilityCriteria && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Eligibility Criteria</h2>
          <div className="card p-4">
            <ul className="text-sm text-slate-700 space-y-1">
              {company.eligibilityCriteria.minCgpa != null && (
                <li>Minimum CGPA: {company.eligibilityCriteria.minCgpa}</li>
              )}
              {company.eligibilityCriteria.allowedBranches && company.eligibilityCriteria.allowedBranches.length > 0 && (
                <li>Allowed Branches: {company.eligibilityCriteria.allowedBranches.join(", ")}</li>
              )}
              <li>Backlogs Allowed: {company.eligibilityCriteria.backlogAllowed ? "Yes" : "No"}</li>
              {company.eligibilityCriteria.graduationYear && company.eligibilityCriteria.graduationYear.length > 0 && (
                <li>Graduation Year: {company.eligibilityCriteria.graduationYear.join(", ")}</li>
              )}
            </ul>
          </div>
        </section>
      )}

      {/* Required Skills */}
      {company.requiredSkills && company.requiredSkills.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Required Skills</h2>
          <div className="flex flex-wrap gap-2">
            {company.requiredSkills.map((s) => (
              <span key={s} className="px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-sm font-medium">
                {s}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Hiring Process */}
      {company.hiringProcess && company.hiringProcess.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Hiring Process</h2>
          <ol className="flex flex-wrap gap-3">
            {company.hiringProcess.map((step, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-brand-600 text-white text-xs font-bold">
                  {i + 1}
                </span>
                <span className="text-sm text-slate-700">{step}</span>
                {i < company.hiringProcess.length - 1 && <span className="text-slate-300">→</span>}
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* OA Patterns */}
      {company.oaPatterns && company.oaPatterns.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Online Assessment Patterns</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {company.oaPatterns.map((oa, i) => (
              <div key={i} className="card p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-slate-900">{oa.round}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    oa.difficulty === "hard" ? "bg-red-100 text-red-700" :
                    oa.difficulty === "medium" ? "bg-amber-100 text-amber-700" :
                    "bg-green-100 text-green-700"
                  }`}>
                    {oa.difficulty}
                  </span>
                </div>
                {oa.type && <p className="text-xs text-slate-500 mb-1">Type: {oa.type}</p>}
                {oa.duration && <p className="text-xs text-slate-500 mb-1">Duration: {oa.duration}</p>}
                {oa.description && <p className="text-sm text-slate-600 mb-2">{oa.description}</p>}
                {oa.topics && oa.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {oa.topics.map((t) => (
                      <span key={t} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Interview Questions */}
      {company.interviewQuestions && company.interviewQuestions.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Interview Questions</h2>
          <div className="space-y-2">
            {company.interviewQuestions.map((q, i) => (
              <div key={i} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-slate-800 font-medium">{q.question}</p>
                  <div className="flex gap-2 shrink-0">
                    {q.type && <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{q.type}</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      q.difficulty === "hard" ? "bg-red-100 text-red-700" :
                      q.difficulty === "medium" ? "bg-amber-100 text-amber-700" :
                      "bg-green-100 text-green-700"
                    }`}>
                      {q.difficulty}
                    </span>
                  </div>
                </div>
                {q.round && <p className="text-xs text-slate-400 mt-1">Round: {q.round}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Preparation Resources */}
      {company.preparationResources && company.preparationResources.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Preparation Resources</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {company.preparationResources.map((r, i) => (
              <a
                key={i}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="card p-4 hover:shadow-md hover:border-brand-200 transition group"
              >
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-medium text-slate-900 group-hover:text-brand-600 transition">{r.title}</h3>
                  <span className="text-xs px-2 py-0.5 bg-brand-50 text-brand-700 rounded-full">{r.type}</span>
                </div>
                {r.topic && <p className="text-xs text-slate-500 mb-1">Topic: {r.topic}</p>}
                {r.description && <p className="text-sm text-slate-600">{r.description}</p>}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Placement Experiences */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-900">Placement Experiences</h2>
          <button
            onClick={() => { setShowForm(!showForm); setSubmitError(null); setSubmitSuccess(false); }}
            className="btn-primary text-sm"
          >
            {showForm ? "Cancel" : "Share Your Experience"}
          </button>
        </div>

        {submitSuccess && (
          <div className="rounded-lg bg-green-50 border border-green-200 p-3 mb-4">
            <p className="text-sm text-green-700 font-medium">Your experience has been shared successfully!</p>
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="card p-5 mb-4 space-y-3">
            {submitError && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-700">{submitError}</p>
              </div>
            )}
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                className="input"
                placeholder="Your name *"
                value={form.studentName}
                onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                required
              />
              <input
                className="input"
                placeholder="Role applied for *"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                required
              />
              <input
                className="input"
                placeholder="Package (e.g. 8.5 LPA)"
                value={form.package}
                onChange={(e) => setForm({ ...form, package: e.target.value })}
              />
              <select
                className="input"
                value={form.outcome}
                onChange={(e) => setForm({ ...form, outcome: e.target.value })}
              >
                <option value="offered">Offered</option>
                <option value="rejected">Rejected</option>
                <option value="in-progress">In Progress</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
              <select
                className="input"
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <textarea
              className="input min-h-20"
              placeholder="Describe your overall experience..."
              value={form.overallExperience}
              onChange={(e) => setForm({ ...form, overallExperience: e.target.value })}
            />
            <textarea
              className="input min-h-16"
              placeholder="Tips for juniors..."
              value={form.tips}
              onChange={(e) => setForm({ ...form, tips: e.target.value })}
            />
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? "Submitting..." : "Submit Experience"}
            </button>
          </form>
        )}

        {experiences.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">
            No placement experiences shared yet. Be the first to share!
          </p>
        ) : (
          <div className="space-y-3">
            {experiences.map((exp) => (
              <div key={exp._id} className="card p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-slate-900">{exp.studentName}</h3>
                    <p className="text-sm text-slate-600">{exp.role} • {exp.package || "—"}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    exp.outcome === "offered" ? "bg-green-100 text-green-700" :
                    exp.outcome === "rejected" ? "bg-red-100 text-red-700" :
                    "bg-amber-100 text-amber-700"
                  }`}>
                    {exp.outcome}
                  </span>
                </div>
                {exp.overallExperience && (
                  <p className="text-sm text-slate-700 mb-2 mt-2">{exp.overallExperience}</p>
                )}
                {exp.rounds && exp.rounds.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Rounds</p>
                    {exp.rounds.map((r, i) => (
                      <div key={i} className="text-sm border-l-2 border-brand-200 pl-3">
                        <span className="font-medium text-slate-800">{r.name || r.type}</span>
                        {r.difficulty && (
                          <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                            r.difficulty === "hard" ? "bg-red-100 text-red-700" :
                            r.difficulty === "medium" ? "bg-amber-100 text-amber-700" :
                            "bg-green-100 text-green-700"
                          }`}>{r.difficulty}</span>
                        )}
                        {r.details && <p className="text-slate-600 mt-0.5">{r.details}</p>}
                        {r.questionsAsked && r.questionsAsked.length > 0 && (
                          <ul className="mt-1 text-slate-500 text-xs list-disc list-inside">
                            {r.questionsAsked.map((q, j) => <li key={j}>{q}</li>)}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {exp.tips && (
                  <p className="mt-3 text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
                    <span className="font-medium text-slate-700">Tips: </span>{exp.tips}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
