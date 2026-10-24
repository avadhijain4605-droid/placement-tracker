import { useState, useEffect } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const studentNav = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/opportunities", label: "Opportunities" },
  { to: "/announcements", label: "Announcements" },
  { to: "/applications", label: "My Applications" },
  { to: "/profile", label: "My Profile" },
  { to: "/companies", label: "Companies" },
  { to: "/ai-plan", label: "AI Prep Plan" },
  { to: "/skill-gap", label: "Skill Gap" },
];

const adminNav = [
  { to: "/admin/dashboard", label: "Dashboard" },
  { to: "/admin/companies", label: "Companies" },
  { to: "/admin/drives", label: "Drives" },
  { to: "/admin/applications", label: "Applications" },
  { to: "/admin/experiences", label: "Experiences" },
  { to: "/admin/announcements", label: "Announcements" },
  { to: "/admin/students", label: "Students" },
  { to: "/admin/analytics", label: "AI Analytics" },
];

const superAdminNav = [
  { to: "/admin/users", label: "Users" },
  { to: "/admin/audit", label: "Audit Log" },
];

export default function Layout() {
  const { student, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = student?.role === "admin" || student?.role === "super_admin";
  const isSuperAdmin = student?.role === "super_admin";

  const navItems = isAdmin
    ? [...adminNav, ...(isSuperAdmin ? superAdminNav : [])]
    : studentNav;

  if (isAdmin) {
    return (
      <div className="min-h-screen flex flex-col lg:flex-row">
        {/* Sidebar for admin */}
        <aside className={`lg:w-64 lg:min-h-screen bg-slate-900 text-slate-300 flex-shrink-0 ${sidebarOpen ? "block" : "hidden"} lg:block`}>
          <div className="p-4">
            <Link to="/admin/dashboard" className="flex items-center gap-2 mb-6" onClick={() => setSidebarOpen(false)}>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white font-bold">PT</span>
              <span className="font-semibold text-white">Placement Cell</span>
            </Link>

            <nav className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-lg text-sm font-medium transition ${
                      isActive
                        ? "bg-brand-600 text-white"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="mt-6 pt-6 border-t border-slate-700">
              <p className="text-xs text-slate-500 mb-2">{student?.name}</p>
              {isSuperAdmin && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-900 text-purple-200">Super Admin</span>}
              {!isSuperAdmin && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-900 text-amber-200">Admin</span>}
              <button
                type="button"
                className="mt-3 block w-full text-left px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition"
                onClick={async () => { await logout(); navigate("/login"); }}
              >
                Log out
              </button>
            </div>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200 lg:hidden">
            <div className="flex h-14 items-center justify-between px-4">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg text-slate-600 hover:bg-slate-100">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <span className="font-semibold text-slate-900">Placement Cell</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{isSuperAdmin ? "Super" : "Admin"}</span>
            </div>
          </header>

          <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
            <Outlet />
          </main>

          <footer className="border-t border-slate-200 bg-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 text-sm text-slate-500">
              AI-Powered Placement Tracker — Admin Panel
            </div>
          </footer>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white font-bold">PT</span>
            <span className="font-semibold text-slate-900">Placement Tracker</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {student ? (
              <>
                <span className="text-sm text-slate-600 hidden sm:inline">{student.name}</span>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={async () => { await logout(); navigate("/login"); }}
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary">Log in</Link>
                <Link to="/signup" className="btn-primary">Sign up</Link>
              </>
            )}
          </div>
        </div>

        <nav className="md:hidden flex items-center gap-1 overflow-x-auto px-4 pb-2 border-t border-slate-100">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `whitespace-nowrap px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  isActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 text-sm text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AI-Powered Placement Tracker</span>
          <span>Final-year B.Tech project</span>
        </div>
      </footer>
    </div>
  );
}
