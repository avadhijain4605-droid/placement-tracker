import { useState, useEffect } from "react";
import { useParams, useNavigate, Navigate, Link } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api.js";

export default function AdminDriveForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { student } = useAuth();
  const isAdmin = student?.role === "admin" || student?.role === "super_admin";
  if (!student) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const isEdit = !!id;
  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(isEdit);

  const [form, setForm] = useState({
    companyId: "",
    jobTitle: "",
    jobDescription: "",
    jobType: "full-time",
    jobLocation: "",
    workMode: "onsite",
    applicationOpenDate: "",
    applicationDeadline: "",
    driveDate: "",
    requiredSkills: "",
    applicationInstructions: "",
    externalApplicationUrl: "",
    status: "draft",
    minCgpa: "",
    branches: "",
    graduationYear: "",
    maxBacklogs: "0",
    backlogAllowed: true,
    minAmount: "",
    maxAmount: "",
    currency: "INR",
    period: "lpa",
  });

  useEffect(() => {
    api.listCompanies().then((data) => {
      setCompanies(data.companies || []);
    }).catch(() => {}).finally(() => setCompaniesLoading(false));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    async function load() {
      try {
        const data = await api.getDrive(id);
        const d = data.drive;
        setForm({
          companyId: d.company?._id || "",
          jobTitle: d.jobTitle || "",
          jobDescription: d.jobDescription || "",
          jobType: d.jobType || "full-time",
          jobLocation: d.jobLocation || "",
          workMode: d.workMode || "onsite",
          applicationOpenDate: d.applicationOpenDate ? d.applicationOpenDate.slice(0, 10) : "",
          applicationDeadline: d.applicationDeadline ? d.applicationDeadline.slice(0, 10) : "",
          driveDate: d.driveDate ? d.driveDate.slice(0, 10) : "",
          requiredSkills: (d.requiredSkills || []).join(", "),
          applicationInstructions: d.applicationInstructions || "",
          externalApplicationUrl: d.externalApplicationUrl || "",
          status: d.status || "draft",
          minCgpa: d.eligibility?.minCgpa || "",
          branches: (d.eligibility?.branches || []).join(", "),
          graduationYear: (d.eligibility?.graduationYear || []).join(", "),
          maxBacklogs: String(d.eligibility?.maxBacklogs || 0),
          backlogAllowed: d.eligibility?.backlogAllowed ?? true,
          minAmount: d.package?.minAmount || "",
          maxAmount: d.package?.maxAmount || "",
          currency: d.package?.currency || "INR",
          period: d.package?.period || "lpa",
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, isEdit]);

  function setField(key, val) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (!form.companyId) { setError("Please select a company."); setSaving(false); return; }
      if (!form.jobTitle.trim()) { setError("Job title is required."); setSaving(false); return; }
      if (!form.applicationDeadline) { setError("Application deadline is required."); setSaving(false); return; }

      const payload = {
        companyId: form.companyId,
        jobTitle: form.jobTitle,
        jobDescription: form.jobDescription,
        jobType: form.jobType,
        jobLocation: form.jobLocation,
        workMode: form.workMode,
        applicationOpenDate: form.applicationOpenDate || undefined,
        applicationDeadline: form.applicationDeadline,
        driveDate: form.driveDate || undefined,
        requiredSkills: form.requiredSkills.split(",").map((s) => s.trim()).filter(Boolean),
        applicationInstructions: form.applicationInstructions,
        externalApplicationUrl: form.externalApplicationUrl,
        status: form.status,
        eligibility: {
          minCgpa: form.minCgpa ? Number(form.minCgpa) : 0,
          branches: form.branches.split(",").map((s) => s.trim()).filter(Boolean),
          graduationYear: form.graduationYear.split(",").map((s) => parseInt(s.trim())).filter((n) => !isNaN(n)),
          maxBacklogs: parseInt(form.maxBacklogs) || 0,
          backlogAllowed: form.backlogAllowed,
        },
        package: {
          minAmount: form.minAmount ? Number(form.minAmount) : undefined,
          maxAmount: form.maxAmount ? Number(form.maxAmount) : undefined,
          currency: form.currency,
          period: form.period,
        },
      };

      if (isEdit) {
        await api.updateDrive(id, payload);
      } else {
        await api.createDrive(payload);
      }
      navigate("/admin/drives");
    } catch (err) {
      setError(err.message || "Failed to save drive.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="card p-8 text-center text-slate-500">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title={isEdit ? "Edit Drive" : "Create Placement Drive"}
        subtitle="Fill in the drive details. Save as draft or publish immediately."
        actions={<Link to="/admin/drives" className="btn-secondary">← Back</Link>}
      />

      {error && <div className="card p-4 border-red-200 bg-red-50 mb-4"><p className="text-sm text-red-700">{error}</p></div>}

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div>
          <label className="label" htmlFor="companyId">Company *</label>
          {companiesLoading ? (
            <p className="text-sm text-slate-500 py-2">Loading companies...</p>
          ) : (
            <select id="companyId" className="input" value={form.companyId} onChange={(e) => setField("companyId", e.target.value)} required>
              <option value="">Select a company</option>
              {companies.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          )}
        </div>

        <div>
          <label className="label" htmlFor="jobTitle">Job Title *</label>
          <input id="jobTitle" className="input" value={form.jobTitle} onChange={(e) => setField("jobTitle", e.target.value)} required />
        </div>

        <div>
          <label className="label" htmlFor="jobDescription">Job Description</label>
          <textarea id="jobDescription" className="input min-h-24" value={form.jobDescription} onChange={(e) => setField("jobDescription", e.target.value)} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="jobType">Job Type</label>
            <select id="jobType" className="input" value={form.jobType} onChange={(e) => setField("jobType", e.target.value)}>
              <option value="full-time">Full-time</option>
              <option value="internship">Internship</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="workMode">Work Mode</label>
            <select id="workMode" className="input" value={form.workMode} onChange={(e) => setField("workMode", e.target.value)}>
              <option value="onsite">Onsite</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="jobLocation">Job Location</label>
          <input id="jobLocation" className="input" value={form.jobLocation} onChange={(e) => setField("jobLocation", e.target.value)} />
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="label" htmlFor="minAmount">Min Package</label>
            <input id="minAmount" type="number" className="input" value={form.minAmount} onChange={(e) => setField("minAmount", e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="maxAmount">Max Package</label>
            <input id="maxAmount" type="number" className="input" value={form.maxAmount} onChange={(e) => setField("maxAmount", e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="period">Package Period</label>
            <select id="period" className="input" value={form.period} onChange={(e) => setField("period", e.target.value)}>
              <option value="lpa">LPA</option>
              <option value="monthly">Per Month</option>
              <option value="stipend">Stipend</option>
              <option value="one-time">One-time</option>
            </select>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="label" htmlFor="applicationOpenDate">Application Opens</label>
            <input id="applicationOpenDate" type="date" className="input" value={form.applicationOpenDate} onChange={(e) => setField("applicationOpenDate", e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="applicationDeadline">Application Deadline *</label>
            <input id="applicationDeadline" type="date" className="input" value={form.applicationDeadline} onChange={(e) => setField("applicationDeadline", e.target.value)} required />
          </div>
          <div>
            <label className="label" htmlFor="driveDate">Drive Date</label>
            <input id="driveDate" type="date" className="input" value={form.driveDate} onChange={(e) => setField("driveDate", e.target.value)} />
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <h3 className="font-semibold text-slate-900 mb-3">Eligibility Criteria</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="minCgpa">Minimum CGPA</label>
              <input id="minCgpa" type="number" step="0.01" min="0" max="10" className="input" value={form.minCgpa} onChange={(e) => setField("minCgpa", e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="branches">Eligible Branches (comma-separated)</label>
              <input id="branches" className="input" placeholder="CSE, IT, ECE" value={form.branches} onChange={(e) => setField("branches", e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="graduationYear">Graduation Years (comma-separated)</label>
              <input id="graduationYear" className="input" placeholder="2025, 2026" value={form.graduationYear} onChange={(e) => setField("graduationYear", e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="maxBacklogs">Max Backlogs</label>
              <input id="maxBacklogs" type="number" min="0" className="input" value={form.maxBacklogs} onChange={(e) => setField("maxBacklogs", e.target.value)} />
            </div>
          </div>
          <label className="mt-3 flex items-center gap-2">
            <input type="checkbox" checked={form.backlogAllowed} onChange={(e) => setField("backlogAllowed", e.target.checked)} />
            <span className="text-sm text-slate-700">Backlogs allowed</span>
          </label>
        </div>

        <div>
          <label className="label" htmlFor="requiredSkills">Required Skills (comma-separated)</label>
          <input id="requiredSkills" className="input" placeholder="JavaScript, React, Node.js" value={form.requiredSkills} onChange={(e) => setField("requiredSkills", e.target.value)} />
        </div>

        <div>
          <label className="label" htmlFor="applicationInstructions">Application Instructions</label>
          <textarea id="applicationInstructions" className="input min-h-16" value={form.applicationInstructions} onChange={(e) => setField("applicationInstructions", e.target.value)} />
        </div>

        <div>
          <label className="label" htmlFor="externalApplicationUrl">External Application URL (optional)</label>
          <input id="externalApplicationUrl" type="url" className="input" value={form.externalApplicationUrl} onChange={(e) => setField("externalApplicationUrl", e.target.value)} />
        </div>

        <div>
          <label className="label" htmlFor="status">Status</label>
          <select id="status" className="input" value={form.status} onChange={(e) => setField("status", e.target.value)}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving..." : isEdit ? "Update Drive" : "Create Drive"}
          </button>
          <Link to="/admin/drives" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
