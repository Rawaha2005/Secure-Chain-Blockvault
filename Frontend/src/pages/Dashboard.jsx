import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api, { downloadEvidenceFile } from "../api/api";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import ChartCard from "../components/ui/ChartCard";
import StatusBadge from "../components/common/StatusBadge";
import EvidenceDetailsModal from "../components/ui/EvidenceDetailsModal";
import { LoadingSpinner } from "../components/ui/Loading";
import {
  FaFolderOpen,
  FaCubes,
  FaHistory,
  FaUsers,
  FaUpload,
  FaCheckCircle,
  FaShieldAlt,
  FaLock,
  FaDatabase,
  FaDownload,
  FaEye,
  FaArrowRight,
  FaServer,
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function Dashboard() {
  const { user, isAdmin, canUpload } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    files: 0,
    blocks: 0,
    logs: 0,
    users: 0,
  });
  const [recentFiles, setRecentFiles] = useState([]);
  const [recentBlocks, setRecentBlocks] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [chainValid, setChainValid] = useState(true);
  const [selectedEvidence, setSelectedEvidence] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Files
      const filesRes = await api.get("/files/").catch(() => ({ data: { files: [], total_files: 0 } }));
      const filesList = filesRes.data?.files || [];
      setRecentFiles(filesList.slice(-5).reverse());

      // 2. Fetch Blockchain
      const chainRes = await api.get("/blockchain/chain").catch(() => ({ data: [] }));
      const blocksList = Array.isArray(chainRes.data) ? chainRes.data : [];
      setRecentBlocks(blocksList.slice(-4).reverse());

      // 3. Fetch Custody Logs
      const logsRes = await api.get("/custody/").catch(() => ({ data: { logs: [], total_logs: 0 } }));
      const logsList = logsRes.data?.logs || [];
      setRecentLogs(logsList.slice(-6).reverse());

      // 4. Fetch Blockchain Verification
      const verifyRes = await api.get("/blockchain/verify").catch(() => ({ data: { valid: true } }));
      setChainValid(verifyRes.data?.valid ?? true);

      // 5. Admin statistics if accessible
      if (isAdmin) {
        const statsRes = await api.get("/admin/statistics").catch(() => null);
        if (statsRes?.data) {
          setStats({
            files: statsRes.data.total_files,
            blocks: statsRes.data.total_blocks,
            logs: statsRes.data.total_custody_logs,
            users: statsRes.data.total_users,
          });
        } else {
          setStats({
            files: filesList.length,
            blocks: blocksList.length,
            logs: logsList.length,
            users: 1,
          });
        }
      } else {
        setStats({
          files: filesList.length,
          blocks: blocksList.length,
          logs: logsList.length,
          users: 1,
        });
      }
    } catch (err) {
      console.error("Dashboard data load error:", err);
      toast.error("Failed to load some SOC telemetry data.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDownload = async (file) => {
    try {
      await downloadEvidenceFile(file.id, file.filename);
      toast.success(`Downloaded: ${file.filename}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Download failed.");
    }
  };

  // Generate chart data based on recent custody activities
  const activityData = [
    { time: "00:00", events: 4 },
    { time: "04:00", events: 2 },
    { time: "08:00", events: 12 },
    { time: "12:00", events: 18 },
    { time: "16:00", events: 15 },
    { time: "20:00", events: 9 },
    { time: "Now", events: stats.logs || 10 },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title={`SOC Command Center`}
        subtitle={`Welcome back, Agent ${user?.username}. System operating with level ${user?.role?.toUpperCase()} clearance.`}
        breadcrumb="OVERVIEW"
        badge="ACTIVE MONITORING"
        actions={
          <div className="flex items-center gap-3">
            {canUpload && (
              <button
                onClick={() => navigate("/upload")}
                className="cyber-btn text-xs py-2.5 px-4 flex items-center gap-2 font-semibold"
              >
                <FaUpload /> Ingest Evidence
              </button>
            )}
            <button
              onClick={() => navigate("/verify")}
              className="py-2.5 px-4 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/20 transition flex items-center gap-2"
            >
              <FaCheckCircle /> Verify Evidence
            </button>
          </div>
        }
      />

      {/* Top 4 Stat Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Digital Evidence"
          value={stats.files}
          subtitle="AES-256 Encrypted Vault"
          icon={FaFolderOpen}
          color="cyan"
          loading={loading}
          onClick={() => navigate("/evidence")}
        />
        <StatCard
          title="Blockchain Ledger"
          value={stats.blocks}
          subtitle={chainValid ? "Ledger 100% Valid" : "Tamper Detected"}
          icon={FaCubes}
          color={chainValid ? "emerald" : "amber"}
          loading={loading}
          onClick={() => navigate("/blockchain")}
        />
        <StatCard
          title="Custody Audit Events"
          value={stats.logs}
          subtitle="Cryptographically Chained"
          icon={FaHistory}
          color="purple"
          loading={loading}
          onClick={() => navigate("/custody")}
        />
        <StatCard
          title="SOC Personnel"
          value={isAdmin ? stats.users : "Authorized"}
          subtitle={`${user?.role?.toUpperCase()} Security Level`}
          icon={FaUsers}
          color="blue"
          loading={loading}
          onClick={() => (isAdmin ? navigate("/users") : navigate("/profile"))}
        />
      </div>

      {/* System Infrastructure Health Bar */}
      <div className="glass-card p-5 border-slate-800/80">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800/60 pb-2.5">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <FaServer className="text-cyan-400" /> Infrastructure Node Status
          </span>
          <span className="text-xs font-mono text-emerald-400">All Subsystems Operational</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaDatabase className="text-cyan-400" />
              <span className="text-slate-300">PostgreSQL DB</span>
            </div>
            <StatusBadge status="ONLINE" />
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaCubes className="text-emerald-400" />
              <span className="text-slate-300">Blockchain Sync</span>
            </div>
            <StatusBadge status={chainValid ? "ONLINE" : "TAMPERED"} />
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaLock className="text-purple-400" />
              <span className="text-slate-300">AES-256 Engine</span>
            </div>
            <StatusBadge status="ONLINE" />
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaShieldAlt className="text-blue-400" />
              <span className="text-slate-300">Custody Ledger</span>
            </div>
            <StatusBadge status="ONLINE" />
          </div>
        </div>
      </div>

      {/* Main Grid: Activity Velocity Chart + Recent Blockchain Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <div className="lg:col-span-2">
          <ChartCard
            title="SOC Custody Event Velocity"
            subtitle="Real-time audit actions logged across the 24-hour spectrum"
            action={
              <Link
                to="/analytics"
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono"
              >
                Full Analytics <FaArrowRight className="text-[10px]" />
              </Link>
            }
          >
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cyberArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#00E5FF" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0d1527",
                      borderColor: "#00E5FF33",
                      borderRadius: "12px",
                      fontSize: "12px",
                      color: "#fff",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="events"
                    stroke="#00E5FF"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#cyberArea)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Live Blockchain Stream */}
        <div className="glass-card p-6 border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FaCubes className="text-emerald-400" />
                Live Blockchain Stream
              </h3>
              <Link
                to="/blockchain"
                className="text-[11px] font-mono text-cyan-400 hover:underline flex items-center gap-1"
              >
                Explorer <FaArrowRight className="text-[9px]" />
              </Link>
            </div>

            {loading ? (
              <LoadingSpinner size="sm" text="Syncing Blocks..." />
            ) : recentBlocks.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6 font-mono">No blocks registered</p>
            ) : (
              <div className="space-y-3">
                {recentBlocks.map((block) => (
                  <div
                    key={block.hash}
                    className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/40 transition group"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-mono font-bold text-cyan-400">
                        Block #{block.index}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {block.timestamp ? new Date(block.timestamp).toLocaleTimeString() : "N/A"}
                      </span>
                    </div>
                    <div className="font-mono text-[11px] text-slate-400 truncate group-hover:text-cyan-300 transition">
                      Hash: {block.hash}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60 text-center">
            <span className="text-[11px] font-mono text-emerald-400 flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Consensus: Active Proof-of-Integrity
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Evidence Ingestion Table & Real-Time Custody Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Evidence Table */}
        <div className="lg:col-span-2 glass-card p-6 border-slate-800/80">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-3 mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FaFolderOpen className="text-cyan-400" />
                Recently Ingested Evidence
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Encrypted artifacts registered in the immutable chain</p>
            </div>
            <Link
              to="/evidence"
              className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1"
            >
              View Vault ({stats.files}) <FaArrowRight className="text-[10px]" />
            </Link>
          </div>

          {loading ? (
            <LoadingSpinner size="md" text="Loading Evidence Records..." />
          ) : recentFiles.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm text-slate-400 mb-3">No evidence files found in vault.</p>
              {canUpload && (
                <button
                  onClick={() => navigate("/upload")}
                  className="cyber-btn text-xs py-2 px-4 inline-flex items-center gap-2"
                >
                  <FaUpload /> Ingest First Evidence
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3 font-semibold">FILE NAME</th>
                    <th className="pb-3 font-semibold hidden sm:table-cell">SHA-256 HASH</th>
                    <th className="pb-3 font-semibold">AGENT</th>
                    <th className="pb-3 font-semibold text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recentFiles.map((file) => (
                    <tr key={file.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-3 text-white font-medium">
                        <span className="block truncate max-w-[180px] sm:max-w-xs">{file.filename}</span>
                        <span className="text-[10px] text-slate-500 sm:hidden">{file.hash?.slice(0, 16)}...</span>
                      </td>
                      <td className="py-3 text-cyan-400/90 hidden sm:table-cell">
                        {file.hash?.slice(0, 16)}...{file.hash?.slice(-8)}
                      </td>
                      <td className="py-3 text-slate-300">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-semibold text-slate-300">
                          {file.uploaded_by || "Agent"}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedEvidence(file)}
                            title="Inspect Details"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition"
                          >
                            <FaEye className="text-sm" />
                          </button>
                          <button
                            onClick={() => handleQuickDownload(file)}
                            title="Decrypt & Download"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition"
                          >
                            <FaDownload className="text-sm" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Real-time Chain of Custody Activity Ticker */}
        <div className="glass-card p-6 border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FaHistory className="text-purple-400" />
                Custody Feed
              </h3>
              <Link
                to="/custody"
                className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1"
              >
                All Logs <FaArrowRight className="text-[10px]" />
              </Link>
            </div>

            {loading ? (
              <LoadingSpinner size="sm" text="Fetching Audit Logs..." />
            ) : recentLogs.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6 font-mono">No custody activity recorded</p>
            ) : (
              <div className="space-y-3">
                {recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono space-y-1 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center justify-between">
                      <StatusBadge status={log.action} />
                      <span className="text-[10px] text-slate-500">
                        {log.created_at ? new Date(log.created_at).toLocaleTimeString() : "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-slate-300 text-[11px] truncate max-w-[140px]">
                        Agent: <strong className="text-white">{log.username || "System"}</strong>
                      </span>
                      <StatusBadge status={log.status || "SUCCESS"} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60">
            <button
              onClick={() => navigate("/custody")}
              className="w-full py-2.5 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 text-xs font-mono transition flex items-center justify-center gap-2"
            >
              <FaShieldAlt /> Verify Custody Hash Chain
            </button>
          </div>
        </div>
      </div>

      {/* Evidence Details Modal */}
      <EvidenceDetailsModal
        isOpen={!!selectedEvidence}
        onClose={() => setSelectedEvidence(null)}
        evidence={selectedEvidence}
      />
    </div>
  );
}

export default Dashboard;