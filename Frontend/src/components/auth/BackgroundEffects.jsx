import { motion } from "framer-motion";

function BackgroundEffects() {
  return (
    <>
      {/* =======================
          Main Background
      ======================== */}
      <div className="absolute inset-0 bg-[#070B14]" />

      {/* =======================
          Top Left Glow
      ======================== */}
      <motion.div
        animate={{
          x: [0, 40, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
        }}
        className="
          absolute
          -top-40
          -left-40
          w-[500px]
          h-[500px]
          rounded-full
          bg-cyan-500/20
          blur-[180px]
        "
      />

      {/* =======================
          Bottom Right Glow
      ======================== */}

      <motion.div
        animate={{
          x: [0, -30, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
        }}
        className="
          absolute
          -bottom-40
          -right-40
          w-[500px]
          h-[500px]
          rounded-full
          bg-purple-600/20
          blur-[180px]
        "
      />

      {/* =======================
          Center Glow
      ======================== */}

      <motion.div
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
        }}
        className="
          absolute
          left-1/2
          top-1/2
          -translate-x-1/2
          -translate-y-1/2
          w-[400px]
          h-[400px]
          rounded-full
          bg-cyan-400/10
          blur-[150px]
        "
      />

      {/* =======================
          Cyber Grid
      ======================== */}

      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            `
            linear-gradient(rgba(0,229,255,.2) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,229,255,.2) 1px, transparent 1px)
            `,
          backgroundSize: "50px 50px",
        }}
      />

      {/* =======================
          Scan Line
      ======================== */}

      <motion.div
        animate={{
          top: ["-5%", "105%"],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "linear",
        }}
        className="
          absolute
          left-0
          w-full
          h-[2px]
          bg-cyan-400
          shadow-[0_0_20px_#00E5FF]
          opacity-60
        "
      />

      {/* =======================
          Floating Dots
      ======================== */}

      {[...Array(25)].map((_, index) => (
        <motion.div
          key={index}
          animate={{
            y: [0, -25, 0],
            opacity: [0.2, 1, 0.2],
          }}
          transition={{
            duration: 2 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
          className="
            absolute
            w-1.5
            h-1.5
            rounded-full
            bg-cyan-400
          "
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
        />
      ))}

      {/* =======================
          Decorative Rings
      ======================== */}

      <div className="absolute left-20 bottom-20 w-40 h-40 rounded-full border border-cyan-500/20"></div>

      <div className="absolute left-24 bottom-24 w-32 h-32 rounded-full border border-cyan-400/20"></div>

      <div className="absolute right-20 top-20 w-48 h-48 rounded-full border border-purple-500/20"></div>

      <div className="absolute right-28 top-28 w-36 h-36 rounded-full border border-cyan-400/20"></div>
    </>
  );
}

export default BackgroundEffects;