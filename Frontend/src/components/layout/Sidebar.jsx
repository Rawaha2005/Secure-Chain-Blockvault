import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  FaShieldAlt,
  FaThLarge,
  FaFolderOpen,
  FaUpload,
  FaCheckCircle,
  FaCubes,
  FaHistory,
  FaChartLine,
  FaUsersCog,
  FaUserCircle,
  FaCog,
  FaTimes,
  FaLock,
  FaRobot,
} from "react-icons/fa";

function Sidebar({ isOpen, onClose }) {
  const { user, isAdmin, canUpload } = useAuth();

  const navItems = [
    {
      to: "/dashboard",
      label: "SOC Overview",
      icon: FaThLarge,
      badge: "LIVE",
    },
    {
      to: "/evidence",
      label: "Evidence Vault",
      icon: FaFolderOpen,
    },
    ...(canUpload
      ? [
          {
            to: "/upload",
            label: "Ingest Evidence",
            icon: FaUpload,
          },
        ]
      : []),
    {
      to: "/verify",
      label: "Verify Evidence",
      icon: FaCheckCircle,
    },
    {
      to: "/blockchain",
      label: "Blockchain Explorer",
      icon: FaCubes,
    },
    {
      to: "/custody",
      label: "Chain of Custody",
      icon: FaHistory,
    },
    {
      to: "/analytics",
      label: "SOC Analytics",
      icon: FaChartLine,
    },
    {
      to: "/ai-investigator",
      label: "AI Investigator",
      icon: FaRobot,
      badge: "AI",
    },
    ...(isAdmin
      ? [
          {
            to: "/users",
            label: "Personnel & RBAC",
            icon: FaUsersCog,
            badge: "ADMIN",
          },
        ]
      : []),
    {
      to: "/profile",
      label: "Security Profile",
      icon: FaUserCircle,
    },
    {
      to: "/settings",
      label: "System Settings",
      icon: FaCog,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#0a0f1d] border-r border-slate-800/90 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
          <NavLink to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] transition">
              <FaShieldAlt className="text-xl" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold text-white tracking-wider">
                  SECURE<span className="text-cyan-400">CHAIN</span>
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400 tracking-widest uppercase">
                Digital Evidence SOC
              </p>
            </div>
          </NavLink>

          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white p-1"
          >
            <FaTimes />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
          <p className="px-3 py-1.5 text-[10px] font-mono font-semibold uppercase text-slate-400 tracking-wider">
            Command Center
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_rgba(0,229,255,0.15)] font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-transparent"
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="text-base" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                      item.badge === "ADMIN"
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                        : item.badge === "AI"
                          ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Blockchain Status Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
              <div>
                <p className="text-xs font-semibold text-white">SHA-256 / AES-256</p>
                <p className="text-[10px] font-mono text-slate-400">Cryptographic Active</p>
              </div>
            </div>
            <FaLock className="text-cyan-400 text-xs" />
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
