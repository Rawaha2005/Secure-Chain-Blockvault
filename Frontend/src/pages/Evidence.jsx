import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api, { downloadEvidenceFile } from "../api/api";
import PageHeader from "../components/ui/PageHeader";
import SearchBar from "../components/ui/SearchBar";
import StatusBadge from "../components/common/StatusBadge";
import EvidenceDetailsModal from "../components/ui/EvidenceDetailsModal";
import { LoadingSpinner } from "../components/ui/Loading";
import {
  FaFolderOpen,
  FaUpload,
  FaDownload,
  FaEye,
  FaCopy,
  FaCheck,
  FaCheckCircle,
  FaHistory,
  FaLock,
  FaSync,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

function Evidence() {
  const { user, canUpload, canDownload } = useAuth();
  const navigate = useNavigate();

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    fetchEvidenceFiles();
  }, []);

  const fetchEvidenceFiles = async () => {
    setLoading(true);
    try {
      const res = await api.get("/files/");
      setFiles(res.data?.files || []);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to load evidence files.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyHash = (fileId, hash) => {
    navigator.clipboard.writeText(hash);
    setCopiedId(fileId);
    toast.success("Hash copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = async (file) => {
    try {
      setDownloadingId(file.id);
      await downloadEvidenceFile(file.id, file.filename);
      toast.success(`Downloaded & Decrypted: ${file.filename}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Download failed. Access restricted.");
    } finally {
      setDownloadingId(null);
    }
  };

  // Filter & Search logic
  const filteredFiles = files.filter((f) => {
    const matchesSearch =
      f.filename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.hash?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.uploaded_by?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === "mine") {
      return f.owner_id === user?.id || f.uploaded_by === user?.username;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Digital Evidence Vault"
        subtitle="Cryptographically sealed, AES-256 encrypted digital evidence records anchored in the blockchain ledger."
        breadcrumb="VAULT"
        badge={`${files.length} ARTIFACTS`}
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={fetchEvidenceFiles}
              className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/60 text-slate-300 hover:text-white transition"
              title="Refresh Vault"
            >
              <FaSync className={loading ? "animate-spin" : ""} />
            </button>
            {canUpload && (
              <button
                onClick={() => navigate("/upload")}
                className="cyber-btn text-xs py-2.5 px-4 flex items-center gap-2 font-bold"
              >
                <FaUpload /> Ingest Evidence
              </button>
            )}
          </div>
        }
      />

      {/* Search & Filter Toolbar */}
      <div className="glass-card p-4 border-slate-800/80">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by file name, SHA-256 hash, or uploading officer..."
          filterOptions={[
            { label: "All Evidence", value: "all" },
            { label: "My Ingestions", value: "mine" },
          ]}
          activeFilter={filter}
          onFilterChange={setFilter}
        />
      </div>

      {/* Main Evidence Table */}
      <div className="glass-card p-6 border-slate-800/80">
        {loading ? (
          <LoadingSpinner text="Querying Encrypted Evidence Vault..." />
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-4 text-2xl">
              <FaFolderOpen />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No Evidence Records Found</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
              {searchTerm
                ? "No evidence artifacts match your search query. Try searching for a different hash or name."
                : "The evidence repository is currently empty. Ingest digital artifacts to secure them in the blockchain."}
            </p>
            {canUpload && (
              <button
                onClick={() => navigate("/upload")}
                className="cyber-btn text-xs py-2.5 px-5 font-bold inline-flex items-center gap-2"
              >
                <FaUpload /> Ingest New Evidence
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">ID</th>
                  <th className="pb-3 font-semibold">EVIDENCE FILE</th>
                  <th className="pb-3 font-semibold hidden md:table-cell">SHA-256 HASH</th>
                  <th className="pb-3 font-semibold">OFFICER</th>
                  <th className="pb-3 font-semibold hidden lg:table-cell">TIMESTAMP</th>
                  <th className="pb-3 font-semibold">SECURITY</th>
                  <th className="pb-3 font-semibold text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredFiles.map((file) => {
                  const isOwner = user?.id === file.owner_id || user?.username === file.uploaded_by;
                  const allowDownload = canDownload || isOwner;

                  return (
                    <tr key={file.id} className="hover:bg-slate-900/50 transition">
                      <td className="py-4 text-cyan-400 font-bold">#{file.id}</td>
                      <td className="py-4 font-sans">
                        <div className="font-semibold text-white truncate max-w-[200px] sm:max-w-xs">
                          {file.filename}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 md:hidden truncate max-w-[200px]">
                          {file.hash}
                        </div>
                      </td>
                      <td className="py-4 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <span className="text-cyan-300/90 truncate max-w-[160px] lg:max-w-[240px]">
                            {file.hash}
                          </span>
                          <button
                            onClick={() => handleCopyHash(file.id, file.hash)}
                            className="text-slate-500 hover:text-cyan-400 transition"
                            title="Copy SHA-256 Hash"
                          >
                            {copiedId === file.id ? (
                              <FaCheck className="text-emerald-400" />
                            ) : (
                              <FaCopy />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="px-2.5 py-1 rounded-md bg-slate-800/80 text-slate-200 border border-slate-700 text-[11px] font-semibold">
                          {file.uploaded_by || "Agent"}
                        </span>
                      </td>
                      <td className="py-4 text-slate-400 hidden lg:table-cell">
                        {file.uploaded_at ? new Date(file.uploaded_at).toLocaleString() : "N/A"}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-1.5 text-emerald-400">
                          <FaLock className="text-xs" />
                          <span className="text-[11px] font-semibold">AES-256</span>
                        </div>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Inspect Details */}
                          <button
                            onClick={() => setSelectedEvidence(file)}
                            className="p-2 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition"
                            title="Inspect Evidence Dossier"
                          >
                            <FaEye className="text-sm" />
                          </button>

                          {/* Verify against Blockchain */}
                          <button
                            onClick={() => navigate("/verify")}
                            className="p-2 rounded-xl text-slate-400 hover:text-purple-400 hover:bg-slate-800 transition"
                            title="Verify Integrity in Lab"
                          >
                            <FaCheckCircle className="text-sm" />
                          </button>

                          {/* View Custody */}
                          <button
                            onClick={() => navigate(`/custody?fileId=${file.id}`)}
                            className="p-2 rounded-xl text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition"
                            title="View Chain of Custody"
                          >
                            <FaHistory className="text-sm" />
                          </button>

                          {/* Decrypt & Download */}
                          {allowDownload ? (
                            <button
                              onClick={() => handleDownload(file)}
                              disabled={downloadingId === file.id}
                              className="p-2 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition"
                              title="Decrypt & Download Artifact"
                            >
                              <FaDownload
                                className={`text-sm ${downloadingId === file.id ? "animate-bounce text-emerald-400" : ""}`}
                              />
                            </button>
                          ) : (
                            <span
                              className="p-2 text-slate-700 cursor-not-allowed"
                              title="Download requires ownership or Admin/Investigator clearance"
                            >
                              <FaDownload className="text-sm" />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      <EvidenceDetailsModal
        isOpen={!!selectedEvidence}
        onClose={() => setSelectedEvidence(null)}
        evidence={selectedEvidence}
      />
    </div>
  );
}

export default Evidence;
