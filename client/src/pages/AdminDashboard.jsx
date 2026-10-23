import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api.js";

export default function AdminDashboard() {
  const { student, loading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isAdmin = student?.role === "admin" || student?.role === "super_admin";
  if (authLoading) return <div className="text-center py-16 text-slate-500">Loading...</div>;
  if (!student) return <Navigate to="/admin/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  useEffect(() => {
    api.adminDashboard()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const stats = data?.stats || {};
  const charts = data?.charts || {};

  const statCards = [
    { label: "Companies", value: stats.totalCompanies, link: "/admin/companies" },
    { label: "Active Drives", value: stats.activeDrives, link: "/admin/drives" },
    { label: "Upcoming Deadlines", value: stats.upcomingDeadlines },
    { label: "Total Students", value: stats.totalStudents, link: "/admin/students" },
    { label: "Applications", value: stats.totalApplications, link: "/admin/applications" },
    { label: "Students Selected", value: stats.totalSelected },
    { label: "Experiences", value: stats.totalExperiences, link: "/admin/experiences" },
    { label: "Pending Reviews", value: stats.pendingExperiences, link: "/admin/experiences" },
    { label: "Prep Plans", value: stats.totalPrepPlans, link: "/admin/analytics" },
  ];

  const quickActions = [
    { to: "/admin/drives/new", label: "Create Drive", desc: "Post a new placement drive." },
    { to: "/admin/announcements", label: "Post Announcement", desc: "Publish an announcement." },
    { to: "/admin/applications", label: "View Applications", desc: "Review student applications." },
    { to: "/admin/companies", label: "Manage Companies", desc: "Add or edit companies." },
  ];

  return (
    <div>
      <PageHeader title="Placement Cell Dashboard" subtitle="Overview of placement activities, students, and statistics." />

      {error && <div className="card p-4 border-red-200 bg-red-50 mb-4"><p className="text-sm text-red-700">{error}</p></div>}

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-3"></div>
              <div className="h-8 bg-slate-100 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <section className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {statCards.map((s) => (
              <div key={s.label} className="card p-5">
                <p className="text-sm text-slate-500">{s.label}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{s.value ?? "—"}</p>
                {s.link && <Link to={s.link} className="mt-1 inline-block text-xs text-brand-600 hover:underline">View →</Link>}
              </div>
            ))}
          </section>

          {charts.driveStatus?.length > 0 && (
            <section className="card p-6 mb-6">
              <h2 className="text-base font-semibold text-slate-900 mb-4">Drive Status Breakdown</h2>
              <div className="space-y-2">
                {charts.driveStatus.map((s) => {
                  const total = charts.driveStatus.reduce((sum, x) => sum + x.count, 0);
                  const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
                  return (
                    <div key={s.status} className="flex items-center gap-3">
                      <span className="text-sm text-slate-600 w-24 capitalize">{s.status}</span>
                      <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-sm font-medium text-slate-700 w-12 text-right">{s.count}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {charts.applicationStatus?.length > 0 && (
            <section className="card p-6 mb-6">
              <h2 className="text-base font-semibold text-slate-900 mb-4">Application Status Breakdown</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {charts.applicationStatus.map((s) => (
                  <div key={s.status} className="text-center p-3 rounded-lg bg-slate-50">
                    <p className="text-2xl font-bold text-slate-900">{s.count}</p>
                    <p className="text-xs text-slate-500 capitalize">{s.status}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {charts.industryBreakdown?.length > 0 && (
            <section className="card p-6 mb-6">
              <h2 className="text-base font-semibold text-slate-900 mb-4">Companies by Industry</h2>
              <div className="space-y-2">
                {charts.industryBreakdown.map((s) => {
                  const total = charts.industryBreakdown.reduce((sum, x) => sum + x.count, 0);
                  const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
                  return (
                    <div key={s.industry} className="flex items-center gap-3">
                      <span className="text-sm text-slate-600 w-40 truncate">{s.industry}</span>
                      <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-sm font-medium text-slate-700 w-8 text-right">{s.count}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <section>
              <h2 className="mb-3 text-base font-semibold text-slate-900">Recent Registrations</h2>
              <div className="space-y-2">
                {data?.recentStudents?.length > 0 ? data.recentStudents.map((s) => (
                  <Link key={s._id} to="/admin/students" className="card p-3 flex items-center justify-between hover:shadow-sm transition">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{s.name}</p>
                      <p className="text-xs text-slate-500">{s.email}</p>
                    </div>
                    <span className="text-xs text-slate-400">{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "—"}</span>
                  </Link>
                )) : <p className="text-sm text-slate-500">No students registered yet.</p>}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-base font-semibold text-slate-900">Recent Experiences</h2>
              <div className="space-y-2">
                {data?.recentExperiences?.length > 0 ? data.recentExperiences.map((e) => (
                  <Link key={e._id} to="/admin/experiences" className="card p-3 flex items-center justify-between hover:shadow-sm transition">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{e.studentName} — {e.role}</p>
                      <p className="text-xs text-slate-500">{e.company?.name || "—"}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      e.moderationStatus === "approved" ? "bg-green-100 text-green-700" :
                      e.moderationStatus === "rejected" ? "bg-red-100 text-red-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>{e.moderationStatus}</span>
                  </Link>
                )) : <p className="text-sm text-slate-500">No experiences submitted yet.</p>}
              </div>
            </section>
          </div>

          <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((q) => (
              <Link key={q.to} to={q.to} className="card p-5 hover:shadow-md hover:border-brand-200 transition group">
                <h3 className="font-semibold text-slate-900 group-hover:text-brand-700">{q.label}</h3>
                <p className="mt-1 text-sm text-slate-500">{q.desc}</p>
                <span className="mt-3 inline-block text-sm font-medium text-brand-600">Get started →</span>
              </Link>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
