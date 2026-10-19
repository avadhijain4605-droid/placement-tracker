import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";

export default function Signup() {
  return (
    <div className="mx-auto max-w-md">
      <PageHeader title="Create your account" subtitle="Start preparing for placements today." />
      <form className="card p-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label className="label" htmlFor="name">Full name</label>
          <input id="name" type="text" className="input" placeholder="Your name" />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" className="input" placeholder="you@college.edu" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" type="password" className="input" placeholder="Choose a password" />
        </div>
        <button type="submit" className="btn-primary w-full">Create account</button>
        <p className="text-sm text-slate-500 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-brand-600 font-medium">Log in</Link>
        </p>
      </form>
      <p className="mt-4 text-xs text-slate-400 text-center">Authentication will be wired up in a later step.</p>
    </div>
  );
}
