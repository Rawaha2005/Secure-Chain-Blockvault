import { motion } from "framer-motion";

function Button({
  text,
  type = "button",
  onClick,
  loading = false,
  className = "",
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      type={type}
      onClick={onClick}
      disabled={loading}
      className={`cyber-btn w-full ${className}`}
    >
      {loading ? "Please Wait..." : text}
    </motion.button>
  );
}

export default Button;