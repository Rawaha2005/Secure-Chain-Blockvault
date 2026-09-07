import { motion } from "framer-motion";

function PageHeader({ title, subtitle, badge, actions, breadcrumb }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-6"
    >
      <div>
        {breadcrumb && (
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400/80 mb-2 uppercase tracking-wider">
            <span>SECURECHAIN</span>
            <span>/</span>
            <span>{breadcrumb}</span>
          </div>
        )}
        <div className="flex items-center gap-3">
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            {title}
          </h1>
          {badge && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="mt-1.5 text-sm text-slate-400 max-w-2xl">{subtitle}</p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-3 flex-wrap">{actions}</div>
      )}
    </motion.div>
  );
}

export default PageHeader;
