import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaShieldAlt, FaExclamationTriangle } from "react-icons/fa";

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070B14] flex flex-col items-center justify-center text-cyan-400">
        <div className="relative flex items-center justify-center mb-4">
          <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin"></div>
          <FaShieldAlt className="absolute text-cyan-400 text-xl" />
        </div>
        <p className="text-sm font-mono tracking-widest text-slate-400 uppercase">
          Authenticating Security Credentials...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.map((r) => r.toLowerCase()).includes(user.role?.toLowerCase())) {
    return (
      <div className="min-h-screen bg-[#070B14] flex items-center justify-center p-6">
        <div className="glass-card max-w-md w-full p-8 text-center border-red-500/30">
          <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/30">
            <FaExclamationTriangle className="text-3xl" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-slate-400 text-sm mb-6">
            Your current security clearance level (<span className="text-cyan-400 uppercase font-semibold">{user.role}</span>) does not permit access to this sector.
          </p>
          <a
            href="/dashboard"
            className="cyber-btn inline-block text-center text-sm py-3 px-6 font-semibold"
          >
            Return to Command Center
          </a>
        </div>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;