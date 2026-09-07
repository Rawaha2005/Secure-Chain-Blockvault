import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/api";
import PageHeader from "../components/ui/PageHeader";
import SearchBar from "../components/ui/SearchBar";
import StatusBadge from "../components/common/StatusBadge";
import Modal from "../components/ui/Modal";
import { LoadingSpinner } from "../components/ui/Loading";
import {
  FaHistory,
  FaShieldAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaCopy,
  FaCheck,
  FaEye,
  FaUser,
  FaNetworkWired,
  FaGlobe,
  FaLock,
  FaSync,
  FaFileAlt,
} from "react-icons/fa";
import toast from "react-hot-toast";

function History() {
  const [searchParams] = useSearchParams();
  const fileIdParam = searchParams.get("fileId");

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [validatingChain, setValidatingChain] = useState(false);
  const [chainResult, setChainResult] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [copiedHash, setCopiedHash] = useState(null);

  useEffect(() => {
    fetchCustodyLogs();
  }, [fileIdParam]);

  const fetchCustodyLogs = async () => {
    setLoading(true);
    try {
      let res;
      if (fileIdParam) {
        res = await api.get(`/custody/file/${fileIdParam}`);
        setLogs(res.data?.events || []);
      } else {
        res = await api.get("/custody/");
        setLogs(res.data?.logs || []);
      }
    } catch (err) {
      toast.error("Failed to load chain of custody logs.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCustodyChain = async () => {
    setValidatingChain(true);
    try {
      const res = await api.get("/custody/verify-chain");
      setChainResult({
        ...res.data,
        timestamp: new Date().toLocaleTimeString(),
      });

      if (res.data?.chain_valid) {
        toast.success("Custody Chain Cryptographically Validated!");
      } else {
        toast.error(`Custody Chain Broken! Record #${res.data?.tampered_record} tampered.`);
      }
    } catch (err) {
      toast.error("Error executing custody verification.");
    } finally {
      setValidatingChain(false);
    }
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      log.username?.toLowerCase().includes(term) ||
      log.action?.toLowerCase().includes(term) ||
      log.filename?.toLowerCase().includes(term) ||
      log.ip_address?.toLowerCase().includes(term) ||
      log.record_hash?.toLowerCase().includes(term) ||
      log.evidence_hash?.toLowerCase().includes(term);

    if (!matchesSearch) return false;

    if (actionFilter === "all") return true;
    if (actionFilter === "upload") return log.action?.includes("UPLOAD");
    if (actionFilter === "download") return log.action?.includes("DOWNLOAD");
    if (actionFilter === "verify") return log.action?.includes("VERIFY");
    if (actionFilter === "auth") return log.action === "LOGIN" || log.action === "LOGOUT";
    if (actionFilter === "security") return log.status === "ACCESS_DENIED" || log.status === "FAILED";

    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        title="Chain of Custody Audit Ledger"
        subtitle={
          fileIdParam
            ? `Isolated audit timeline for Digital Evidence File #${fileIdParam}`
            : "Complete cryptographically chained immutable audit log of every forensic interaction."
        }
        breadcrumb="CUSTODY LEDGER"
        badge={`${logs.length} AUDIT RECORDS`}
        actions={
          <div className="flex items-center gap-3">
            {fileIdParam && (
              <button
                onClick={() => {
                  window.history.pushState({}, "", "/custody");
                  fetchCustodyLogs();
                }}
                className="py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800 text-xs font-mono text-slate-300 hover:text-white"
              >
                Clear File Filter
              </button>
            )}
            <button
              onClick={fetchCustodyLogs}
              className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/60 text-slate-300 hover:text-white transition"
              title="Refresh Audit Logs"
            >
              <FaSync className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={handleVerifyCustodyChain}
              disabled={validatingChain}
              className="cyber-btn text-xs py-2.5 px-4 flex items-center gap-2 font-bold"
            >
              <FaShieldAlt />
              {validatingChain ? "Verifying Hash Chain..." : "Verify Custody Chain"}
            </button>
          </div>
        }
      />

      {/* Custody Chain Integrity Result Alert */}
      {chainResult && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
            chainResult.chain_valid
              ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/40 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-3">
            {chainResult.chain_valid ? (
              <FaCheckCircle className="text-2xl text-emerald-400" />
            ) : (
              <FaExclamationTriangle className="text-2xl text-rose-400" />
            )}
            <div>
              <p className="text-sm font-bold font-mono">
                {chainResult.chain_valid
                  ? "CHAIN OF CUSTODY INTEGRITY: UNCOMPROMISED"
                  : `CUSTODY INTEGRITY VIOLATION DETECTED AT RECORD #${chainResult.tampered_record}`}
              </p>
              <p className="text-xs opacity-80 font-mono">
                {chainResult.message} Verified at {chainResult.timestamp}.
              </p>
            </div>
          </div>
          <StatusBadge status={chainResult.chain_valid ? "VALIDATED" : "TAMPERED"} />
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="glass-card p-4 border-slate-800/80">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by agent, action, IP, hash, or filename..."
          filterOptions={[
            { label: "All Logs", value: "all" },
            { label: "Uploads", value: "upload" },
            { label: "Downloads", value: "download" },
            { label: "Verifications", value: "verify" },
            { label: "Auth Sessions", value: "auth" },
            { label: "Security Alerts", value: "security" },
          ]}
          activeFilter={actionFilter}
          onFilterChange={setActionFilter}
        />
      </div>

      {/* Custody Logs Table */}
      <div className="glass-card p-6 border-slate-800/80">
        {loading ? (
          <LoadingSpinner text="Retrieving Immutable Custody Ledger..." />
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-4 text-2xl">
              <FaHistory />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No Custody Records Found</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              No audit records matched your active filter or search criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">ID</th>
                  <th className="pb-3 font-semibold">ACTION</th>
                  <th className="pb-3 font-semibold">AGENT / ROLE</th>
                  <th className="pb-3 font-semibold hidden md:table-cell">EVIDENCE / TARGET</th>
                  <th className="pb-3 font-semibold hidden lg:table-cell">NETWORK IP</th>
                  <th className="pb-3 font-semibold hidden xl:table-cell">RECORD HASH</th>
                  <th className="pb-3 font-semibold">STATUS</th>
                  <th className="pb-3 font-semibold text-right">INSPECT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/50 transition">
                    <td className="py-3.5 text-cyan-400 font-bold">#{log.id}</td>
                    <td className="py-3.5">
                      <StatusBadge status={log.action} />
                    </td>
                    <td className="py-3.5">
                      <div className="font-semibold text-white">{log.username || "System"}</div>
                      <div className="text-[10px] text-slate-400 capitalize">{log.role || "System"}</div>
                    </td>
                    <td className="py-3.5 hidden md:table-cell">
                      {log.filename ? (
                        <div>
                          <span className="text-slate-200 truncate block max-w-[180px]">
                            {log.filename}
                          </span>
                          {log.file_id && (
                            <span className="text-[10px] text-cyan-400 font-mono">
                              File ID: #{log.file_id}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="py-3.5 text-slate-400 hidden lg:table-cell">
                      {log.ip_address || "127.0.0.1"}
                    </td>
                    <td className="py-3.5 hidden xl:table-cell">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <span className="truncate max-w-[120px]">{log.record_hash || "GENESIS"}</span>
                        {log.record_hash && (
                          <button
                            onClick={() => handleCopy(`hash-${log.id}`, log.record_hash)}
                            className="hover:text-cyan-400 transition"
                          >
                            {copiedHash === `hash-${log.id}` ? (
                              <FaCheck className="text-emerald-400" />
                            ) : (
                              <FaCopy />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5">
                      <StatusBadge status={log.status || "SUCCESS"} />
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition"
                        title="View Full Audit Payload"
                      >
                        <FaEye className="text-sm" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Custody Event Detail Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Chain of Custody Event Audit"
        subtitle={`AUDIT-LOG: #${selectedLog?.id} // IMMUTABLE RECORD`}
      >
        {selectedLog && (
          <div className="space-y-5 font-mono text-xs">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase">ACTION TYPE</span>
                <h4 className="text-base font-bold text-white">{selectedLog.action}</h4>
              </div>
              <StatusBadge status={selectedLog.status || "SUCCESS"} />
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-500 block mb-1">AGENT IDENTITY</span>
                <span className="text-white font-semibold">{selectedLog.username}</span> ({selectedLog.role})
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-500 block mb-1">EVENT TIMESTAMP</span>
                <span className="text-white font-semibold">
                  {selectedLog.created_at ? new Date(selectedLog.created_at).toLocaleString() : "N/A"}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-500 block mb-1">NETWORK IP ADDRESS</span>
                <span className="text-cyan-400">{selectedLog.ip_address || "Unknown"}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-500 block mb-1">HTTP METHOD / ENDPOINT</span>
                <span className="text-slate-200">
                  {selectedLog.http_method} {selectedLog.endpoint || "N/A"}
                </span>
              </div>
            </div>

            {/* Reason / Context */}
            {selectedLog.reason && (
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-500 block mb-1">AUDIT JUSTIFICATION / REASON</span>
                <p className="text-slate-200">{selectedLog.reason}</p>
              </div>
            )}

            {/* Cryptographic Linkage Hashes */}
            <div className="p-4 rounded-xl bg-black/60 border border-purple-500/30 space-y-3">
              <div>
                <div className="flex justify-between items-center text-purple-400 mb-1">
                  <span>PREVIOUS RECORD HASH</span>
                </div>
                <div className="text-slate-400 break-all select-all font-mono">
                  {selectedLog.previous_record_hash || "GENESIS"}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <div className="flex justify-between items-center text-cyan-400 mb-1">
                  <span>IMMUTABLE RECORD HASH</span>
                  <button
                    onClick={() => handleCopy("modal-record-hash", selectedLog.record_hash)}
                    className="hover:text-cyan-300 flex items-center gap-1"
                  >
                    {copiedHash === "modal-record-hash" ? <FaCheck className="text-emerald-400" /> : <FaCopy />}
                    {copiedHash === "modal-record-hash" ? "Copied" : "Copy"}
                  </button>
                </div>
                <div className="text-cyan-300 break-all select-all font-mono font-bold">
                  {selectedLog.record_hash || "N/A"}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default History;
