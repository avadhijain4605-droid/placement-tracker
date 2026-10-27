import { useState, useRef } from "react";
import { Navigate, Link } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api.js";

// ── Helpers ───────────────────────────────────────────────────────
function arrToText(arr) {
  return Array.isArray(arr) ? arr.join(", ") : "";
}
function textToArr(text) {
  return text.split(",").map((s) => s.trim()).filter(Boolean);
}

const CODING_PLATFORMS = [
  { value: "leetcode", label: "LeetCode" },
  { value: "codeforces", label: "Codeforces" },
  { value: "codechef", label: "CodeChef" },
  { value: "hackerrank", label: "HackerRank" },
  { value: "geeksforgeeks", label: "GeeksforGeeks" },
  { value: "github", label: "GitHub" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "portfolio", label: "Portfolio Website" },
];

const EMPTY_PROJECT = { title: "", description: "", technologies: "", githubLink: "", demoLink: "" };
const EMPTY_CERT = { name: "", issuer: "", issueDate: "", credentialId: "", credentialUrl: "" };
const EMPTY_INTERNSHIP = { company: "", role: "", startDate: "", endDate: "", description: "" };
const EMPTY_ACHIEVEMENT = { title: "", description: "", date: "" };
const EMPTY_OFFER = { company: "", role: "", package: "", offerDate: "", status: "pending" };

export default function StudentProfile() {
  const { student, refreshStudent } = useAuth();

  // Personal & Academic
  const [name, setName] = useState(student?.name || "");
  const [phone, setPhone] = useState(student?.phone || "");
  const [college, setCollege] = useState(student?.college || "");
  const [degree, setDegree] = useState(student?.degree || "");
  const [branch, setBranch] = useState(student?.branch || "");
  const [graduationYear, setGraduationYear] = useState(student?.graduationYear || "");
  const [cgpa, setCgpa] = useState(student?.cgpa || "");
  const [totalActiveBacklogs, setTotalActiveBacklogs] = useState(student?.totalActiveBacklogs ?? 0);
  const [backlogHistory, setBacklogHistory] = useState(student?.backlogHistory ?? 0);

  // Skills & Experience
  const [skillsText, setSkillsText] = useState(arrToText(student?.skills));
  const [progLangsText, setProgLangsText] = useState(arrToText(student?.programmingLanguages));
  const [frameworksText, setFrameworksText] = useState(arrToText(student?.frameworks));
  const [projects, setProjects] = useState(
    (student?.projects || []).map((p) => ({
      title: p.title || "",
      description: p.description || "",
      technologies: Array.isArray(p.technologies) ? p.technologies.join(", ") : "",
      githubLink: p.githubLink || "",
      demoLink: p.demoLink || "",
    }))
  );
  const [internships, setInternships] = useState(
    (student?.internships || []).map((i) => ({
      company: i.company || "",
      role: i.role || "",
      startDate: i.startDate || "",
      endDate: i.endDate || "",
      description: i.description || "",
    }))
  );
  const [achievements, setAchievements] = useState(
    (student?.achievements || []).map((a) => ({
      title: a.title || "",
      description: a.description || "",
      date: a.date || "",
    }))
  );

  // Certifications
  const [certifications, setCertifications] = useState(
    (student?.certifications || []).map((c) => ({
      name: c.name || "",
      issuer: c.issuer || "",
      issueDate: c.issueDate || "",
      credentialId: c.credentialId || "",
      credentialUrl: c.credentialUrl || "",
    }))
  );

  // Coding profiles
  const [codingProfiles, setCodingProfiles] = useState(() => {
    const existing = student?.codingProfiles || [];
    const result = {};
    for (const p of CODING_PLATFORMS) {
      const found = existing.find((e) => e.platform === p.value);
      result[p.value] = found?.url || "";
    }
    return result;
  });

  // Placement preferences
  const [preferredRolesText, setPreferredRolesText] = useState(arrToText(student?.preferredRoles));
  const [preferredLocationsText, setPreferredLocationsText] = useState(arrToText(student?.preferredLocations));
  const [jobType, setJobType] = useState(student?.jobType || "");

  // Placement information
  const [placementStatus, setPlacementStatus] = useState(student?.placementStatus || "not_placed");
  const [offers, setOffers] = useState(
    (student?.offers || []).map((o) => ({
      company: o.company || "",
      role: o.role || "",
      package: o.package || "",
      offerDate: o.offerDate || "",
      status: o.status || "pending",
    }))
  );

  // Resume
  const [resumeInfo, setResumeInfo] = useState(student?.resume || null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);

  // Form state
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  if (!student) return <Navigate to="/login" replace />;

  // ── Dynamic list helpers ────────────────────────────────────────
  function addProject() { setProjects((p) => [...p, { ...EMPTY_PROJECT }]); }
  function removeProject(idx) { setProjects((p) => p.filter((_, i) => i !== idx)); }
  function updateProject(idx, field, value) {
    setProjects((p) => p.map((pr, i) => (i === idx ? { ...pr, [field]: value } : pr)));
  }

  function addCert() { setCertifications((c) => [...c, { ...EMPTY_CERT }]); }
  function removeCert(idx) { setCertifications((c) => c.filter((_, i) => i !== idx)); }
  function updateCert(idx, field, value) {
    setCertifications((c) => c.map((ce, i) => (i === idx ? { ...ce, [field]: value } : ce)));
  }

  function addInternship() { setInternships((i) => [...i, { ...EMPTY_INTERNSHIP }]); }
  function removeInternship(idx) { setInternships((i) => i.filter((_, j) => j !== idx)); }
  function updateInternship(idx, field, value) {
    setInternships((arr) => arr.map((ip, i) => (i === idx ? { ...ip, [field]: value } : ip)));
  }

  function addAchievement() { setAchievements((a) => [...a, { ...EMPTY_ACHIEVEMENT }]); }
  function removeAchievement(idx) { setAchievements((a) => a.filter((_, i) => i !== idx)); }
  function updateAchievement(idx, field, value) {
    setAchievements((arr) => arr.map((a, i) => (i === idx ? { ...a, [field]: value } : a)));
  }

  function addOffer() { setOffers((o) => [...o, { ...EMPTY_OFFER }]); }
  function removeOffer(idx) { setOffers((o) => o.filter((_, i) => i !== idx)); }
  function updateOffer(idx, field, value) {
    setOffers((arr) => arr.map((o, i) => (i === idx ? { ...o, [field]: value } : o)));
  }

  // ── Resume handlers ─────────────────────────────────────────────
  async function handleResumeUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const data = await api.uploadResume(file);
      setResumeInfo(data.resume);
    } catch (err) {
      setUploadError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleResumeDelete() {
    try {
      await api.deleteResume();
      setResumeInfo(null);
    } catch (err) {
      setUploadError(err.message || "Delete failed.");
    }
  }

  // ── Save ────────────────────────────────────────────────────────
  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const body = {
        phone: phone.trim(),
        college: college.trim(),
        degree: degree.trim(),
        branch: branch.trim(),
        skills: textToArr(skillsText),
        programmingLanguages: textToArr(progLangsText),
        frameworks: textToArr(frameworksText),
        projects: projects
          .filter((p) => p.title.trim())
          .map((p) => ({
            title: p.title.trim(),
            description: p.description.trim(),
            technologies: textToArr(p.technologies),
            githubLink: p.githubLink.trim(),
            demoLink: p.demoLink.trim(),
          })),
        internships: internships
          .filter((i) => i.company.trim())
          .map((i) => ({
            company: i.company.trim(),
            role: i.role.trim(),
            startDate: i.startDate.trim(),
            endDate: i.endDate.trim(),
            description: i.description.trim(),
          })),
        achievements: achievements
          .filter((a) => a.title.trim())
          .map((a) => ({
            title: a.title.trim(),
            description: a.description.trim(),
            date: a.date.trim(),
          })),
        certifications: certifications
          .filter((c) => c.name.trim())
          .map((c) => ({
            name: c.name.trim(),
            issuer: c.issuer.trim(),
            issueDate: c.issueDate.trim(),
            credentialId: c.credentialId.trim(),
            credentialUrl: c.credentialUrl.trim(),
          })),
        preferredRoles: textToArr(preferredRolesText),
        preferredLocations: textToArr(preferredLocationsText),
        placementStatus,
        offers: offers
          .filter((o) => o.company.trim())
          .map((o) => ({
            company: o.company.trim(),
            role: o.role.trim(),
            package: o.package.trim(),
            offerDate: o.offerDate.trim(),
            status: o.status,
          })),
      };

      if (graduationYear) body.graduationYear = Number(graduationYear);
      if (cgpa !== "") body.cgpa = Number(cgpa);
      body.totalActiveBacklogs = Number(totalActiveBacklogs) || 0;
      body.backlogHistory = Number(backlogHistory) || 0;
      if (jobType) body.jobType = jobType;

      // Coding profiles — only include non-empty URLs
      const profiles = [];
      for (const p of CODING_PLATFORMS) {
        const url = (codingProfiles[p.value] || "").trim();
        if (url) profiles.push({ platform: p.value, url });
      }
      body.codingProfiles = profiles;

      await api.updateProfile(body);
      await refreshStudent();
      setSaved(true);
    } catch (err) {
      setError(err.message || "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  // ── Profile completeness check ──────────────────────────────────
  const skillsFilled = textToArr(skillsText).length > 0;
  const gradYearFilled = !!graduationYear;
  const profileComplete = skillsFilled && gradYearFilled;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="My Profile"
        subtitle="Your academic details, skills, and experience — used for AI prep plans and placement eligibility."
      />

      {!profileComplete && (
        <div className="mb-4 card p-4 border-amber-200 bg-amber-50">
          <p className="text-sm text-amber-800">
            Your profile is incomplete. Add at least your <strong>skills</strong> and{" "}
            <strong>graduation year</strong> to generate an AI preparation plan.
          </p>
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSave}>
        {/* ── Personal & Academic Details ── */}
        <section className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Personal &amp; Academic Details</h2>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="name">Full name <span className="text-red-500">*</span></label>
                <input id="name" type="text" className="input bg-slate-100" value={name} disabled title="Name cannot be changed here" />
                <p className="mt-1 text-xs text-slate-400">Contact an admin to change your name.</p>
              </div>
              <div>
                <label className="label" htmlFor="email">Email <span className="text-red-500">*</span></label>
                <input id="email" type="email" className="input bg-slate-100" value={student.email} disabled title="Email cannot be changed" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="phone">Phone number</label>
                <input id="phone" type="tel" className="input" placeholder="e.g. +91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div>
                <label className="label" htmlFor="college">College name</label>
                <input id="college" type="text" className="input" placeholder="e.g. Delhi Technological University" value={college} onChange={(e) => setCollege(e.target.value)} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="degree">Degree</label>
                <input id="degree" type="text" className="input" placeholder="e.g. B.Tech" value={degree} onChange={(e) => setDegree(e.target.value)} />
              </div>
              <div>
                <label className="label" htmlFor="branch">Branch</label>
                <input id="branch" type="text" className="input" placeholder="e.g. Computer Science" value={branch} onChange={(e) => setBranch(e.target.value)} />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="label" htmlFor="gradYear">Graduation year <span className="text-red-500">*</span></label>
                <input id="gradYear" type="number" min={2000} max={2100} className="input" placeholder="e.g. 2026" value={graduationYear} onChange={(e) => setGraduationYear(e.target.value)} required />
              </div>
              <div>
                <label className="label" htmlFor="cgpa">CGPA (out of 10)</label>
                <input id="cgpa" type="number" step="0.01" min={0} max={10} className="input" placeholder="e.g. 8.2" value={cgpa} onChange={(e) => setCgpa(e.target.value)} />
              </div>
              <div>
                <label className="label" htmlFor="backlogs">Active backlogs</label>
                <input id="backlogs" type="number" min={0} className="input" placeholder="0" value={totalActiveBacklogs} onChange={(e) => setTotalActiveBacklogs(e.target.value)} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="backlogHistory">Total backlogs (history)</label>
                <input id="backlogHistory" type="number" min={0} className="input" placeholder="0" value={backlogHistory} onChange={(e) => setBacklogHistory(e.target.value)} />
                <p className="mt-1 text-xs text-slate-400">Total backlogs ever cleared, if any.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Skills & Experience ── */}
        <section className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Skills &amp; Experience</h2>
          <div className="space-y-4">
            <div>
              <label className="label" htmlFor="skills">Technical skills <span className="text-red-500">*</span></label>
              <input id="skills" type="text" className="input" placeholder="e.g. JavaScript, React, Node.js, SQL" value={skillsText} onChange={(e) => setSkillsText(e.target.value)} required />
              <p className="mt-1 text-xs text-slate-400">Separate skills with commas.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="progLangs">Programming languages</label>
                <input id="progLangs" type="text" className="input" placeholder="e.g. Python, Java, C++" value={progLangsText} onChange={(e) => setProgLangsText(e.target.value)} />
                <p className="mt-1 text-xs text-slate-400">Comma-separated.</p>
              </div>
              <div>
                <label className="label" htmlFor="frameworks">Frameworks &amp; tools</label>
                <input id="frameworks" type="text" className="input" placeholder="e.g. React, Express, Docker" value={frameworksText} onChange={(e) => setFrameworksText(e.target.value)} />
                <p className="mt-1 text-xs text-slate-400">Comma-separated.</p>
              </div>
            </div>

            {/* Projects */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-700">Projects</h3>
                <button type="button" className="btn-secondary text-xs py-1 px-3" onClick={addProject}>+ Add project</button>
              </div>
              <div className="space-y-3">
                {projects.length === 0 && <p className="text-sm text-slate-400">No projects added yet.</p>}
                {projects.map((p, idx) => (
                  <div key={idx} className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="text-xs font-medium text-slate-500">Project {idx + 1}</span>
                      <button type="button" className="text-xs text-red-500 hover:text-red-700" onClick={() => removeProject(idx)}>Remove</button>
                    </div>
                    <div className="space-y-3">
                      <input type="text" className="input" placeholder="Project title" value={p.title} onChange={(e) => updateProject(idx, "title", e.target.value)} />
                      <textarea className="input" rows={2} placeholder="Brief description" value={p.description} onChange={(e) => updateProject(idx, "description", e.target.value)} />
                      <input type="text" className="input" placeholder="Technologies (comma-separated)" value={p.technologies} onChange={(e) => updateProject(idx, "technologies", e.target.value)} />
                      <div className="grid sm:grid-cols-2 gap-3">
                        <input type="url" className="input" placeholder="GitHub link (optional)" value={p.githubLink} onChange={(e) => updateProject(idx, "githubLink", e.target.value)} />
                        <input type="url" className="input" placeholder="Demo link (optional)" value={p.demoLink} onChange={(e) => updateProject(idx, "demoLink", e.target.value)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Internships */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-700">Internships &amp; Work Experience</h3>
                <button type="button" className="btn-secondary text-xs py-1 px-3" onClick={addInternship}>+ Add experience</button>
              </div>
              <div className="space-y-3">
                {internships.length === 0 && <p className="text-sm text-slate-400">No internships added yet.</p>}
                {internships.map((i, idx) => (
                  <div key={idx} className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="text-xs font-medium text-slate-500">Experience {idx + 1}</span>
                      <button type="button" className="text-xs text-red-500 hover:text-red-700" onClick={() => removeInternship(idx)}>Remove</button>
                    </div>
                    <div className="space-y-3">
                      <div className="grid sm:grid-cols-2 gap-3">
                        <input type="text" className="input" placeholder="Company" value={i.company} onChange={(e) => updateInternship(idx, "company", e.target.value)} />
                        <input type="text" className="input" placeholder="Role / Position" value={i.role} onChange={(e) => updateInternship(idx, "role", e.target.value)} />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <input type="text" className="input" placeholder="Start date (e.g. Jan 2025)" value={i.startDate} onChange={(e) => updateInternship(idx, "startDate", e.target.value)} />
                        <input type="text" className="input" placeholder="End date (e.g. Jun 2025)" value={i.endDate} onChange={(e) => updateInternship(idx, "endDate", e.target.value)} />
                      </div>
                      <textarea className="input" rows={2} placeholder="What did you work on?" value={i.description} onChange={(e) => updateInternship(idx, "description", e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-700">Achievements</h3>
                <button type="button" className="btn-secondary text-xs py-1 px-3" onClick={addAchievement}>+ Add achievement</button>
              </div>
              <div className="space-y-3">
                {achievements.length === 0 && <p className="text-sm text-slate-400">No achievements added yet.</p>}
                {achievements.map((a, idx) => (
                  <div key={idx} className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="text-xs font-medium text-slate-500">Achievement {idx + 1}</span>
                      <button type="button" className="text-xs text-red-500 hover:text-red-700" onClick={() => removeAchievement(idx)}>Remove</button>
                    </div>
                    <div className="space-y-3">
                      <input type="text" className="input" placeholder="Title (e.g. 1st place Hackathon)" value={a.title} onChange={(e) => updateAchievement(idx, "title", e.target.value)} />
                      <textarea className="input" rows={2} placeholder="Description" value={a.description} onChange={(e) => updateAchievement(idx, "description", e.target.value)} />
                      <input type="text" className="input" placeholder="Date (e.g. Mar 2025)" value={a.date} onChange={(e) => updateAchievement(idx, "date", e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Certifications ── */}
        <section className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Certifications</h2>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-500">Add your professional certifications.</p>
            <button type="button" className="btn-secondary text-xs py-1 px-3" onClick={addCert}>+ Add certification</button>
          </div>
          <div className="space-y-3">
            {certifications.length === 0 && <p className="text-sm text-slate-400">No certifications added yet.</p>}
            {certifications.map((c, idx) => (
              <div key={idx} className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="text-xs font-medium text-slate-500">Certification {idx + 1}</span>
                  <button type="button" className="text-xs text-red-500 hover:text-red-700" onClick={() => removeCert(idx)}>Remove</button>
                </div>
                <div className="space-y-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <input type="text" className="input" placeholder="Certification name" value={c.name} onChange={(e) => updateCert(idx, "name", e.target.value)} />
                    <input type="text" className="input" placeholder="Issuing organization" value={c.issuer} onChange={(e) => updateCert(idx, "issuer", e.target.value)} />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <input type="text" className="input" placeholder="Issue date (e.g. Jun 2025)" value={c.issueDate} onChange={(e) => updateCert(idx, "issueDate", e.target.value)} />
                    <input type="text" className="input" placeholder="Credential ID (optional)" value={c.credentialId} onChange={(e) => updateCert(idx, "credentialId", e.target.value)} />
                  </div>
                  <input type="url" className="input" placeholder="Credential verification URL (optional)" value={c.credentialUrl} onChange={(e) => updateCert(idx, "credentialUrl", e.target.value)} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Resume Upload ── */}
        <section className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Resume</h2>
          {resumeInfo?.path ? (
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="text-sm font-medium text-slate-900">{resumeInfo.filename || "resume.pdf"}</p>
                <p className="text-xs text-slate-500">
                  Uploaded {resumeInfo.uploadedAt ? new Date(resumeInfo.uploadedAt).toLocaleDateString() : "—"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <a href={`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/students/me/resume`} target="_blank" rel="noreferrer" className="btn-secondary text-xs py-1 px-3">View</a>
                <button type="button" className="text-xs text-red-500 hover:text-red-700" onClick={handleResumeDelete}>Delete</button>
              </div>
            </div>
          ) : (
            <div>
              <label className="label" htmlFor="resume">Upload resume (PDF only, max 5 MB)</label>
              <input
                ref={fileInputRef}
                id="resume"
                type="file"
                accept="application/pdf,.pdf"
                className="text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                onChange={handleResumeUpload}
                disabled={uploading}
              />
              {uploading && <p className="mt-2 text-sm text-slate-500">Uploading…</p>}
              {uploadError && <p className="mt-2 text-sm text-red-600">{uploadError}</p>}
            </div>
          )}
        </section>

        {/* ── Coding Profiles & Links ── */}
        <section className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Coding Profiles &amp; Links</h2>
          <p className="text-sm text-slate-500 mb-4">All fields are optional. Leave blank if you don't use a platform.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {CODING_PLATFORMS.map((p) => (
              <div key={p.value}>
                <label className="label" htmlFor={`profile-${p.value}`}>{p.label}</label>
                <input
                  id={`profile-${p.value}`}
                  type="url"
                  className="input"
                  placeholder={`https://${p.value}.com/your-username`}
                  value={codingProfiles[p.value] || ""}
                  onChange={(e) => setCodingProfiles((prev) => ({ ...prev, [p.value]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        </section>

        {/* ── Placement Preferences ── */}
        <section className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Placement Preferences</h2>
          <div className="space-y-4">
            <div>
              <label className="label" htmlFor="preferredRoles">Preferred job roles</label>
              <input id="preferredRoles" type="text" className="input" placeholder="e.g. Software Engineer, Data Analyst" value={preferredRolesText} onChange={(e) => setPreferredRolesText(e.target.value)} />
              <p className="mt-1 text-xs text-slate-400">Comma-separated.</p>
            </div>
            <div>
              <label className="label" htmlFor="preferredLocations">Preferred locations</label>
              <input id="preferredLocations" type="text" className="input" placeholder="e.g. Bangalore, Pune, Remote" value={preferredLocationsText} onChange={(e) => setPreferredLocationsText(e.target.value)} />
              <p className="mt-1 text-xs text-slate-400">Comma-separated.</p>
            </div>
            <div>
              <label className="label" htmlFor="jobType">Internship / Full-time preference</label>
              <select id="jobType" className="input" value={jobType} onChange={(e) => setJobType(e.target.value)}>
                <option value="">Select preference</option>
                <option value="full-time">Full-time</option>
                <option value="internship">Internship</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>
        </section>

        {/* ── Placement Information ── */}
        <section className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Placement Information</h2>
          <div className="space-y-4">
            <div>
              <label className="label" htmlFor="placementStatus">Placement status</label>
              <select id="placementStatus" className="input" value={placementStatus} onChange={(e) => setPlacementStatus(e.target.value)}>
                <option value="not_placed">Not placed</option>
                <option value="in_process">In process</option>
                <option value="placed">Placed</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-700">Previous offers (if any)</h3>
                <button type="button" className="btn-secondary text-xs py-1 px-3" onClick={addOffer}>+ Add offer</button>
              </div>
              <div className="space-y-3">
                {offers.length === 0 && <p className="text-sm text-slate-400">No offers recorded.</p>}
                {offers.map((o, idx) => (
                  <div key={idx} className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="text-xs font-medium text-slate-500">Offer {idx + 1}</span>
                      <button type="button" className="text-xs text-red-500 hover:text-red-700" onClick={() => removeOffer(idx)}>Remove</button>
                    </div>
                    <div className="space-y-3">
                      <div className="grid sm:grid-cols-2 gap-3">
                        <input type="text" className="input" placeholder="Company" value={o.company} onChange={(e) => updateOffer(idx, "company", e.target.value)} />
                        <input type="text" className="input" placeholder="Role" value={o.role} onChange={(e) => updateOffer(idx, "role", e.target.value)} />
                      </div>
                      <div className="grid sm:grid-cols-3 gap-3">
                        <input type="text" className="input" placeholder="Package (e.g. 8.5 LPA)" value={o.package} onChange={(e) => updateOffer(idx, "package", e.target.value)} />
                        <input type="text" className="input" placeholder="Offer date" value={o.offerDate} onChange={(e) => updateOffer(idx, "offerDate", e.target.value)} />
                        <select className="input" value={o.status} onChange={(e) => updateOffer(idx, "status", e.target.value)}>
                          <option value="pending">Pending</option>
                          <option value="accepted">Accepted</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Save ── */}
        {error && <div className="card p-4 border-red-200 bg-red-50"><p className="text-sm text-red-700">{error}</p></div>}
        {saved && <div className="card p-4 border-green-200 bg-green-50"><p className="text-sm text-green-700">Profile saved successfully.</p></div>}
        {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}

        <div className="flex items-center gap-3 pb-8">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save profile"}
          </button>
          {profileComplete && (
            <Link to="/ai-plan" className="btn-secondary">
              Go to PathAI Prep Plan →
            </Link>
          )}
          {profileComplete && (
            <Link to="/skill-gap" className="btn-secondary">
              Skill Gap Analysis →
            </Link>
          )}
        </div>
      </form>
    </div>
  );
}
