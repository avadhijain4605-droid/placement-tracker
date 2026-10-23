import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import StudentProfile from "./pages/StudentProfile.jsx";
import Companies from "./pages/Companies.jsx";
import CompanyDetails from "./pages/CompanyDetails.jsx";
import AiPrepPlan from "./pages/AiPrepPlan.jsx";
import SkillGapAnalysis from "./pages/SkillGapAnalysis.jsx";
import NotFound from "./pages/NotFound.jsx";
import Opportunities from "./pages/Opportunities.jsx";
import DriveDetails from "./pages/DriveDetails.jsx";
import StudentApplications from "./pages/StudentApplications.jsx";
import Announcements from "./pages/Announcements.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminDrives from "./pages/AdminDrives.jsx";
import AdminDriveForm from "./pages/AdminDriveForm.jsx";
import AdminApplications from "./pages/AdminApplications.jsx";
import AdminAnnouncements from "./pages/AdminAnnouncements.jsx";
import AdminCompanies from "./pages/AdminCompanies.jsx";
import AdminExperiences from "./pages/AdminExperiences.jsx";
import AdminStudents from "./pages/AdminStudents.jsx";
import AdminAnalytics from "./pages/AdminAnalytics.jsx";
import AdminUsers from "./pages/AdminUsers.jsx";
import AdminAudit from "./pages/AdminAudit.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/profile" element={<StudentProfile />} />
        <Route path="/companies" element={<Companies />} />
        <Route path="/companies/:id" element={<CompanyDetails />} />
        <Route path="/ai-plan" element={<AiPrepPlan />} />
        <Route path="/skill-gap" element={<SkillGapAnalysis />} />
        <Route path="/opportunities" element={<Opportunities />} />
        <Route path="/drives/:id" element={<DriveDetails />} />
        <Route path="/applications" element={<StudentApplications />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/drives" element={<AdminDrives />} />
        <Route path="/admin/drives/new" element={<AdminDriveForm />} />
        <Route path="/admin/drives/:id/edit" element={<AdminDriveForm />} />
        <Route path="/admin/applications" element={<AdminApplications />} />
        <Route path="/admin/announcements" element={<AdminAnnouncements />} />
        <Route path="/admin/companies" element={<AdminCompanies />} />
        <Route path="/admin/experiences" element={<AdminExperiences />} />
        <Route path="/admin/students" element={<AdminStudents />} />
        <Route path="/admin/analytics" element={<AdminAnalytics />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/audit" element={<AdminAudit />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
