import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";

const sampleCompanies = [
  { id: "infosys", name: "Infosys", role: "Systems Engineer", location: "Pune" },
  { id: "tcs", name: "TCS", role: "Software Developer", location: "Mumbai" },
  { id: "wipro", name: "Wipro", role: "Project Engineer", location: "Bengaluru" },
];

export default function Companies() {
  return (
    <div>
      <PageHeader
        title="Companies"
        subtitle="Browse hiring companies, roles, and insights."
        actions={<button className="btn-primary">Add company</button>}
      />

      <div className="mb-4 flex flex-col sm:flex-row gap-2">
        <input className="input" placeholder="Search companies or roles…" />
        <select className="input sm:w-48" defaultValue="">
          <option value="">All locations</option>
          <option>Pune</option>
          <option>Mumbai</option>
          <option>Bengaluru</option>
        </select>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sampleCompanies.map((c) => (
          <Link
            key={c.id}
            to={`/companies/${c.id}`}
            className="card p-5 hover:shadow-md hover:border-brand-200 transition"
          >
            <h3 className="font-semibold text-slate-900">{c.name}</h3>
            <p className="text-sm text-slate-600">{c.role}</p>
            <p className="mt-2 text-xs text-slate-400">{c.location}</p>
          </Link>
        ))}
      </div>

      <p className="mt-6 text-xs text-slate-400">
        These are sample cards. The real company list will load from the backend in a later step.
      </p>
    </div>
  );
}
