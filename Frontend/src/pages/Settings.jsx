import { useState } from "react";
import api from "../api/api";
import PageHeader from "../components/ui/PageHeader";
import GlassCard from "../components/common/GlassCard";
import StatusBadge from "../components/common/StatusBadge";
import {
  FaCog,
  FaServer,
  FaShieldAlt,
  FaKey,
  FaDatabase,
  FaBolt,
  FaCheckCircle,
  FaTimesCircle,
  FaSave,
  FaRedo,
} from "react-icons/fa";
import toast from "react-hot-toast";

function Settings() {
  const [apiUrl, setApiUrl] = useState(
    localStorage.getItem("soc_api_url") || "http://127.0.0.1:8000"
  );
  const [testing, setTesting] = useState(false);
  const [pingResult, setPingResult] = useState(null);

  const handleTestConnection = async () => {
    setTesting(true);
    setPingResult(null);
    try {
      const startTime = performance.now();
      const res = await api.get("/health");
      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);

      setPingResult({
        success: true,
        latency: `${latency}ms`,
        status: res.data?.status || "healthy",
      });
      toast.success(`Connected to Core SOC Backend (${latency}ms)`);
    } catch (err) {
      setPingResult({
        success: false,
        message: err.message || "Failed to reach backend server",
      });
      toast.error("Backend Server Unreachable");
    } finally {
      setTesting(false);
    }
  };

  const handleSaveApiUrl = (e) => {
    e.preventDefault();
    localStorage.setItem("soc_api_url", apiUrl);
    toast.success("API Endpoint configuration saved.");
  };

  const handleReset = () => {
    setApiUrl("http://127.0.0.1:8000");
    localStorage.removeItem("soc_api_url");
    toast.success("Reset to default API endpoint");
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <PageHeader
        title="SOC System & Engine Settings"
        subtitle="Configure backend connectivity, inspect cryptographic security parameters, and verify subsystem health."
        breadcrumb="SETTINGS"
        badge="NODE CONFIG"
      />

      {/* API Endpoint Configuration Card */}
      <GlassCard className="p-6 sm:p-8 border-slate-800/80 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <FaServer className="text-cyan-400" />
            Backend API Server Node
          </h3>
          <StatusBadge status="ACTIVE" />
        </div>

        <form onSubmit={handleSaveApiUrl} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-cyan-300 uppercase mb-2">
              FastAPI Server Base Endpoint URL
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="cyber-input font-mono text-sm flex-1"
                placeholder="http://127.0.0.1:8000"
                required
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="py-3 px-4 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 text-xs font-mono font-bold transition flex items-center gap-2"
                >
                  <FaBolt /> {testing ? "Pinging..." : "Test Connection"}
                </button>
                <button
                  type="submit"
                  className="cyber-btn py-3 px-5 text-xs font-bold flex items-center gap-2"
                >
                  <FaSave /> Save
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="p-3 rounded-xl border border-slate-700 bg-slate-800 text-slate-400 hover:text-white transition"
                  title="Reset to default"
                >
                  <FaRedo />
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Ping Result Banner */}
        {pingResult && (
          <div
            className={`p-4 rounded-xl border text-xs font-mono flex items-center justify-between ${
              pingResult.success
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-rose-500/10 border-rose-500/30 text-rose-300"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {pingResult.success ? (
                <FaCheckCircle className="text-base text-emerald-400" />
              ) : (
                <FaTimesCircle className="text-base text-rose-400" />
              )}
              <span>
                {pingResult.success
                  ? `Node Online: Status [${pingResult.status}], Response Latency: ${pingResult.latency}`
                  : `Connection Failed: ${pingResult.message}`}
              </span>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Cryptographic Architecture Card */}
      <GlassCard className="p-6 sm:p-8 border-slate-800/80 space-y-5">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <FaShieldAlt className="text-purple-400" />
          Cryptographic Architecture Specifications
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-cyan-400 font-bold">
              <span>SHA-256 HASH ENGINE</span>
              <StatusBadge status="ACTIVE" />
            </div>
            <p className="text-slate-400 pt-1">
              Provides digital fingerprinting for evidence integrity checks and proof-of-work blockchain block header hashing.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-cyan-400 font-bold">
              <span>AES-256 ENCRYPTION</span>
              <StatusBadge status="ACTIVE" />
            </div>
            <p className="text-slate-400 pt-1">
              Zero-knowledge symmetrical encryption applied to digital evidence files at rest prior to disk storage.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-cyan-400 font-bold">
              <span>HS256 JWT PROTOCOL</span>
              <StatusBadge status="ACTIVE" />
            </div>
            <p className="text-slate-400 pt-1">
              Signed cryptographically validated stateless authentication tokens authorizing user roles and API requests.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-cyan-400 font-bold">
              <span>CUSTODY HASH CHAIN</span>
              <StatusBadge status="ACTIVE" />
            </div>
            <p className="text-slate-400 pt-1">
              Sequential cryptographic hash linking verifying the chronological immutability of the chain of custody audit trail.
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

export default Settings;
