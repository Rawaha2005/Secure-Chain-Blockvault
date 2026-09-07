import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import api, { downloadEvidenceFile } from "../api/api";
import PageHeader from "../components/ui/PageHeader";
import GlassCard from "../components/common/GlassCard";
import StatusBadge from "../components/common/StatusBadge";
import {
  FaUpload,
  FaFileAlt,
  FaShieldAlt,
  FaCubes,
  FaCheckCircle,
  FaCopy,
  FaCheck,
  FaDownload,
  FaArrowRight,
  FaLock,
  FaFileSignature,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

function UploadEvidence() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [clientHash, setClientHash] = useState("");
  const [computingHash, setComputingHash] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedBlockHash, setCopiedBlockHash] = useState(false);
  const [caseNumber, setCaseNumber] = useState("CASE-001");
  const [description, setDescription] = useState("");

  // Client-side SHA-256 Hash computation using Web Crypto API
  const calculateClientHash = async (file) => {
    setComputingHash(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      setClientHash(hashHex);
    } catch (err) {
      console.warn("Client hash pre-calculation skipped:", err);
      setClientHash("");
    } finally {
      setComputingHash(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadResult(null);
      calculateClientHash(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadResult(null);
      calculateClientHash(file);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Please select a file to ingest.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("case_number", caseNumber || "CASE-001");
    formData.append("description", description || "");

    try {
      setUploading(true);
      setUploadStage(1);

      setTimeout(() => setUploadStage(2), 600);
      setTimeout(() => setUploadStage(3), 1200);

      const response = await api.post("/files/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setUploadStage(4);
      setUploadResult(response.data);
      toast.success("Evidence Ingested and Anchored to Blockchain!");
    } catch (err) {
      setUploadStage(0);
      toast.error(err.response?.data?.detail || "Evidence Ingestion failed.");
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setClientHash("");
    setUploadResult(null);
    setUploadStage(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <PageHeader
        title="Ingest Digital Evidence"
        subtitle="Upload forensic artifacts for cryptographic hashing, AES-256 zero-trust encryption, and blockchain ledger anchoring."
        breadcrumb="INGESTION"
        badge="ZERO TRUST PIPELINE"
      />

      {!uploadResult ? (
        <form onSubmit={handleUploadSubmit} className="space-y-6">
          {/* Drag & Drop Box */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
              selectedFile
                ? "border-cyan-400 bg-cyan-500/5 shadow-[0_0_30px_rgba(0,229,255,0.15)]"
                : "border-slate-700 hover:border-cyan-500/50 bg-slate-900/40 hover:bg-slate-900/60"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="w-20 h-20 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto mb-5 text-3xl shadow-[0_0_20px_rgba(0,229,255,0.2)]">
              {selectedFile ? <FaFileAlt /> : <FaUpload />}
            </div>

            {selectedFile ? (
              <div className="space-y-2">
                <h4 className="text-lg font-bold text-white break-all">
                  {selectedFile.name}
                </h4>
                <p className="text-xs font-mono text-slate-400">
                  {(selectedFile.size / 1024).toFixed(2)} KB // {selectedFile.type || "Binary Artifact"}
                </p>
                <span className="inline-block mt-2 text-xs font-mono text-cyan-400 hover:underline">
                  Click to replace selected file
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                <h4 className="text-lg font-bold text-white">
                  Drop evidence artifact here, or <span className="text-cyan-400">browse</span>
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Supports forensic disk images, packet captures (.pcap), log dumps, documents, and media files.
                </p>
              </div>
            )}
          </div>

          {/* Case Metadata Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1.5">Case Number</label>
              <input
                type="text"
                value={caseNumber}
                onChange={e => setCaseNumber(e.target.value)}
                placeholder="e.g. CASE-001"
                className="w-full bg-[#090e1a] border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
              />
            </div>
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1.5">Description (Optional)</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Brief evidence description..."
                className="w-full bg-[#090e1a] border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
              />
            </div>
          </div>

          {/* Real-time Client-side Hash Calculation Preview */}
          {selectedFile && (
            <GlassCard className="p-6 border-cyan-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <FaFileSignature /> Pre-Ingestion SHA-256 Hash Preview
                </span>
                <StatusBadge status={computingHash ? "CALCULATING..." : "PRE-CALCULATED"} />
              </div>

              <div className="p-3.5 bg-black/60 rounded-xl border border-slate-800 font-mono text-xs text-cyan-300 break-all select-all">
                {computingHash ? (
                  <span className="text-slate-500 animate-pulse">Calculating cryptographic checksum...</span>
                ) : (
                  clientHash || "Calculated during upload pipeline"
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-[11px] font-mono text-slate-400">
                <div className="flex items-center gap-2">
                  <FaLock className="text-cyan-400" />
                  <span>1. AES-256 Encryption</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaCubes className="text-emerald-400" />
                  <span>2. Blockchain Block Creation</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaShieldAlt className="text-purple-400" />
                  <span>3. Custody Log Signing</span>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Ingestion Pipeline Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!selectedFile || uploading}
              className={`w-full cyber-btn py-4 text-base font-bold flex items-center justify-center gap-3 tracking-wider ${
                !selectedFile ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <FaUpload />
              {uploading ? "Ingesting & Securing Artifact..." : "Encrypt & Anchor to Blockchain"}
            </button>
          </div>
        </form>
      ) : (
        /* Ingestion Success Receipt Card */
        <GlassCard className="p-8 sm:p-10 border-emerald-500/40 relative overflow-hidden space-y-6">
          <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>

          {/* Header Banner */}
          <div className="text-center space-y-2 border-b border-slate-800 pb-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto text-3xl shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              <FaCheckCircle />
            </div>
            <h3 className="text-2xl font-bold text-white">Evidence Sealed Successfully</h3>
            <p className="text-xs font-mono text-emerald-400 uppercase tracking-widest">
              Anchored to Block #{uploadResult.block_index} // Blockchain Ledger
            </p>
          </div>

          {/* Receipt Details */}
          <div className="space-y-4 font-mono text-xs">
            {/* File Info */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>FILE NAME:</span>
                <span className="text-white font-semibold">{uploadResult.filename}</span>
              </div>
              {uploadResult.verification_id && (
                <div className="flex justify-between text-slate-400">
                  <span>VERIFICATION ID:</span>
                  <span className="text-cyan-400 font-bold">{uploadResult.verification_id}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400">
                <span>EVIDENCE ID:</span>
                <span className="text-cyan-400 font-bold">#{uploadResult.file_id}</span>
              </div>
              {uploadResult.case_number && (
                <div className="flex justify-between text-slate-400">
                  <span>CASE NUMBER:</span>
                  <span className="text-slate-200">{uploadResult.case_number}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400">
                <span>INGESTED BY:</span>
                <span className="text-slate-200">{uploadResult.uploaded_by}</span>
              </div>
              {uploadResult.security_scan && (
                <div className="flex justify-between text-slate-400">
                  <span>SECURITY SCAN:</span>
                  <span className="text-emerald-400 font-semibold">{uploadResult.security_scan.status || "CLEAN"}</span>
                </div>
              )}
            </div>

            {/* QR Preview if available */}
            {uploadResult.qr_code && (
              <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <p className="text-xs font-mono text-slate-400 uppercase">Evidence QR Code</p>
                <div className="p-3 bg-white rounded-xl">
                  <img src={uploadResult.qr_code} alt="QR Code" className="w-32 h-32" />
                </div>
                <p className="text-[10px] font-mono text-slate-500">Scan to verify evidence authenticity</p>
              </div>
            )}

            {/* Evidence Hash */}
            <div className="p-4 rounded-xl bg-black/60 border border-cyan-500/30">
              <div className="flex justify-between items-center mb-1 text-cyan-400">
                <span>SHA-256 EVIDENCE CHECKSUM</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(uploadResult.hash);
                    setCopiedHash(true);
                    setTimeout(() => setCopiedHash(false), 2000);
                  }}
                  className="hover:text-cyan-300 flex items-center gap-1"
                >
                  {copiedHash ? <FaCheck className="text-emerald-400" /> : <FaCopy />}
                  {copiedHash ? "Copied" : "Copy"}
                </button>
              </div>
              <div className="text-slate-300 break-all select-all font-mono">
                {uploadResult.hash}
              </div>
            </div>

            {/* Block Info */}
            <div className="p-4 rounded-xl bg-black/60 border border-emerald-500/30">
              <div className="flex justify-between items-center mb-1 text-emerald-400">
                <span>BLOCKCHAIN BLOCK HASH (BLOCK #{uploadResult.block_index})</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(uploadResult.block_hash);
                    setCopiedBlockHash(true);
                    setTimeout(() => setCopiedBlockHash(false), 2000);
                  }}
                  className="hover:text-emerald-300 flex items-center gap-1"
                >
                  {copiedBlockHash ? <FaCheck className="text-emerald-400" /> : <FaCopy />}
                  {copiedBlockHash ? "Copied" : "Copy"}
                </button>
              </div>
              <div className="text-slate-300 break-all select-all font-mono">
                {uploadResult.block_hash}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-800">
            <button
              onClick={resetForm}
              className="py-3 px-4 rounded-xl border border-slate-700 bg-slate-800/80 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition"
            >
              Ingest Another File
            </button>

            <button
              onClick={() => navigate("/blockchain")}
              className="py-3 px-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/20 transition flex items-center justify-center gap-2"
            >
              <FaCubes /> View in Blockchain
            </button>

            <button
              onClick={() => navigate("/evidence")}
              className="cyber-btn py-3 px-4 text-xs font-bold flex items-center justify-center gap-2"
            >
              Go to Evidence Vault <FaArrowRight />
            </button>
          </div>
        </GlassCard>
      )}
    </div>
  );
}

export default UploadEvidence;
