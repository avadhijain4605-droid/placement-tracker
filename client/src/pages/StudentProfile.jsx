import PageHeader from "../components/PageHeader.jsx";
import Placeholder from "../components/Placeholder.jsx";

export default function StudentProfile() {
  return (
    <div>
      <PageHeader
        title="My Profile"
        subtitle="Your academic details, skills, resume, and target roles."
      />
      <Placeholder
        title="Profile coming soon"
        description="This page will let you enter your branch, CGPA, skills, projects, resume link, and target companies."
        icon="👤"
      />
    </div>
  );
}
