import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api.js";

const studentQuickLinks = [
  { to: "/opportunities", title: "Placement Opportunities", desc: "Browse active drives and apply." },
  { to: "/profile", title: "Complete your profile", desc: "Add skills, resume, and target roles." },
  { to: "/skill-gap", title: "Run a skill-gap analysis", desc: "See which skills you're missing." },
  { to: "/ai-plan", title: "Generate an AI prep plan", desc: "Get a personalized preparation roadmap." },
];

const adminQuickLinks = [
  { to: "/admin/drives/new", title: "Create Drive", desc: "Post a new placement drive." },
  { to: "/admin/announcements", title: "Post Announcement", desc: "Publish an announcement." },
  { to: "/admin/applications", title: "View Applications", desc: "Review student applications." },
  { to: "/admin/companies", title: "Manage Companies", desc: "Edit company details." },
];

export default function Dashboard() {
  const { student } = useAuth();
  const [progress, setProgress] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = student?.role === "admin" || student?.role === "super_admin";
  const quickLinks = isAdmin ? adminQuickLinks : studentQuickLinks;

  useEffect(() => {
    if (!student) return;
    const tasks = isAdmin
      ? [api.adminDashboard().then(() => {}).catch(() => {})]
      : [
          api.listProgress()
            .then((data) => setProgress(data.progress || []))
            .catch(() => setProgress([])),
          api.listAnnouncements()
            .then((data) => setAnnouncements((data.announcements || []).slice(0, 3)))
            .catch(() => setAnnouncements([])),
        ];
    Promise.all(tasks).finally(() => setLoading(false));
  }, [student, isAdmin]);

  if (isAdmin) {
    return (
      <div>
        <PageHeader title="Placement Cell Dashboard" subtitle="Manage all placement activities." />
        <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {quickLinks.map((q) => (
            <Link key={q.to} to={q.to} className="card p-5 hover:shadow-md hover:border-brand-200 transition group">
              <h3 className="font-semibold text-slate-900 group-hover:text-brand-700">{q.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{q.desc}</p>
              <span className="mt-3 inline-block text-sm font-medium text-brand-600">Get started →</span>
            </Link>
          ))}
        </section>
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Full Statistics</h2>
          <p className="text-sm text-slate-500">Visit the <Link to="/admin/dashboard" className="text-brand-600 hover:underline">Admin Dashboard</Link> for detailed statistics and charts.</p>
        </div>
      </div>
    );
  }

  const totalTasks = progress.reduce((sum, p) => sum + (p.tasks?.length || 0), 0);
  const doneTasks = progress.reduce(
    (sum, p) => sum + (p.tasks?.filter((t) => t.done).length || 0), 0
  );
  const prepPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const avgReadiness = progress.length > 0
    ? Math.round(
        progress
          .filter((p) => p.readiness != null)
          .reduce((sum, p) => sum + p.readiness, 0) /
        Math.max(progress.filter((p) => p.readiness != null).length, 1)
      )
    : null;

  return (
    <div>
      <PageHeader
        title="Placement Dashboard"
        subtitle="Your placement preparation at a glance."
      />

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-5">
          <p className="text-sm text-slate-500">Companies analyzed</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {loading ? "—" : progress.length}
          </p>
          <p className="mt-1 text-xs text-slate-400">Skill-gap analyses saved</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500">Avg. readiness</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {loading ? "—" : avgReadiness != null ? `${avgReadiness}%` : "—"}
          </p>
          <p className="mt-1 text-xs text-slate-400">Across all analyses</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500">Prep tasks done</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {loading ? "—" : `${doneTasks}/${totalTasks}`}
          </p>
          <p className="mt-1 text-xs text-slate-400">{prepPercent}% complete</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500">Eligibility passed</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {loading ? "—" : `${progress.filter((p) => p.eligibilityPassed).length}/${progress.length}`}
          </p>
          <p className="mt-1 text-xs text-slate-400">Of analyzed companies</p>
        </div>
      </section>

      {/* Recent announcements */}
      {announcements.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-900">Recent Announcements</h2>
            <Link to="/announcements" className="text-sm font-medium text-brand-600">View all →</Link>
          </div>
          <div className="space-y-3">
            {announcements.map((ann) => (
              <div key={ann._id} className="card p-4">
                <h3 className="font-medium text-slate-900">{ann.title}</h3>
                <p className="mt-1 text-sm text-slate-600 line-clamp-2">{ann.content}</p>
                <p className="mt-1 text-xs text-slate-400">{ann.publishedAt ? new Date(ann.publishedAt).toLocaleDateString() : new Date(ann.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Saved analyses */}
      {progress.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-base font-semibold text-slate-900">Your Skill-Gap Analyses</h2>
          <div className="space-y-3">
            {progress.map((p) => {
              const tasksDone = p.tasks?.filter((t) => t.done).length || 0;
              const totalT = p.tasks?.length || 0;
              const pct = totalT > 0 ? Math.round((tasksDone / totalT) * 100) : 0;
              return (
                <div key={p._id} className="card p-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {p.companyId?.name || "Unknown company"}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {p.matched?.length || 0} matched · {p.missing?.length || 0} missing
                        {p.readiness != null && ` · ${p.readiness}% ready`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-slate-500">{tasksDone}/{totalT} tasks</span>
                      <Link to="/skill-gap" className="text-sm font-medium text-brand-600">
                        Re-run
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickLinks.map((q) => (
          <Link
            key={q.to}
            to={q.to}
            className="card p-5 hover:shadow-md hover:border-brand-200 transition group"
          >
            <h3 className="font-semibold text-slate-900 group-hover:text-brand-700">{q.title}</h3>
            <p className="mt-1 text-sm text-slate-500">{q.desc}</p>
            <span className="mt-3 inline-block text-sm font-medium text-brand-600">Get started →</span>
          </Link>
        ))}
      </section>
    </div>
  );
}
