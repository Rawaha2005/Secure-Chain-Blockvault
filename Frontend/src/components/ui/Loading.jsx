import { FaShieldAlt } from "react-icons/fa";

export function LoadingSpinner({ text = "Loading Data...", size = "md" }) {
  const sizes = {
    sm: "w-6 h-6 border-2",
    md: "w-10 h-10 border-3",
    lg: "w-16 h-16 border-4",
  };

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="relative flex items-center justify-center mb-4">
        <div
          className={`${sizes[size] || sizes.md} border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin`}
        ></div>
        <FaShieldAlt className="absolute text-cyan-400 text-sm" />
      </div>
      {text && (
        <p className="text-xs font-mono text-cyan-400/80 uppercase tracking-widest animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="w-full space-y-3 p-4">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div
          key={rIdx}
          className="flex items-center gap-4 py-3 border-b border-slate-800/40 animate-pulse"
        >
          {Array.from({ length: cols }).map((_, cIdx) => (
            <div
              key={cIdx}
              className="h-4 bg-slate-800/70 rounded"
              style={{ width: `${Math.max(20, 100 / cols - 5)}%` }}
            ></div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="glass-card p-6 border-slate-800/80 animate-pulse">
      <div className="h-4 w-28 bg-slate-800 rounded mb-4"></div>
      <div className="h-8 w-20 bg-slate-700 rounded mb-3"></div>
      <div className="h-3 w-40 bg-slate-800 rounded"></div>
    </div>
  );
}

export default LoadingSpinner;
