import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FaShieldAlt,
  FaDatabase,
  FaServer,
  FaLock,
  FaFingerprint,
  FaCube,
  FaSync,
} from "react-icons/fa";

import api from "../../api/api";


function SystemStatus() {

  // =================================================
  // SYSTEM INFORMATION
  // =================================================

  const [systemInfo, setSystemInfo] = useState(null);

  const [loading, setLoading] = useState(true);


  // =================================================
  // FETCH REAL SYSTEM DATA
  // =================================================

  const fetchSystemInfo = async () => {

    try {

      setLoading(true);

      const response = await api.get("/system/info");

      setSystemInfo(response.data);

    } catch (error) {

      console.error(
        "Failed to load system information:",
        error
      );

      // Keep the UI usable if backend is unavailable
      setSystemInfo({
        system: {
          blockchain: "OFFLINE",
          evidence_storage: "DISCONNECTED",
          api_server: "OFFLINE",
          sha256_engine: "UNKNOWN",
          tamper_detection: "UNKNOWN",
        },

        statistics: {
          evidence: 0,
          blocks: 0,
          users: 0,
        },

        database: {
          status: "DISCONNECTED",
        },
      });

    } finally {

      setLoading(false);

    }
  };


  // =================================================
  // LOAD WHEN LOGIN PAGE OPENS
  // =================================================

  useEffect(() => {

    fetchSystemInfo();

    // Refresh every 10 seconds
    const interval = setInterval(() => {
      fetchSystemInfo();
    }, 10000);

    return () => clearInterval(interval);

  }, []);


  // =================================================
  // SYSTEM SERVICES
  // =================================================

  const services = [

    {
      icon: <FaCube />,
      title: "Blockchain Network",
      status:
        systemInfo?.system?.blockchain || "CHECKING...",
    },

    {
      icon: <FaDatabase />,
      title: "Evidence Storage",
      status:
        systemInfo?.system?.evidence_storage || "CHECKING...",
    },

    {
      icon: <FaServer />,
      title: "API Server",
      status:
        systemInfo?.system?.api_server || "CHECKING...",
    },

    {
      icon: <FaLock />,
      title: "SHA-256 Engine",
      status:
        systemInfo?.system?.sha256_engine || "CHECKING...",
    },

    {
      icon: <FaFingerprint />,
      title: "Tamper Detection",
      status:
        systemInfo?.system?.tamper_detection || "CHECKING...",
    },

  ];


  // =================================================
  // STATUS COLOR
  // =================================================

  const getStatusColor = (status) => {

    if (!status) {
      return "text-slate-400";
    }

    const value = status.toUpperCase();

    if (
      value === "ONLINE" ||
      value === "CONNECTED" ||
      value === "RUNNING" ||
      value === "READY" ||
      value === "ACTIVE"
    ) {
      return "text-green-400";
    }

    if (
      value === "OFFLINE" ||
      value === "DISCONNECTED"
    ) {
      return "text-red-400";
    }

    if (
      value === "WAITING" ||
      value === "UNKNOWN" ||
      value === "CHECKING..."
    ) {
      return "text-yellow-400";
    }

    return "text-slate-400";
  };


  // =================================================
  // STATUS DOT
  // =================================================

  const getStatusDot = (status) => {

    if (!status) {
      return "bg-slate-500";
    }

    const value = status.toUpperCase();

    if (
      value === "ONLINE" ||
      value === "CONNECTED" ||
      value === "RUNNING" ||
      value === "READY" ||
      value === "ACTIVE"
    ) {
      return "bg-green-400";
    }

    if (
      value === "OFFLINE" ||
      value === "DISCONNECTED"
    ) {
      return "bg-red-400";
    }

    return "bg-yellow-400";
  };


  // =================================================
  // RENDER
  // =================================================

  return (

    <motion.div
      initial={{
        opacity: 0,
        x: -80,
      }}
      animate={{
        opacity: 1,
        x: 0,
      }}
      transition={{
        duration: 0.8,
      }}
      className="space-y-8"
    >

      {/* =================================================
          PROJECT TITLE
      ================================================= */}

      <div>

        <h1 className="text-5xl font-bold text-cyan-400 leading-tight">

          Blockchain
          <br />

          Digital Evidence
          <br />

          Management System

        </h1>

        <p className="text-slate-400 mt-6 text-lg leading-8">

          Secure • Immutable • Blockchain Protected

        </p>

      </div>


      {/* =================================================
          SYSTEM STATUS
      ================================================= */}

      <div className="glass-card p-6">

        <div className="flex items-center justify-between mb-6">

          <div className="flex items-center gap-3">

            <FaShieldAlt
              className="text-cyan-400 text-2xl"
            />

            <h2 className="text-2xl font-semibold text-cyan-300">

              SYSTEM STATUS

            </h2>

          </div>


          {/* Refresh indicator */}

          {loading && (

            <FaSync
              className="text-cyan-400 animate-spin"
            />

          )}

        </div>


        <div className="space-y-4">

          {services.map((service, index) => {

            const statusColor =
              getStatusColor(service.status);

            const statusDot =
              getStatusDot(service.status);


            return (

              <motion.div
                key={index}
                initial={{
                  opacity: 0,
                  x: -25,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                transition={{
                  delay: index * 0.15,
                }}
                className="
                  flex
                  items-center
                  justify-between
                  rounded-xl
                  border
                  border-cyan-500/20
                  bg-white/5
                  px-5
                  py-4
                "
              >

                <div className="flex items-center gap-4">

                  <div className="text-cyan-400 text-xl">

                    {service.icon}

                  </div>

                  <span className="text-slate-200">

                    {service.title}

                  </span>

                </div>


                <div className="flex items-center gap-2">

                  <span
                    className={`
                      w-3
                      h-3
                      rounded-full
                      ${statusDot}
                      ${statusColor === "text-green-400"
                        ? "animate-pulse"
                        : ""}
                    `}
                  />

                  <span
                    className={`
                      text-sm
                      font-semibold
                      ${statusColor}
                    `}
                  >

                    {service.status}

                  </span>

                </div>

              </motion.div>

            );

          })}

        </div>

      </div>


      {/* =================================================
          SECURITY FEATURES
      ================================================= */}

      <div className="glass-card p-6">

        <h2 className="text-xl font-semibold text-cyan-300 mb-5">

          SECURITY FEATURES

        </h2>


        <div className="grid grid-cols-2 gap-4">

          <Feature text="Blockchain Integrity" />

          <Feature text="SHA-256 Hashing" />

          <Feature text="JWT Authentication" />

          <Feature text="Tamper Detection" />

          <Feature text="Audit Trail" />

          <Feature text="Role Based Access" />

        </div>

      </div>


      {/* =================================================
          REAL-TIME STATISTICS
      ================================================= */}

      <div className="grid grid-cols-3 gap-4">

        <StatCard
          title="Evidence"
          value={
            systemInfo?.statistics?.evidence ?? "..."
          }
        />

        <StatCard
          title="Blocks"
          value={
            systemInfo?.statistics?.blocks ?? "..."
          }
        />

        <StatCard
          title="Users"
          value={
            systemInfo?.statistics?.users ?? "..."
          }
        />

      </div>

    </motion.div>

  );
}


// =====================================================
// SECURITY FEATURE
// =====================================================

function Feature({ text }) {

  return (

    <div
      className="
        rounded-lg
        border
        border-cyan-500/20
        bg-white/5
        p-3
        text-center
        text-sm
        text-slate-300
        hover:border-cyan-400
        transition
      "
    >

      ✓ {text}

    </div>

  );

}


// =====================================================
// STATISTICS CARD
// =====================================================

function StatCard({
  title,
  value,
}) {

  return (

    <motion.div
      whileHover={{
        scale: 1.04,
      }}
      className="
        glass-card
        p-5
        text-center
      "
    >

      <h3 className="text-slate-400 text-sm">

        {title}

      </h3>


      <p className="text-3xl font-bold text-cyan-400 mt-2">

        {typeof value === "number"
          ? value.toLocaleString()
          : value}

      </p>

    </motion.div>

  );

}


export default SystemStatus;