import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function AdminLogin() {
  const { login, student, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const isAdmin = student?.role === "admin" || student?.role === "super_admin";

  if (loading) {
    return <div className="mx-auto max-w-md text-center py-16 text-slate-500">Loading...</div>;
  }

  if (student && isAdmin) return <Navigate to="/admin/dashboard" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = await login(email.trim(), password);
      if (user.role === "admin" || user.role === "super_admin") {
        navigate("/admin/dashboard");
      } else {
        setError("This account does not have admin access.");
      }
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <PageHeader title="Admin Login" subtitle="Placement Cell administration access." />
      <form className="card p-6 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="label" htmlFor="email">Admin Email</label>
          <input id="email" type="email" className="input" placeholder="admin@college.edu" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" type="password" className="input" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? "Signing in..." : "Sign in to Admin Panel"}
        </button>
        <p className="text-sm text-slate-500 text-center">
          Are you a student?{" "}
          <Link to="/login" className="text-brand-600 font-medium">Student login</Link>
        </p>
      </form>
    </div>
  );
}
