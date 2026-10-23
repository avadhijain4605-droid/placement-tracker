import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api.js";

export default function AdminDashboard() {
  const { student } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isAdmin = student?.role === "admin" || student?.role === "super_admin";
  if (!student) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  useEffect(() => {
    api.adminDashboard()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const stats = data?.stats || {};
  const charts = data?.charts || {};

  const quickActions = [
    { to: "/admin/drives/new", label: "Create Drive", desc: "Post a new placement drive." },
    { to: "/admin/announcements", label: "Post Announcement", desc: "Publish an announcement." },
    { to: "/admin/applications", label: "View Applications", desc: "Review student applications." },
    { to: "/admin/companies", label: "Manage Companies", desc: "Add or edit companies." },
  ];

  return (
    <div>
      <PageHeader title="Placement Cell Dashboard" subtitle="Overview of placement activities and statistics." />

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
            <div className="card p-5">
              <p className="text-sm text-slate-500">Companies Registered</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{stats.totalCompanies ?? "—"}</p>
            </div>
            <div className="card p-5">
              <p className="text-sm text-slate-500">Active Drives</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{stats.activeDrives ?? "—"}</p>
            </div>
            <div className="card p-5">
              <p className="text-sm text-slate-500">Upcoming Deadlines</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{stats.upcomingDeadlines ?? "—"}</p>
            </div>
            <div className="card p-5">
              <p className="text-sm text-slate-500">Total Students</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{stats.totalStudents ?? "—"}</p>
            </div>
            <div className="card p-5">
              <p className="text-sm text-slate-500">Applications Submitted</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{stats.totalApplications ?? "—"}</p>
            </div>
            <div className="card p-5">
              <p className="text-sm text-slate-500">Students Selected</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{stats.totalSelected ?? "—"}</p>
            </div>
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

          <section className="mb-8">
            <h2 className="mb-3 text-base font-semibold text-slate-900">Recent Drives</h2>
            <div className="space-y-2">
              {data?.recentDrives?.map((d) => (
                <Link key={d._id} to={`/admin/drives/${d._id}/edit`} className="card p-4 flex items-center justify-between hover:shadow-md transition">
                  <div>
                    <h3 className="font-medium text-slate-900">{d.jobTitle}</h3>
                    <p className="text-sm text-slate-500">{d.company?.name || "—"}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                    d.status === "published" ? "bg-green-100 text-green-700" :
                    d.status === "draft" ? "bg-slate-100 text-slate-600" :
                    d.status === "closed" ? "bg-amber-100 text-amber-700" :
                    "bg-red-100 text-red-700"
                  }`}>{d.status}</span>
                </Link>
              )) || <p className="text-sm text-slate-500">No drives yet.</p>}
            </div>
          </section>

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
