import { useState, useEffect } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api.js";

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
  { to: "/admin/dashboard", label: "Admin Dashboard" },
  { to: "/admin/drives", label: "Drives" },
  { to: "/admin/applications", label: "Applications" },
  { to: "/admin/announcements", label: "Announcements" },
  { to: "/admin/companies", label: "Companies" },
];

const superAdminNav = [
  { to: "/admin/users", label: "Users" },
  { to: "/admin/audit", label: "Audit Log" },
];

export default function Layout() {
  const { student, logout } = useAuth();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const isAdmin = student?.role === "admin" || student?.role === "super_admin";
  const isSuperAdmin = student?.role === "super_admin";

  const navItems = isAdmin
    ? [...adminNav, ...(isSuperAdmin ? superAdminNav : [])]
    : studentNav;

  useEffect(() => {
    if (student) {
      api.listNotifications().then((data) => {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }).catch(() => {});
    }
  }, [student]);

  async function handleMarkAllRead() {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <Link to={isAdmin ? "/admin/dashboard" : "/dashboard"} className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white font-bold">
              PT
            </span>
            <span className="font-semibold text-slate-900">Placement Tracker</span>
            {isAdmin && (
              <span className="ml-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                {isSuperAdmin ? "Super Admin" : "Admin"}
              </span>
            )}
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? "bg-brand-50 text-brand-700"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {student && !isAdmin && (
              <div className="relative">
                <button
                  type="button"
                  className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100"
                  onClick={() => setNotifOpen(!notifOpen)}
                >
                  <span className="text-lg">🔔</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg z-30">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                      <span className="text-sm font-semibold text-slate-900">Notifications</span>
                      {unreadCount > 0 && (
                        <button onClick={handleMarkAllRead} className="text-xs text-brand-600 hover:underline">
                          Mark all read
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <p className="px-4 py-6 text-sm text-slate-400 text-center">No notifications yet.</p>
                    ) : (
                      notifications.map((n) => (
                        <div key={n._id} className={`px-4 py-3 border-b border-slate-50 ${!n.read ? "bg-brand-50/40" : ""}`}>
                          <p className="text-sm font-medium text-slate-900">{n.title}</p>
                          <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
            {student ? (
              <>
                <span className="text-sm text-slate-600 hidden sm:inline">{student.name}</span>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={async () => {
                    await logout();
                    navigate("/login");
                  }}
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
