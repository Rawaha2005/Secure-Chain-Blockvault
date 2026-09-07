import { useState } from "react";
import Modal from "../ui/Modal";
import { FaUserPlus, FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

function RegisterModal({ isOpen, onClose }) {
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim() || !email.trim() || !password.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (password.length < 4) {
      toast.error("Password must be at least 4 characters.");
      return;
    }

    try {
      setLoading(true);
      await register(username.trim(), email.trim(), password);
      onClose();
      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch {
      // Error handled in context toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enlist SOC Field Officer"
      subtitle="REGISTRATION OF NEW AUTHORIZED AGENT"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username */}
        <div>
          <label className="block text-xs font-mono text-cyan-300 uppercase mb-1.5">
            Agent Username
          </label>
          <div className="relative">
            <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400" />
            <input
              type="text"
              placeholder="e.g. Officer_Smith"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="cyber-input pl-11 text-sm"
              required
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-mono text-cyan-300 uppercase mb-1.5">
            Official Email Address
          </label>
          <div className="relative">
            <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400" />
            <input
              type="email"
              placeholder="e.g. smith@soc.securechain.internal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="cyber-input pl-11 text-sm"
              required
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-mono text-cyan-300 uppercase mb-1.5">
            Access Passphrase
          </label>
          <div className="relative">
            <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter secure password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="cyber-input pl-11 pr-11 text-sm"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-cyan-400"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-xs font-mono text-cyan-300 uppercase mb-1.5">
            Confirm Access Passphrase
          </label>
          <div className="relative">
            <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="cyber-input pl-11 text-sm"
              required
            />
          </div>
        </div>

        <p className="text-[11px] font-mono text-slate-400">
          * New recruits are assigned the <span className="text-cyan-400">Officer</span> role by default. System administrators can elevate permissions via the Personnel sector.
        </p>

        <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-slate-700 bg-slate-800/80 text-slate-300 text-sm font-medium hover:bg-slate-700 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 cyber-btn text-sm py-3 font-bold flex items-center justify-center gap-2"
          >
            <FaUserPlus />
            {loading ? "Registering..." : "Enlist Officer"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default RegisterModal;
