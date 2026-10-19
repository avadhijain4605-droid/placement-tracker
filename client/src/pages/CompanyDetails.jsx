import { useParams, Link } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import Placeholder from "../components/Placeholder.jsx";

export default function CompanyDetails() {
  const { id } = useParams();
  return (
    <div>
      <PageHeader
        title={`Company: ${id || "Unknown"}`}
        subtitle="Eligibility, package, interview process, and insights."
        actions={<Link to="/companies" className="btn-secondary">← Back</Link>}
      />
      <Placeholder
        title="Company details coming soon"
        description="This page will show eligibility criteria, salary package, hiring process, asked questions, and reviews."
        icon="🏢"
      />
    </div>
  );
}
