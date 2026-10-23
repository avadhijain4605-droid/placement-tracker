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

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/profile" element={<StudentProfile />} />
        <Route path="/companies" element={<Companies />} />
        <Route path="/companies/:id" element={<CompanyDetails />} />
        <Route path="/ai-plan" element={<AiPrepPlan />} />
        <Route path="/skill-gap" element={<SkillGapAnalysis />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
