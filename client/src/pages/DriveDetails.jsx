import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api.js";

function formatPackage(pkg) {
  if (!pkg || (!pkg.minAmount && !pkg.maxAmount)) return "Not specified";
  const min = pkg.minAmount || pkg.maxAmount;
  const max = pkg.maxAmount || pkg.minAmount;
  const range = min === max ? `${min}` : `${min} - ${max}`;
  const periodMap = { lpa: "LPA", monthly: "/month", "one-time": " (one-time)", stipend: " stipend" };
  return `${pkg.currency || "INR"} ${range} ${periodMap[pkg.period] || "LPA"}`;
}

const STATUS_STYLES = {
  draft: "bg-slate-100 text-slate-600",
  published: "bg-green-100 text-green-700",
  closed: "bg-amber-100 text-amber-700",
  archived: "bg-red-100 text-red-700",
};

export default function DriveDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { student } = useAuth();
  const [drive, setDrive] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState("");
  const [coverNote, setCoverNote] = useState("");
  const [showApplyForm, setShowApplyForm] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await api.getDrive(id);
        setDrive(data.drive);
        setEligibility(data.eligibility);
      } catch (err) {
        setError(err.message || "Could not load drive details.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleApply(e) {
    e.preventDefault();
    setApplying(true);
    setApplyError("");
    try {
      await api.applyToDrive(id, coverNote);
      setShowApplyForm(false);
      navigate("/applications");
    } catch (err) {
      setApplyError(err.message || "Failed to apply.");
    } finally {
      setApplying(false);
    }
  }

  if (loading) {
    return (
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
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Drive Details" actions={<Link to="/opportunities" className="btn-secondary">← Back</Link>} />
        <div className="card p-4 border-red-200 bg-red-50">
          <p className="text-sm text-red-700">{error}</p>
          <Link to="/opportunities" className="mt-2 inline-block text-sm text-red-600 underline">Back to opportunities</Link>
        </div>
      </div>
    );
  }

  if (!drive) return <div><PageHeader title="Not Found" /><p className="text-sm text-slate-500">Drive not found.</p></div>;

  const isAdmin = student?.role === "admin" || student?.role === "super_admin";
  const expired = new Date(drive.applicationDeadline) < new Date();

  return (
    <div>
      <PageHeader
        title={drive.jobTitle}
        subtitle={`${drive.company?.name || ""} • ${drive.jobType} • ${drive.workMode}`}
        actions={<Link to={isAdmin ? "/admin/drives" : "/opportunities"} className="btn-secondary">← Back</Link>}
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {drive.jobDescription && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Job Description</h2>
              <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{drive.jobDescription}</p>
            </div>
          )}

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Eligibility Criteria</h2>
            <ul className="text-sm text-slate-700 space-y-1.5">
              {drive.eligibility?.minCgpa > 0 && <li>Minimum CGPA: <strong>{drive.eligibility.minCgpa}</strong></li>}
              {drive.eligibility?.branches?.length > 0 && <li>Eligible branches: <strong>{drive.eligibility.branches.join(", ")}</strong></li>}
              {drive.eligibility?.graduationYear?.length > 0 && <li>Graduation years: <strong>{drive.eligibility.graduationYear.join(", ")}</strong></li>}
              {drive.eligibility?.degrees?.length > 0 && <li>Eligible degrees: <strong>{drive.eligibility.degrees.join(", ")}</strong></li>}
              <li>Backlogs: <strong>{drive.eligibility?.backlogAllowed ? `Allowed (max ${drive.eligibility?.maxBacklogs || 0})` : "Not allowed"}</strong></li>
            </ul>
          </div>

          {drive.requiredSkills?.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Required Skills</h2>
              <div className="flex flex-wrap gap-2">
                {drive.requiredSkills.map((s) => (
                  <span key={s} className="px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-sm font-medium">{s}</span>
                ))}
              </div>
            </div>
          )}

          {drive.selectionRounds?.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Selection Rounds</h2>
              <div className="space-y-3">
                {drive.selectionRounds.map((r, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-brand-600 text-white text-xs font-bold shrink-0">{i + 1}</span>
                    <div>
                      <h3 className="font-medium text-slate-900">{r.name}</h3>
                      {r.date && <p className="text-xs text-slate-500">{new Date(r.date).toLocaleDateString()}</p>}
                      {r.details && <p className="text-sm text-slate-600 mt-0.5">{r.details}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {drive.applicationInstructions && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Application Instructions</h2>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{drive.applicationInstructions}</p>
            </div>
          )}

          {drive.resources?.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Resources</h2>
              <div className="space-y-2">
                {drive.resources.map((r, i) => (
                  <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="block text-sm text-brand-600 hover:underline">
                    {r.title}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Summary</h3>
            <dl className="text-sm space-y-2">
              <div className="flex justify-between"><dt className="text-slate-500">Package</dt><dd className="font-medium text-slate-900">{formatPackage(drive.package)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Location</dt><dd className="font-medium text-slate-900">{drive.jobLocation || "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Work mode</dt><dd className="font-medium text-slate-900">{drive.workMode}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Deadline</dt><dd className="font-medium text-slate-900">{new Date(drive.applicationDeadline).toLocaleDateString()}</dd></div>
              {drive.driveDate && <div className="flex justify-between"><dt className="text-slate-500">Drive date</dt><dd className="font-medium text-slate-900">{new Date(drive.driveDate).toLocaleDateString()}</dd></div>}
              {drive.applicationOpenDate && <div className="flex justify-between"><dt className="text-slate-500">Opens</dt><dd className="font-medium text-slate-900">{new Date(drive.applicationOpenDate).toLocaleDateString()}</dd></div>}
            </dl>
          </div>

          {eligibility && (
            <div className={`card p-5 ${eligibility.eligible ? "border-green-200" : eligibility.undetermined ? "border-amber-200" : "border-red-200"}`}>
              <h3 className="font-semibold text-slate-900 mb-2">Your Eligibility</h3>
              {eligibility.eligible ? (
                <p className="text-sm text-green-700 font-medium">You meet all eligibility criteria.</p>
              ) : eligibility.undetermined ? (
                <div>
                  <p className="text-sm text-amber-700 font-medium">Eligibility cannot be determined.</p>
                  <p className="mt-1 text-xs text-amber-600">Complete your profile to check eligibility.</p>
                  <ul className="mt-2 text-xs text-amber-700 list-disc list-inside space-y-0.5">
                    {eligibility.reasons.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                  <Link to="/profile" className="mt-3 inline-block text-sm font-medium text-amber-700 underline">Complete profile</Link>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-red-700 font-medium">You do not meet the eligibility criteria.</p>
                  <ul className="mt-2 text-xs text-red-700 list-disc list-inside space-y-0.5">
                    {eligibility.reasons.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {!isAdmin && drive.status === "published" && !expired && (
            <div className="card p-5">
              {showApplyForm ? (
                <form onSubmit={handleApply} className="space-y-3">
                  <textarea
                    className="input min-h-20"
                    placeholder="Add a cover note (optional)..."
                    value={coverNote}
                    onChange={(e) => setCoverNote(e.target.value)}
                  />
                  {applyError && <p className="text-sm text-red-600">{applyError}</p>}
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary" disabled={applying}>
                      {applying ? "Applying..." : "Confirm Application"}
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => setShowApplyForm(false)}>Cancel</button>
                  </div>
                </form>
              ) : (
                <>
                  <button className="btn-primary w-full" onClick={() => setShowApplyForm(true)}>
                    Apply Now
                  </button>
                  {drive.externalApplicationUrl && (
                    <a
                      href={drive.externalApplicationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 block text-center text-sm text-brand-600 hover:underline"
                    >
                      Or apply via external link →
                    </a>
                  )}
                </>
              )}
            </div>
          )}

          {drive.externalApplicationUrl && (isAdmin || expired || drive.status !== "published") && (
            <a
              href={drive.externalApplicationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary w-full text-center block"
            >
              External application link →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
