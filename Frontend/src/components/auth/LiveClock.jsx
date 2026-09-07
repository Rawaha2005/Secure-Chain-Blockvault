import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaClock } from "react-icons/fa";

function LiveClock() {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const time = dateTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const date = dateTime.toLocaleDateString([], {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      className="
        glass-card
        px-6
        py-4
        min-w-[260px]
      "
    >
      <div className="flex items-center gap-3 mb-3">
        <FaClock className="text-cyan-400 text-xl" />

        <h3 className="text-cyan-300 font-semibold tracking-wide">
          SYSTEM TIME
        </h3>
      </div>

      <h1 className="text-3xl font-bold text-cyan-400 tracking-wider">
        {time}
      </h1>

      <p className="text-slate-400 mt-2">
        {date}
      </p>

      <div className="mt-4 flex items-center justify-between border-t border-cyan-500/20 pt-3">

        <span className="text-slate-500 text-sm">
          Time Zone
        </span>

        <span className="text-green-400 text-sm font-semibold">
          {Intl.DateTimeFormat().resolvedOptions().timeZone}
        </span>

      </div>
    </motion.div>
  );
}

export default LiveClock;