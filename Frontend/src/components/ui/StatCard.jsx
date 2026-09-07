import { motion } from "framer-motion";

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "cyan",
  loading = false,
  onClick,
}) {
  const colorMap = {
    cyan: {
      border: "border-cyan-500/20 hover:border-cyan-400/50",
      glow: "hover:shadow-[0_0_25px_rgba(0,229,255,0.15)]",
      iconBg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
      text: "text-cyan-400",
    },
    emerald: {
      border: "border-emerald-500/20 hover:border-emerald-400/50",
      glow: "hover:shadow-[0_0_25px_rgba(16,185,129,0.15)]",
      iconBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      text: "text-emerald-400",
    },
    purple: {
      border: "border-purple-500/20 hover:border-purple-400/50",
      glow: "hover:shadow-[0_0_25px_rgba(168,85,247,0.15)]",
      iconBg: "bg-purple-500/10 text-purple-400 border-purple-500/30",
      text: "text-purple-400",
    },
    amber: {
      border: "border-amber-500/20 hover:border-amber-400/50",
      glow: "hover:shadow-[0_0_25px_rgba(245,158,11,0.15)]",
      iconBg: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      text: "text-amber-400",
    },
    blue: {
      border: "border-blue-500/20 hover:border-blue-400/50",
      glow: "hover:shadow-[0_0_25px_rgba(59,130,246,0.15)]",
      iconBg: "bg-blue-500/10 text-blue-400 border-blue-500/30",
      text: "text-blue-400",
    },
  };

  const currentTheme = colorMap[color] || colorMap.cyan;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`glass-card p-6 relative overflow-hidden cursor-pointer ${currentTheme.border} ${currentTheme.glow}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-mono font-medium uppercase tracking-wider text-slate-400">
            {title}
          </p>
          <div className="mt-3 flex items-baseline gap-2">
            {loading ? (
              <div className="h-9 w-24 bg-slate-800 animate-pulse rounded"></div>
            ) : (
              <span className="text-3xl lg:text-4xl font-bold tracking-tight text-white font-mono">
                {value}
              </span>
            )}
            {trend && (
              <span className="text-xs font-mono text-emerald-400 font-semibold">
                {trend}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
              {subtitle}
            </p>
          )}
        </div>

        {Icon && (
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center border ${currentTheme.iconBg}`}
          >
            <Icon className="text-2xl" />
          </div>
        )}
      </div>

      {/* Decorative cyber corner accents */}
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-400/40"></div>
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-400/40"></div>
    </motion.div>
  );
}

export default StatCard;
