import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";

export default function Login() {
  return (
    <div className="mx-auto max-w-md">
      <PageHeader title="Log in" subtitle="Welcome back. Sign in to continue." />
      <form className="card p-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" className="input" placeholder="you@college.edu" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" type="password" className="input" placeholder="••••••••" />
        </div>
        <button type="submit" className="btn-primary w-full">Log in</button>
        <p className="text-sm text-slate-500 text-center">
          New here?{" "}
          <Link to="/signup" className="text-brand-600 font-medium">Create an account</Link>
        </p>
      </form>
      <p className="mt-4 text-xs text-slate-400 text-center">Authentication will be wired up in a later step.</p>
    </div>
  );
}
