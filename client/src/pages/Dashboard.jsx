import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";

const stats = [
  { label: "Companies tracked", value: "—", hint: "Add companies to begin" },
  { label: "Applications", value: "0", hint: "Track your applied roles" },
  { label: "Prep progress", value: "0%", hint: "AI plan completion" },
  { label: "Upcoming events", value: "0", hint: "Deadlines & interviews" },
];

const quickLinks = [
  { to: "/profile", title: "Complete your profile", desc: "Add skills, resume, and target roles." },
  { to: "/companies", title: "Explore companies", desc: "Browse hiring companies and insights." },
  { to: "/ai-plan", title: "Generate an AI prep plan", desc: "Get a personalized preparation roadmap." },
];

export default function Dashboard() {
  return (
    <div>
      <PageHeader
        title="Placement Dashboard"
        subtitle="Your placement preparation at a glance."
      />

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="card p-5">
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="mt-1 text-xs text-slate-400">{s.hint}</p>
          </div>
        ))}
      </section>

      <section className="grid md:grid-cols-3 gap-4">
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
