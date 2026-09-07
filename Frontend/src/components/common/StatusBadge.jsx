function StatusBadge({ status, type }) {
  const norm = (status || type || "").toString().toUpperCase();

  let styles = "bg-slate-800/80 text-slate-300 border-slate-700";

  if (["ONLINE", "SUCCESS", "VERIFIED", "VALID", "ACTIVE"].includes(norm)) {
    styles = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]";
  } else if (["OFFLINE", "FAILED", "TAMPERED", "INVALID", "DISABLED"].includes(norm)) {
    styles = "bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.2)]";
  } else if (["ACCESS_DENIED", "WARNING", "SUSPICIOUS"].includes(norm)) {
    styles = "bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]";
  } else if (["ADMIN"].includes(norm)) {
    styles = "bg-purple-500/10 text-purple-400 border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]";
  } else if (["INVESTIGATOR"].includes(norm)) {
    styles = "bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]";
  } else if (["OFFICER"].includes(norm)) {
    styles = "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.2)]";
  } else if (["AUDITOR"].includes(norm)) {
    styles = "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
  } else if (["UPLOAD", "UPLOAD_EVIDENCE"].includes(norm)) {
    styles = "bg-cyan-500/10 text-cyan-300 border-cyan-500/30";
  } else if (["DOWNLOAD", "DOWNLOAD_EVIDENCE"].includes(norm)) {
    styles = "bg-blue-500/10 text-blue-300 border-blue-500/30";
  } else if (["VERIFY", "VERIFY_EVIDENCE"].includes(norm)) {
    styles = "bg-purple-500/10 text-purple-300 border-purple-500/30";
  } else if (["LOGIN"].includes(norm)) {
    styles = "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
  } else if (["LOGOUT"].includes(norm)) {
    styles = "bg-slate-700/50 text-slate-300 border-slate-600";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium border ${styles} whitespace-nowrap`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80"></span>
      {status || type}
    </span>
  );
}

export default StatusBadge;