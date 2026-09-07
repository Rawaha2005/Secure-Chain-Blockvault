import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";
import PageHeader from "../components/ui/PageHeader";
import GlassCard from "../components/common/GlassCard";
import StatusBadge from "../components/common/StatusBadge";
import {
  FaUserShield,
  FaShieldAlt,
  FaKey,
  FaCheck,
  FaTimes,
  FaClock,
  FaEnvelope,
  FaIdCard,
  FaSignOutAlt,
  FaLock,
} from "react-icons/fa";

function Profile() {
  const { user, role, logout } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get("/auth/me");
      setProfileData(res.data);
    } catch {
      setProfileData(user);
    } finally {
      setLoading(false);
    }
  };

  const permissions = [
    { label: "Upload Digital Evidence", granted: ["admin", "investigator", "officer"].includes(role) },
    { label: "Decrypt & Download Evidence Artifacts", granted: ["admin", "investigator"].includes(role) },
    { label: "Run Cryptographic Verification Lab", granted: ["admin", "investigator", "auditor", "officer"].includes(role) },
    { label: "Inspect Full Chain of Custody Ledger", granted: ["admin", "investigator", "auditor"].includes(role) },
    { label: "Manage Personnel & Modify RBAC Clearance", granted: role === "admin" },
    { label: "Validate Blockchain Ledger Integrity", granted: true },
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <PageHeader
        title="Agent Identity & Clearance Dossier"
        subtitle="Cryptographic session credentials and security authorization parameters."
        breadcrumb="IDENTITY"
        badge={role?.toUpperCase() || "AUTHORIZED"}
      />

      {/* Main Agent Profile Card */}
      <GlassCard className="p-8 sm:p-10 border-cyan-500/30 relative overflow-hidden space-y-6">
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 border-b border-slate-800 pb-6">
          <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-4xl shadow-[0_0_25px_rgba(0,229,255,0.2)]">
            <FaUserShield />
          </div>

          <div className="text-center sm:text-left flex-1 space-y-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 justify-center sm:justify-start">
              <h2 className="text-2xl font-bold text-white capitalize">
                {profileData?.username || user?.username}
              </h2>
              <StatusBadge status={role || "officer"} />
            </div>
            <p className="text-xs font-mono text-slate-400 flex items-center justify-center sm:justify-start gap-1.5 pt-1">
              <FaEnvelope className="text-cyan-400" /> {profileData?.email || user?.email || "internal@soc.system"}
            </p>
            <p className="text-xs font-mono text-slate-500 flex items-center justify-center sm:justify-start gap-1.5">
              <FaIdCard className="text-purple-400" /> Agent ID: #{profileData?.id || user?.id || 1}
            </p>
          </div>

          <button
            onClick={logout}
            className="py-2.5 px-4 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 text-xs font-mono transition flex items-center gap-2"
          >
            <FaSignOutAlt /> Terminate Session
          </button>
        </div>

        {/* Clearance Parameters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-500 block mb-1">CLEARANCE LEVEL</span>
            <span className="text-white font-bold text-sm uppercase">{role}</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-500 block mb-1">AUTHENTICATION PROTOCOL</span>
            <span className="text-cyan-400 font-bold text-sm">JWT / HS256</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-500 block mb-1">ENLISTED DATE</span>
            <span className="text-slate-300 font-bold text-sm">
              {profileData?.created_at ? new Date(profileData.created_at).toLocaleDateString() : "Active Operative"}
            </span>
          </div>
        </div>
      </GlassCard>

      {/* Permissions Matrix for Current User */}
      <GlassCard className="p-6 sm:p-8 border-slate-800/80 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <FaLock className="text-cyan-400" />
          Active Security Clearances & Capabilities
        </h3>
        <div className="space-y-3">
          {permissions.map((perm, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs font-mono"
            >
              <span className="text-slate-300 font-sans">{perm.label}</span>
              {perm.granted ? (
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <FaCheck /> AUTHORIZED
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-slate-500">
                  <FaTimes /> RESTRICTED
                </span>
              )}
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

export default Profile;
