import { Routes, Route, Navigate } from "react-router-dom";

// Layout & Protected Route
import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./routes/ProtectedRoute";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Evidence from "./pages/Evidence";
import UploadEvidence from "./pages/UploadEvidence";
import VerifyEvidence from "./pages/VerifyEvidence";
import Blockchain from "./pages/Blockchain";
import History from "./pages/History";
import Analytics from "./pages/Analytics";
import Users from "./pages/Users";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import AiInvestigator from "./pages/AiInvestigator";

function App() {
  return (
    <Routes>
      {/* Public Authentication Portal */}
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />

      {/* Protected SOC Dashboard Shell */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/evidence" element={<Evidence />} />

        {/* Evidence Ingestion (Admin, Investigator, Officer) */}
        <Route
          path="/upload"
          element={
            <ProtectedRoute allowedRoles={["admin", "investigator", "officer"]}>
              <UploadEvidence />
            </ProtectedRoute>
          }
        />

        {/* Verification Lab */}
        <Route path="/verify" element={<VerifyEvidence />} />
        <Route path="/verify/:verification_id" element={<VerifyEvidence />} />

        {/* Blockchain Explorer */}
        <Route path="/blockchain" element={<Blockchain />} />

        {/* Chain of Custody Audit Ledger */}
        <Route path="/custody" element={<History />} />

        {/* SOC Analytics */}
        <Route path="/analytics" element={<Analytics />} />

        {/* AI Forensic Investigator */}
        <Route path="/ai-investigator" element={<AiInvestigator />} />

        {/* Admin Personnel Management (Admin only) */}
        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Users />
            </ProtectedRoute>
          }
        />

        {/* User Identity & Clearance Profile */}
        <Route path="/profile" element={<Profile />} />

        {/* System Settings */}
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* Catch-all Wildcard Route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;