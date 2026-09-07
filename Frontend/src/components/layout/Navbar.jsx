import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { FaShieldAlt, FaSignOutAlt, FaBars, FaCircle, FaUserShield, FaBell } from "react-icons/fa";
import StatusBadge from "../common/StatusBadge";

function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getClearanceLevel = (role) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "LEVEL 4 // TOP SECRET";
      case "investigator":
        return "LEVEL 3 // CONFIDENTIAL";
      case "auditor":
        return "LEVEL 2 // AUDIT ONLY";
      default:
        return "LEVEL 1 // FIELD OFFICER";
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#070B14]/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3.5 flex items-center justify-between">
      {/* Left side: Hamburger button + System Status indicator */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          aria-label="Toggle Sidebar"
        >
          <FaBars className="text-xl" />
        </button>

        <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-300">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-400">SOC NODE:</span>
          <span className="text-cyan-400 font-semibold">ONLINE</span>
        </div>

        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono">
          <span className="text-slate-500">CLEARANCE:</span>
          <span className="text-purple-400 font-semibold">{getClearanceLevel(user?.role)}</span>
        </div>
      </div>

      {/* Right side: Live Clock + User info + Logout */}
      <div className="flex items-center gap-4">
        {/* Live Clock */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono text-cyan-300">
          <span>{time.toUTCString().slice(17, 25)} UTC</span>
          <span className="text-slate-600">|</span>
          <span>{time.toLocaleTimeString()} LOCAL</span>
        </div>

        {/* User Badge */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <FaUserShield className="text-base" />
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-semibold text-white leading-tight capitalize">
              {user?.username || "Agent"}
            </p>
            <div className="mt-0.5">
              <StatusBadge status={user?.role || "officer"} />
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            title="Terminate Session & Log Out"
            className="p-2.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition ml-1"
          >
            <FaSignOutAlt className="text-base" />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
