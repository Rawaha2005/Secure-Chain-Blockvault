function ChartCard({ title, subtitle, action, children, className = "" }) {
  return (
    <div className={`glass-card p-6 border-slate-800/80 flex flex-col justify-between ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 border-b border-slate-800/60 pb-4">
        <div>
          <h3 className="text-base font-semibold text-white tracking-wide flex items-center gap-2">
            <span className="w-2 h-2 rounded-sm bg-cyan-400"></span>
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-1 font-mono">{subtitle}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="w-full flex-1 min-h-[260px]">{children}</div>
    </div>
  );
}

export default ChartCard;
