import { useState } from "react";
import { motion } from "framer-motion";
import {
  FaUser,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaShieldAlt,
  FaUserPlus,
  FaKey,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { useAuth } from "../../context/AuthContext";
import GlassCard from "../common/GlassCard";
import Button from "../common/Button";
import RegisterModal from "./RegisterModal";

function LoginCard() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      toast.error("Please enter both username and password.");
      return;
    }

    try {
      setLoading(true);
      await login(username.trim(), password);
      navigate("/dashboard");
    } catch {
      // Error handled inside login method
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (user, pass) => {
    setUsername(user);
    setPassword(pass);
  };

  return (
    <>
      <GlassCard className="p-8 sm:p-10 relative overflow-hidden border-cyan-500/30">
        {/* Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-purple-500/15 blur-3xl pointer-events-none"></div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto mb-3 shadow-[0_0_20px_rgba(0,229,255,0.2)]">
            <FaShieldAlt className="text-2xl" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wider">
            PORTAL <span className="text-cyan-400">ACCESS</span>
          </h2>
          <p className="text-xs font-mono text-slate-400 mt-1 uppercase tracking-widest">
            Cryptographic Authentication
          </p>
        </motion.div>

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Username */}
          <div>
            <label className="block text-xs font-mono text-cyan-300 uppercase tracking-wider mb-2">
              Agent Identity / Username
            </label>
            <div className="relative">
              <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400" />
              <input
                type="text"
                placeholder="Enter Username"
                className="cyber-input pl-11 text-sm"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-mono text-cyan-300 uppercase tracking-wider mb-2">
              Access Passphrase
            </label>
            <div className="relative">
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter Password"
                className="cyber-input pl-11 pr-11 text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-cyan-400 hover:text-cyan-300 transition"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Remember Me + Register link */}
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={() => setRemember(!remember)}
                className="rounded border-slate-700 bg-slate-800 text-cyan-400 focus:ring-0"
              />
              Keep Session Active
            </label>

            <button
              type="button"
              onClick={() => setShowRegister(true)}
              className="text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1"
            >
              <FaUserPlus className="text-xs" /> Enlist New Agent
            </button>
          </div>

          {/* Login Button */}
          <Button
            text="AUTHENTICATE & ENTER"
            type="submit"
            loading={loading}
            className="mt-2 py-3.5 tracking-wider font-bold"
          />
        </form>

        {/* Quick Demo Credentials */}
        <div className="mt-8 pt-6 border-t border-slate-800/80">
          <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <FaKey className="text-cyan-400" /> Fast Fill Test Credentials:
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <button
              type="button"
              onClick={() => fillCredentials("Rawaha", "123")}
              className="p-2 rounded-lg bg-slate-900/90 border border-purple-500/30 text-purple-300 hover:bg-purple-500/10 hover:border-purple-500/50 transition text-left"
            >
              <span className="block font-bold text-white">Rawaha</span>
              <span className="text-[10px] text-purple-400">Role: Admin</span>
            </button>

            <button
              type="button"
              onClick={() => fillCredentials("nafeesa", "123")}
              className="p-2 rounded-lg bg-slate-900/90 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-500/50 transition text-left"
            >
              <span className="block font-bold text-white">nafeesa</span>
              <span className="text-[10px] text-cyan-400">Role: Officer</span>
            </button>
          </div>
        </div>

        {/* Security Parameters Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800/60 grid grid-cols-3 gap-2 text-center text-[10px] font-mono text-slate-400">
          <div className="p-1.5 rounded-lg bg-slate-900/40 border border-slate-800/80">
            <span className="block text-slate-400">CIPHER</span>
            <span className="text-cyan-400 font-semibold">AES-256</span>
          </div>
          <div className="p-1.5 rounded-lg bg-slate-900/40 border border-slate-800/80">
            <span className="block text-slate-400">HASH</span>
            <span className="text-cyan-400 font-semibold">SHA-256</span>
          </div>
          <div className="p-1.5 rounded-lg bg-slate-900/40 border border-slate-800/80">
            <span className="block text-slate-400">LEDGER</span>
            <span className="text-emerald-400 font-semibold">ACTIVE</span>
          </div>
        </div>
      </GlassCard>

      {/* Registration Modal */}
      <RegisterModal
        isOpen={showRegister}
        onClose={() => setShowRegister(false)}
      />
    </>
  );
}

export default LoginCard;