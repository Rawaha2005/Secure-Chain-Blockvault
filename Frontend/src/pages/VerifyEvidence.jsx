import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import PageHeader from "../components/ui/PageHeader";
import GlassCard from "../components/common/GlassCard";
import {
  FaCheckCircle, FaTimesCircle, FaShieldAlt, FaFileAlt,
  FaCubes, FaCopy, FaCheck, FaSearch, FaHistory, FaQrcode,
  FaKeyboard, FaSpinner
} from "react-icons/fa";
import { useNavigate as useNav } from "react-router-dom";
import toast from "react-hot-toast";

const MODES = ["FILE HASH", "VERIFICATION ID"];

function VerifyEvidence() {
  const navigate = useNavigate();
  const { verification_id: routeVid } = useParams();
  const fileInputRef = useRef(null);

  const [mode, setMode] = useState("FILE HASH");
  const [selectedFile, setSelectedFile] = useState(null);
  const [verifyId, setVerifyId] = useState(routeVid || "");
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [errorState, setErrorState] = useState(null);
  const [copiedHash, setCopiedHash] = useState(false);

  // Auto-verify if routeVid provided (from QR redirect)
  useEffect(() => {
    if (routeVid && routeVid.trim()) {
      setMode("VERIFICATION ID");
      setVerifyId(routeVid);
      handleVerifyById(routeVid);
    }
  }, [routeVid]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) { setSelectedFile(file); setResult(null); setErrorState(null); }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) { setSelectedFile(file); setResult(null); setErrorState(null); }
  };

  const handleVerifyFile = async (e) => {
    e.preventDefault();
    if (!selectedFile) { toast.error("Please select a file to verify."); return; }
    const formData = new FormData();
    formData.append("file", selectedFile);
    try {
      setVerifying(true); setResult(null); setErrorState(null);
      const response = await api.post("/files/verify", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const data = response.data;
      setResult({
        status: data.status,
        verified: data.verified,
        filename: data.evidence_details?.original_filename || selectedFile.name,
        hash: data.calculated_hash,
        blockchain_block_index: data.evidence_details?.block_index,
        blockchain_block_hash: data.evidence_details?.block_hash,
        verification_id: data.evidence_details?.verification_id,
        uploaded_by: data.evidence_details?.uploaded_by,
        uploaded_at: data.evidence_details?.uploaded_at,
        database_match: data.database_match,
        blockchain_match: data.blockchain_match,
        chain_integrity: data.chain_integrity,
      });
      toast.success("Evidence verified authentic!");
    } catch (err) {
      setErrorState({ filename: selectedFile.name, message: err.response?.data?.detail || "Hash mismatch or unregistered file." });
      toast.error("Verification failed — Hash mismatch or unregistered file.");
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyById = async (id) => {
    const vid = id || verifyId;
    if (!vid.trim()) { toast.error("Please enter a Verification ID."); return; }
    try {
      setVerifying(true); setResult(null); setErrorState(null);
      const response = await api.get(`/verify/${vid.trim()}`);
      const data = response.data;
      setResult({
        status: data.verification_status,
        verified: data.integrity_verdict,
        filename: data.filename,
        hash: data.file_hash,
        blockchain_block_index: data.blockchain?.block_index,
        blockchain_block_hash: data.blockchain?.block_hash,
        verification_id: data.verification_id,
        uploaded_by: data.owner_username,
        uploaded_at: data.uploaded_at,
        case_number: data.case_number,
        database_match: true,
        blockchain_match: data.blockchain?.block_index != null,
        chain_integrity: data.blockchain?.chain_valid,
        security_scan: data.security_scan,
        qr_url: data.verification_url,
      });
      toast.success("Evidence record located and verified!");
    } catch (err) {
      const detail = err.response?.data;
      setErrorState({
        filename: vid,
        message: typeof detail === "string" ? detail : detail?.message || "Verification ID not found in the SecureChain registry."
      });
      toast.error("Verification ID not found.");
    } finally {
      setVerifying(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null); setResult(null); setErrorState(null); setVerifyId("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isVerified = result?.verified === true;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <PageHeader
        title="Evidence Verification Lab"
        subtitle="Validate digital evidence authenticity via SHA-256 file hash comparison or QR/Verification ID lookup."
        breadcrumb="INTEGRITY LAB"
        badge="CRYPTOGRAPHIC PROOF"
      />

      {/* Mode Tabs */}
      <div className="flex gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
        {MODES.map(m => (
          <button key={m} onClick={() => { setMode(m); resetForm(); }}
            className={`flex-1 py-2.5 px-3 text-xs font-mono font-semibold rounded-lg uppercase tracking-wider transition-all ${
              mode === m ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "text-slate-400 hover:text-slate-200"
            }`}>
            {m === "FILE HASH" ? <><FaSearch className="inline mr-1.5" />File Hash Verify</> : <><FaQrcode className="inline mr-1.5" />QR / Verification ID</>}
          </button>
        ))}
      </div>

      {/* FILE HASH MODE */}
      {mode === "FILE HASH" && (
        <form onSubmit={handleVerifyFile} className="space-y-6">
          <div
            onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
              selectedFile ? "border-cyan-400 bg-cyan-500/5 shadow-[0_0_30px_rgba(0,229,255,0.15)]" : "border-slate-700 hover:border-cyan-500/50 bg-slate-900/40 hover:bg-slate-900/60"
            }`}>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            <div className="w-20 h-20 rounded-3xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center mx-auto mb-5 text-3xl">
              {selectedFile ? <FaFileAlt /> : <FaSearch />}
            </div>
            {selectedFile ? (
              <div className="space-y-2">
                <h4 className="text-lg font-bold text-white break-all">{selectedFile.name}</h4>
                <p className="text-xs font-mono text-slate-400">{(selectedFile.size / 1024).toFixed(2)} KB &nbsp;// Ready for cryptographic comparison</p>
              </div>
            ) : (
              <div className="space-y-2">
                <h4 className="text-lg font-bold text-white">Drop suspect evidence file here to <span className="text-purple-400">Verify</span></h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">Computes SHA-256 and matches against every block in the blockchain ledger.</p>
              </div>
            )}
          </div>
          <button type="submit" disabled={!selectedFile || verifying}
            className={`w-full cyber-btn py-4 text-base font-bold flex items-center justify-center gap-3 tracking-wider ${!selectedFile ? "opacity-50 cursor-not-allowed" : ""}`}>
            {verifying ? <FaSpinner className="animate-spin" /> : <FaShieldAlt />}
            {verifying ? "Computing Hash & Searching Blockchain Ledger..." : "Run Cryptographic Verification"}
          </button>
        </form>
      )}

      {/* QR / VERIFICATION ID MODE */}
      {mode === "VERIFICATION ID" && (
        <div className="space-y-6">
          <GlassCard className="p-6">
            <p className="text-xs font-mono text-slate-400 mb-3 flex items-center gap-1.5"><FaKeyboard className="text-cyan-400" /> Enter Verification ID (e.g. SC-EVD-000007)</p>
            <div className="flex gap-3">
              <input
                value={verifyId}
                onChange={e => { setVerifyId(e.target.value); setResult(null); setErrorState(null); }}
                onKeyDown={e => e.key === "Enter" && handleVerifyById()}
                placeholder="SC-EVD-000001"
                className="flex-1 bg-[#090e1a] border border-slate-700 rounded-xl px-4 py-3 text-sm font-mono text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
              />
              <button
                onClick={() => handleVerifyById()}
                disabled={!verifyId.trim() || verifying}
                className="cyber-btn px-6 py-3 text-sm font-bold flex items-center gap-2 disabled:opacity-50">
                {verifying ? <FaSpinner className="animate-spin" /> : <FaShieldAlt />}
                {verifying ? "Verifying..." : "Verify"}
              </button>
            </div>
            <p className="text-[11px] font-mono text-slate-500 mt-2">This is the unique identifier printed on QR evidence badges. Scan any QR code to auto-populate.</p>
          </GlassCard>
        </div>
      )}

      {/* VERIFIED RESULT */}
      {result && isVerified && (
        <GlassCard className="p-8 sm:p-10 border-emerald-500/50 relative overflow-hidden space-y-6">
          <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
          <div className="text-center space-y-2 border-b border-slate-800 pb-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto text-3xl shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <FaCheckCircle />
            </div>
            <h3 className="text-2xl font-extrabold text-white">AUTHENTIC &amp; UNTAMPERED</h3>
            <p className="text-xs font-mono text-emerald-400 uppercase tracking-widest">Cryptographic Verification Passed — Blockchain Anchored</p>
          </div>

          {/* Forensic Certificate */}
          <div className="space-y-3 font-mono text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {result.verification_id && <CertRow label="Verification ID" value={result.verification_id} valueClass="text-cyan-400 font-bold" />}
              {result.case_number && <CertRow label="Case Number" value={result.case_number} valueClass="text-slate-200" />}
              <CertRow label="Evidence File" value={result.filename} valueClass="text-white" />
              {result.uploaded_by && <CertRow label="Registered By" value={`@${result.uploaded_by}`} valueClass="text-slate-200" />}
              {result.uploaded_at && <CertRow label="Registered At" value={new Date(result.uploaded_at).toLocaleString()} valueClass="text-slate-300" />}
              <CertRow label="Block Index" value={result.blockchain_block_index != null ? `Block #${result.blockchain_block_index}` : "N/A"} valueClass="text-purple-400" />
              <CertRow label="Database Match" value={result.database_match ? "YES" : "NO"} valueClass={result.database_match ? "text-emerald-400" : "text-red-400"} />
              <CertRow label="Blockchain Match" value={result.blockchain_match ? "YES" : "NO"} valueClass={result.blockchain_match ? "text-emerald-400" : "text-red-400"} />
              <CertRow label="Chain Integrity" value={result.chain_integrity ? "VALID" : "ALERT"} valueClass={result.chain_integrity ? "text-emerald-400" : "text-red-400"} />
              {result.security_scan && <CertRow label="Security Scan" value={result.security_scan.status || "CLEAN"} valueClass="text-emerald-400" />}
            </div>

            {result.hash && (
              <div className="p-4 rounded-xl bg-black/60 border border-cyan-500/30">
                <div className="flex justify-between items-center mb-1 text-cyan-400">
                  <span>SHA-256 HASH DIGEST</span>
                  <button onClick={() => { navigator.clipboard.writeText(result.hash); setCopiedHash(true); setTimeout(() => setCopiedHash(false), 2000); }}
                    className="hover:text-cyan-300 flex items-center gap-1">
                    {copiedHash ? <FaCheck className="text-emerald-400" /> : <FaCopy />}
                    {copiedHash ? "Copied" : "Copy"}
                  </button>
                </div>
                <div className="text-slate-300 break-all select-all">{result.hash}</div>
              </div>
            )}

            {result.blockchain_block_hash && (
              <div className="p-4 rounded-xl bg-black/60 border border-emerald-500/30">
                <div className="text-emerald-400 mb-1">REGISTERED BLOCK HASH</div>
                <div className="text-slate-300 break-all">{result.blockchain_block_hash}</div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-800">
            {result.blockchain_block_index != null && (
              <button onClick={() => navigate("/blockchain")}
                className="py-3 px-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/20 transition flex items-center justify-center gap-2 font-mono">
                <FaCubes /> Inspect Block #{result.blockchain_block_index}
              </button>
            )}
            <button onClick={() => navigate("/custody")}
              className="py-3 px-4 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-semibold hover:bg-purple-500/20 transition flex items-center justify-center gap-2 font-mono">
              <FaHistory /> View Audit Log
            </button>
          </div>
        </GlassCard>
      )}

      {/* TAMPERED / NOT FOUND RESULT */}
      {(errorState || (result && !isVerified)) && (
        <GlassCard className="p-8 sm:p-10 border-rose-500/50 relative overflow-hidden space-y-6">
          <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-rose-500/15 blur-3xl pointer-events-none" />
          <div className="text-center space-y-2 border-b border-slate-800 pb-6">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto text-3xl shadow-[0_0_30px_rgba(244,63,94,0.3)]">
              <FaTimesCircle />
            </div>
            <h3 className="text-2xl font-extrabold text-white">VERIFICATION FAILED</h3>
            <p className="text-xs font-mono text-rose-400 uppercase tracking-widest">
              {result ? result.status : "POSSIBLE TAMPERING OR UNREGISTERED FILE"}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/80 border border-rose-500/30 text-xs font-mono space-y-2 text-slate-300">
            <p className="text-sm font-bold text-white mb-2">Diagnostic Summary:</p>
            <p className="text-slate-400">
              The evidence record <strong className="text-white">{errorState?.filename || result?.filename}</strong> could not be cryptographically matched in the SecureChain blockchain ledger.
            </p>
            <p className="text-rose-400 pt-2 font-semibold">* This evidence may have been altered, corrupted, or was never registered in this repository.</p>
            {errorState?.message && <p className="text-slate-500 pt-1">{typeof errorState.message === "string" ? errorState.message : JSON.stringify(errorState.message)}</p>}
          </div>
          <div className="pt-2 flex justify-center">
            <button onClick={resetForm}
              className="py-3 px-6 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition">
              Test Another Evidence File
            </button>
          </div>
        </GlassCard>
      )}
    </div>
  );
}

function CertRow({ label, value, valueClass = "text-white" }) {
  return (
    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
      <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`font-semibold text-sm ${valueClass} break-all`}>{value}</p>
    </div>
  );
}

export default VerifyEvidence;
