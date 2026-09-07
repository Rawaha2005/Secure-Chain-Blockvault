import { useState, useEffect } from "react";
import Modal from "./Modal";
import StatusBadge from "../common/StatusBadge";
import {
  FaCopy, FaCheck, FaDownload, FaShieldAlt, FaFileAlt,
  FaUser, FaClock, FaHashtag, FaQrcode, FaExternalLinkAlt,
  FaPrint, FaCubes, FaLink
} from "react-icons/fa";
import { downloadEvidenceFile } from "../../api/api";
import api from "../../api/api";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const TABS = ["DOSSIER", "QR CODE", "BLOCKCHAIN"];

function EvidenceDetailsModal({ isOpen, onClose, evidence }) {
  const [activeTab, setActiveTab] = useState("DOSSIER");
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const { canDownload, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) { setActiveTab("DOSSIER"); setQrData(null); }
  }, [isOpen]);

  useEffect(() => {
    if (activeTab === "QR CODE" && evidence?.id && !qrData) {
      setQrLoading(true);
      api.get(`/files/${evidence.id}/qr`)
        .then(res => setQrData(res.data))
        .catch(() => toast.error("Failed to load QR code."))
        .finally(() => setQrLoading(false));
    }
  }, [activeTab, evidence?.id, qrData]);

  if (!evidence) return null;

  const handleCopyHash = () => {
    navigator.clipboard.writeText(evidence.hash);
    setCopied(true);
    toast.success("SHA-256 Hash copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await downloadEvidenceFile(evidence.id, evidence.filename);
      toast.success(`Downloaded and decrypted: ${evidence.filename}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to download evidence.");
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadQR = () => {
    if (!qrData?.qr_code_base64) return;
    const link = document.createElement("a");
    link.href = qrData.qr_code_base64;
    link.download = `QR-${qrData.verification_id || evidence.id}.png`;
    link.click();
    toast.success("QR Code downloaded as PNG");
  };

  const handleCopyVerifyLink = () => {
    const url = `${window.location.origin}/verify/${evidence.verification_id || qrData?.verification_id}`;
    navigator.clipboard.writeText(url);
    toast.success("Verification URL copied!");
  };

  const handlePrintQR = () => {
    const verId = qrData?.verification_id || evidence.verification_id;
    const w = window.open("", "_blank");
    w.document.write(`<html><head><title>SecureChain QR - ${evidence.filename}</title>
      <style>body{font-family:monospace;text-align:center;padding:40px;background:#fff}
      .badge{border:2px solid #000;padding:20px;display:inline-block;border-radius:12px}
      h2{font-size:18px}p{font-size:11px;color:#333}img{width:220px;height:220px}</style></head><body>
      <div class="badge"><h2>SecureChain Digital Evidence</h2>
      <img src="${qrData?.qr_code_base64}" />
      <p><b>Verification ID:</b> ${verId}</p>
      <p><b>File:</b> ${evidence.filename}</p>
      <p><b>SHA-256:</b> ${evidence.hash?.slice(0,20)}...</p>
      <p><b>Case #:</b> ${evidence.case_number || "CASE-001"}</p>
      </div></body></html>`);
    w.document.close();
    w.print();
  };

  const isOwner = user?.id === evidence.owner_id || user?.username === evidence.uploaded_by;
  const userCanDownload = canDownload || isOwner;
  const scanStatus = evidence.scan_status || "CLEAN";
  const verificationId = evidence.verification_id || (evidence.id ? `SC-EVD-${String(evidence.id).padStart(6, "0")}` : null);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Evidence Artifact Dossier"
      subtitle={`${verificationId || `EVIDENCE-ID: #${evidence.id}`} // SECURE REPOSITORY`}
    >
      <div className="space-y-4">
        {/* Header Banner */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center justify-center text-xl">
              <FaFileAlt />
            </div>
            <div>
              <h4 className="text-base font-bold text-white break-all">{evidence.filename}</h4>
              <p className="text-xs font-mono text-slate-400">
                {verificationId} &middot; Case: {evidence.case_number || "CASE-001"}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <StatusBadge status="VERIFIED" />
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
              scanStatus === "CLEAN"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-red-500/10 text-red-400 border-red-500/30"
            }`}>
              {scanStatus === "CLEAN" ? "🛡️ CLEAN" : "⚠️ " + scanStatus}
            </span>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-3 text-xs font-mono font-semibold rounded-lg uppercase tracking-wider transition-all ${
                activeTab === tab
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* === DOSSIER TAB === */}
        {activeTab === "DOSSIER" && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#090e1a] border border-cyan-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FaHashtag /> SHA-256 Evidence Hash
                </span>
                <button onClick={handleCopyHash} className="text-xs flex items-center gap-1 text-slate-400 hover:text-cyan-400 transition font-mono">
                  {copied ? <FaCheck className="text-emerald-400" /> : <FaCopy />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <div className="p-3 bg-black/60 rounded-lg border border-slate-800 font-mono text-xs text-cyan-300 break-all select-all">
                {evidence.hash}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <MetaCell icon={<FaUser />} label="Ingested By" value={evidence.uploaded_by || evidence.owner_username || "Unknown"} />
              <MetaCell icon={<FaClock />} label="Ingestion Timestamp" value={evidence.uploaded_at ? new Date(evidence.uploaded_at).toLocaleString() : "N/A"} mono />
              <MetaCell icon={<FaShieldAlt />} label="Storage Security" value="AES-256 Encrypted at Rest" valueClass="text-emerald-400" />
              <MetaCell icon={<FaHashtag />} label="Blockchain Ledger" value="Immutable Block Recorded" valueClass="text-cyan-400" />
              {evidence.description && (
                <div className="sm:col-span-2 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-xs font-mono text-slate-400 block mb-1">Case Description</span>
                  <p className="text-sm text-slate-200">{evidence.description}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* === QR CODE TAB === */}
        {activeTab === "QR CODE" && (
          <div className="space-y-4 flex flex-col items-center">
            {qrLoading ? (
              <div className="w-56 h-56 bg-slate-900/60 rounded-xl border border-slate-700 flex items-center justify-center">
                <div className="text-cyan-400 text-xs font-mono animate-pulse">Generating forensic QR...</div>
              </div>
            ) : qrData?.qr_code_base64 ? (
              <div className="p-4 bg-white rounded-2xl border-4 border-cyan-500/40 shadow-[0_0_30px_rgba(0,229,255,0.2)]">
                <img src={qrData.qr_code_base64} alt="Evidence QR Code" className="w-52 h-52 object-contain" />
              </div>
            ) : (
              <div className="w-56 h-56 bg-slate-900/60 rounded-xl border border-yellow-500/30 flex items-center justify-center text-yellow-400 text-xs font-mono text-center p-4">
                QR Code unavailable. Use verify page to generate.
              </div>
            )}
            <div className="w-full space-y-2">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                <p className="text-xs font-mono text-slate-400 mb-0.5">Verification Identifier</p>
                <p className="text-base font-bold text-cyan-300 font-mono">{qrData?.verification_id || verificationId}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <p className="text-xs font-mono text-slate-400 mb-1">Public Verification URL</p>
                <p className="text-xs font-mono text-slate-300 break-all">
                  {window.location.origin}/verify/{qrData?.verification_id || verificationId}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 w-full">
              <button onClick={handleDownloadQR} disabled={!qrData}
                className="py-2.5 px-2 rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[11px] font-mono hover:bg-cyan-500/20 transition flex items-center justify-center gap-1 disabled:opacity-40">
                <FaDownload /> PNG
              </button>
              <button onClick={handleCopyVerifyLink}
                className="py-2.5 px-2 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 text-[11px] font-mono hover:bg-slate-700 transition flex items-center justify-center gap-1">
                <FaLink /> Copy Link
              </button>
              <button onClick={handlePrintQR} disabled={!qrData}
                className="py-2.5 px-2 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 text-[11px] font-mono hover:bg-slate-700 transition flex items-center justify-center gap-1 disabled:opacity-40">
                <FaPrint /> Print
              </button>
            </div>
            <button
              onClick={() => { onClose(); navigate(`/verify/${qrData?.verification_id || verificationId}`); }}
              className="w-full py-2.5 px-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-mono hover:bg-emerald-500/20 transition flex items-center justify-center gap-2">
              <FaExternalLinkAlt /> Open Verification Certificate
            </button>
          </div>
        )}

        {/* === BLOCKCHAIN TAB === */}
        {activeTab === "BLOCKCHAIN" && (
          <div className="space-y-3">
            {evidence.blockchain?.block_index != null ? (
              <>
                <MetaCell icon={<FaCubes />} label="Block Index" value={`Block #${evidence.blockchain.block_index}`} valueClass="text-purple-400" mono />
                <div className="p-4 rounded-xl bg-[#090e1a] border border-purple-500/20">
                  <p className="text-xs font-mono text-slate-400 mb-2">Block Hash (SHA-256 Proof)</p>
                  <p className="font-mono text-xs text-purple-300 break-all">{evidence.blockchain.block_hash}</p>
                </div>
                <div className="p-4 rounded-xl bg-[#090e1a] border border-slate-700">
                  <p className="text-xs font-mono text-slate-400 mb-2">Previous Block Hash</p>
                  <p className="font-mono text-xs text-slate-400 break-all">{evidence.blockchain.previous_hash}</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center">
                  <p className="text-emerald-400 text-sm font-semibold">Evidence Anchored to Immutable Blockchain</p>
                  <p className="text-xs font-mono text-slate-400 mt-1">Cryptographic hash-linkage verified.</p>
                </div>
              </>
            ) : (
              <div className="p-6 text-center">
                <p className="text-yellow-400 text-sm font-mono">Block data requires full evidence details fetch.</p>
              </div>
            )}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-3 pt-3 border-t border-slate-800/80">
          <button
            onClick={() => { onClose(); navigate(`/custody?fileId=${evidence.id}`); }}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-700 bg-slate-800/60 text-slate-200 text-sm font-medium hover:bg-slate-700 transition flex items-center justify-center gap-2"
          >
            <FaClock /> View Custody Timeline
          </button>
          {userCanDownload ? (
            <button onClick={handleDownload} disabled={downloading}
              className="flex-1 cyber-btn text-sm py-3 px-4 flex items-center justify-center gap-2 font-semibold">
              <FaDownload />
              {downloading ? "Decrypting..." : "Decrypt & Download"}
            </button>
          ) : (
            <button disabled className="flex-1 py-3 px-4 rounded-xl border border-slate-800 bg-slate-900 text-slate-500 text-sm font-medium cursor-not-allowed flex items-center justify-center gap-2">
              <FaDownload /> Download Restricted
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

function MetaCell({ icon, label, value, valueClass = "text-white", mono = false }) {
  return (
    <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
      <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5 mb-1">
        <span className="text-cyan-400">{icon}</span> {label}
      </span>
      <p className={`text-sm font-semibold ${valueClass} ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

export default EvidenceDetailsModal;
