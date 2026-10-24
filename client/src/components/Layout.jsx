import { useState, useEffect } from "react";
import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// ── Icons (inline SVG, 20x20, stroke-based) ──────────────────────
const Icon = ({ name, className = "h-5 w-5" }) => {
  const icons = {
    dashboard: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
    profile: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
    briefcase: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
    chart: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
    gap: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />,
    ai: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />,
    bookmark: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />,
    megaphone: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.117a1 1 0 01-1.553.832L4.447 16.5H2a1 1 0 01-1-1v-5a1 1 0 011-1h2.447l5-3.5A1 1 0 0111 5.882zM15.5 8.5a5 5 0 010 7M18 5.5a9 9 0 010 13" />,
    applications: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />,
    building: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5" />,
    drive: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />,
    students: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />,
    experiences: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />,
    users: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />,
    audit: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
    logout: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />,
    menu: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />,
    close: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />,
    chevronLeft: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />,
    chevronRight: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />,
  };
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      {icons[name] || icons.dashboard}
    </svg>
  );
};

// ── Navigation config ────────────────────────────────────────────
const studentSections = [
  {
    label: "Overview",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: "dashboard" },
      { to: "/announcements", label: "Announcements", icon: "megaphone" },
    ],
  },
  {
    label: "Career",
    items: [
      { to: "/profile", label: "My Profile", icon: "profile" },
      { to: "/opportunities", label: "Opportunities", icon: "briefcase" },
      { to: "/applications", label: "My Applications", icon: "applications" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { to: "/companies", label: "Companies", icon: "building" },
      { to: "/skill-gap", label: "Skill Gap Analysis", icon: "gap" },
      { to: "/ai-plan", label: "AI Prep Plan", icon: "ai" },
    ],
  },
];

const adminSections = [
  {
    label: "Management",
    items: [
      { to: "/admin/dashboard", label: "Dashboard", icon: "dashboard" },
      { to: "/admin/companies", label: "Companies", icon: "building" },
      { to: "/admin/drives", label: "Drives", icon: "drive" },
      { to: "/admin/applications", label: "Applications", icon: "applications" },
    ],
  },
  {
    label: "Engagement",
    items: [
      { to: "/admin/students", label: "Students", icon: "students" },
      { to: "/admin/experiences", label: "Experiences", icon: "experiences" },
      { to: "/admin/announcements", label: "Announcements", icon: "megaphone" },
      { to: "/admin/analytics", label: "AI Analytics", icon: "chart" },
    ],
  },
];

const superAdminSections = [
  {
    label: "Administration",
    items: [
      { to: "/admin/users", label: "Users", icon: "users" },
      { to: "/admin/audit", label: "Audit Log", icon: "audit" },
    ],
  },
];

// ── Sidebar component ────────────────────────────────────────────
function Sidebar({ collapsed, sections, student, isSuperAdmin, isAdmin, onNavigate, onLogout }) {
  const allSections = [...sections, ...(isSuperAdmin ? superAdminSections : [])];

  return (
    <div className="flex h-full flex-col bg-slate-900 text-slate-300">
      {/* Logo / Brand */}
      <div className={`flex items-center gap-2 border-b border-slate-800 ${collapsed ? "px-3 py-3" : "px-4 py-3"}`}>
        <Link
          to={isAdmin ? "/admin/dashboard" : "/dashboard"}
          onClick={onNavigate}
          className="flex items-center gap-2 shrink-0"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white font-bold text-sm">
            PT
          </span>
          {!collapsed && (
            <span className="font-semibold text-white text-sm">
              {isAdmin ? "Placement Cell" : "Placement Tracker"}
            </span>
          )}
        </Link>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-6">
        {allSections.map((section, si) => (
          <div key={si}>
            {!collapsed && (
              <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {section.label}
              </p>
            )}
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg text-sm font-medium transition ${
                      collapsed ? "justify-center px-2 py-2" : "px-3 py-2"
                    } ${
                      isActive
                        ? "bg-brand-600 text-white"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`
                  }
                >
                  <Icon name={item.icon} className="h-5 w-5 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-slate-800 p-2">
        <div className={collapsed ? "px-0" : "px-2"}>
          {!collapsed && (
            <div className="mb-2 px-1">
              <p className="text-xs text-slate-400 truncate">{student?.name}</p>
              {isSuperAdmin && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-900 text-purple-200 mt-1 inline-block">Super Admin</span>}
              {isAdmin && !isSuperAdmin && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-900 text-amber-200 mt-1 inline-block">Admin</span>}
            </div>
          )}
          <button
            type="button"
            title={collapsed ? "Log out" : undefined}
            className={`flex items-center gap-3 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition ${collapsed ? "justify-center px-2 py-2 w-full" : "px-3 py-2 w-full text-left"}`}
            onClick={onLogout}
          >
            <Icon name="logout" className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Log out</span>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page titles for breadcrumb ───────────────────────────────────
const PAGE_TITLES = {
  "/dashboard": "Dashboard",
  "/announcements": "Announcements",
  "/profile": "My Profile",
  "/opportunities": "Opportunities",
  "/applications": "My Applications",
  "/companies": "Companies",
  "/skill-gap": "Skill Gap Analysis",
  "/ai-plan": "AI Prep Plan",
  "/admin/dashboard": "Admin Dashboard",
  "/admin/companies": "Manage Companies",
  "/admin/drives": "Manage Drives",
  "/admin/applications": "Manage Applications",
  "/admin/students": "Manage Students",
  "/admin/experiences": "Manage Experiences",
  "/admin/announcements": "Manage Announcements",
  "/admin/analytics": "AI Analytics",
  "/admin/users": "Manage Users",
  "/admin/audit": "Audit Log",
};

function getPageTitle(pathname) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith("/companies/")) return "Company Details";
  if (pathname.startsWith("/drives/")) return "Drive Details";
  if (pathname.startsWith("/admin/drives/new")) return "New Drive";
  if (pathname.startsWith("/admin/drives/") && pathname.endsWith("/edit")) return "Edit Drive";
  return "Placement Tracker";
}

// ── Main Layout ──────────────────────────────────────────────────
export default function Layout() {
  const { student, logout: authLogout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const isAdmin = student?.role === "admin" || student?.role === "super_admin";
  const isSuperAdmin = student?.role === "super_admin";

  // Auth pages (login/signup/admin-login) render without sidebar
  const isAuthPage =
    location.pathname === "/login" ||
    location.pathname === "/signup" ||
    location.pathname === "/admin/login";

  const sections = isAdmin ? adminSections : studentSections;

  // Close mobile drawer on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  async function handleLogout() {
    await authLogout();
    navigate("/login");
  }

  // Auth page layout — minimal, no sidebar
  if (isAuthPage || !student) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white font-bold">PT</span>
              <span className="font-semibold text-slate-900">Placement Tracker</span>
            </Link>
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-secondary">Log in</Link>
              <Link to="/signup" className="btn-primary">Sign up</Link>
            </div>
          </div>
        </header>
        <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </main>
      </div>
    );
  }

  const pageTitle = getPageTitle(location.pathname);

  return (
    <div className="min-h-screen flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — desktop (fixed) + mobile (drawer) */}
      <aside
        className={`
          fixed lg:sticky top-0 z-40 h-screen shrink-0 transition-all duration-300
          ${collapsed ? "lg:w-16" : "lg:w-64"} w-64
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <Sidebar
          collapsed={collapsed}
          sections={sections}
          student={student}
          isSuperAdmin={isSuperAdmin}
          isAdmin={isAdmin}
          onNavigate={() => setSidebarOpen(false)}
          onLogout={handleLogout}
        />
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Minimal top navbar */}
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-3">
              {/* Mobile menu button */}
              <button
                type="button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              >
                <Icon name={sidebarOpen ? "close" : "menu"} />
              </button>

              {/* Desktop collapse toggle */}
              <button
                type="button"
                onClick={() => setCollapsed(!collapsed)}
                className="hidden lg:flex p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <Icon name={collapsed ? "chevronRight" : "chevronLeft"} />
              </button>

              {/* Breadcrumb / page title */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400 hidden sm:inline">
                  {isAdmin ? "Admin" : "Student"}
                </span>
                <span className="text-slate-300 hidden sm:inline">/</span>
                <h1 className="text-sm font-semibold text-slate-900">{pageTitle}</h1>
              </div>
            </div>

            {/* User profile menu */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-brand-100 text-brand-700 text-sm font-semibold shrink-0">
                  {student?.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div className="hidden sm:block leading-tight">
                  <p className="text-sm font-medium text-slate-700">{student?.name}</p>
                  <p className="text-xs text-slate-400 capitalize">{student?.role?.replace("_", " ")}</p>
                </div>
              </div>
              <button
                type="button"
                className="hidden sm:inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
                onClick={handleLogout}
                title="Log out"
              >
                <Icon name="logout" className="h-4 w-4" />
                <span className="hidden md:inline">Log out</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 text-sm text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>AI-Powered Placement Tracker</span>
            <span className="text-xs text-slate-400">Final-year B.Tech project</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
