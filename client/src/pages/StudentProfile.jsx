import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api.js";

export default function StudentProfile() {
  const { student, refreshStudent } = useAuth();

  const [college, setCollege] = useState(student?.college || "");
  const [graduationYear, setGraduationYear] = useState(student?.graduationYear || "");
  const [cgpa, setCgpa] = useState(student?.cgpa || "");
  const [skillsText, setSkillsText] = useState((student?.skills || []).join(", "));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  if (!student) return <Navigate to="/login" replace />;

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const skills = skillsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const body = {
        college: college.trim(),
        skills,
      };
      if (graduationYear) body.graduationYear = Number(graduationYear);
      if (cgpa) body.cgpa = Number(cgpa);

      await api.updateProfile(body);
      await refreshStudent();
      setSaved(true);
    } catch (err) {
      setError(err.message || "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  const skillsFilled = (student?.skills || []).length > 0;
  const gradYearFilled = !!student?.graduationYear;
  const profileComplete = skillsFilled && gradYearFilled;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="My Profile"
        subtitle="Your academic details and skills — used to generate your AI prep plan."
      />

      {!profileComplete && (
        <div className="mb-4 card p-4 border-amber-200 bg-amber-50">
          <p className="text-sm text-amber-800">
            Your profile is incomplete. Add at least your <strong>skills</strong> and{" "}
            <strong>graduation year</strong> to generate an AI preparation plan.
          </p>
        </div>
      )}

      <form className="card p-6 space-y-4" onSubmit={handleSave}>
        <div>
          <label className="label" htmlFor="college">College</label>
          <input id="college" type="text" className="input" placeholder="e.g. Delhi Technological University" value={college} onChange={(e) => setCollege(e.target.value)} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="gradYear">Graduation year</label>
            <input id="gradYear" type="number" min={2000} max={2100} className="input" placeholder="e.g. 2026" value={graduationYear} onChange={(e) => setGraduationYear(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="cgpa">CGPA (out of 10)</label>
            <input id="cgpa" type="number" step="0.01" min={0} max={10} className="input" placeholder="e.g. 8.2" value={cgpa} onChange={(e) => setCgpa(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="skills">Skills</label>
          <input id="skills" type="text" className="input" placeholder="e.g. JavaScript, React, Node.js, SQL" value={skillsText} onChange={(e) => setSkillsText(e.target.value)} />
          <p className="mt-1 text-xs text-slate-400">Separate skills with commas.</p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-green-600">Profile saved. You can now generate an AI prep plan.</p>}

        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save profile"}
          </button>
          {profileComplete && (
            <Link to="/ai-plan" className="btn-secondary">
              Go to AI Prep Plan →
            </Link>
          )}
        </div>
      </form>
    </div>
  );
}
