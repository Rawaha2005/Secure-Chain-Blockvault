import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import PageHeader from "../components/ui/PageHeader";
import SearchBar from "../components/ui/SearchBar";
import StatusBadge from "../components/common/StatusBadge";
import GlassCard from "../components/common/GlassCard";
import { LoadingSpinner } from "../components/ui/Loading";

import {
  FaCubes,
  FaShieldAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaLink,
  FaClock,
  FaHashtag,
  FaCode,
  FaCopy,
  FaCheck,
  FaSync,
} from "react-icons/fa";

import toast from "react-hot-toast";

function Blockchain() {
  // =========================================================
  // STATE
  // =========================================================

  const [chain, setChain] = useState([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);

  const [validationResult, setValidationResult] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [copiedHash, setCopiedHash] = useState(null);

  // =========================================================
  // FETCH BLOCKCHAIN
  // =========================================================

  useEffect(() => {
    fetchBlockchain();
  }, []);

  const fetchBlockchain = async () => {
    setLoading(true);

    try {
      const response = await api.get("/blockchain/chain");

      let chainData = response.data;

      // Some APIs return:
      // { chain: [...] }
      if (chainData && Array.isArray(chainData.chain)) {
        chainData = chainData.chain;
      }

      // Make sure we always store an array
      if (!Array.isArray(chainData)) {
        chainData = [];
      }

      setChain(chainData);

      // Clear previous validation result after refresh
      setValidationResult(null);
    } catch (error) {
      console.error("Blockchain fetch error:", error);

      setChain([]);

      toast.error(
        error?.response?.data?.detail ||
          "Failed to load blockchain ledger."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // PARSE BLOCK DATA
  // =========================================================
  //
  // Blockchain data can arrive as:
  //
  // 1. Object
  // {
  //   filename: "test.pdf",
  //   hash: "abc123"
  // }
  //
  // 2. JSON string
  // "{\"filename\":\"test.pdf\",\"hash\":\"abc123\"}"
  //
  // 3. Normal string
  // "Evidence uploaded successfully"
  //
  // 4. null / undefined
  //
  // This function handles all cases.
  // =========================================================

  const parseBlockData = (data) => {
    if (data === null || data === undefined) {
      return {
        message: "No data available for this block.",
      };
    }

    if (typeof data === "object") {
      return data;
    }

    if (typeof data === "string") {
      const trimmedData = data.trim();

      if (!trimmedData) {
        return {
          message: "No data available for this block.",
        };
      }

      try {
        return JSON.parse(trimmedData);
      } catch (error) {
        return {
          message: data,
        };
      }
    }

    return {
      value: data,
    };
  };

  // =========================================================
  // GET PAYLOAD TEXT
  // =========================================================

  const getPayloadText = (data) => {
    const parsedData = parseBlockData(data);

    if (
      parsedData &&
      typeof parsedData === "object" &&
      !Array.isArray(parsedData)
    ) {
      if (parsedData.filename) {
        return `Filename: ${parsedData.filename}`;
      }

      if (parsedData.file_name) {
        return `Filename: ${parsedData.file_name}`;
      }

      if (parsedData.message) {
        return String(parsedData.message);
      }

      const keys = Object.keys(parsedData);

      if (keys.length > 0) {
        return keys
          .slice(0, 3)
          .map((key) => `${key}: ${parsedData[key]}`)
          .join(" | ");
      }
    }

    if (Array.isArray(parsedData)) {
      return `Array containing ${parsedData.length} item(s)`;
    }

    return String(parsedData);
  };

  // =========================================================
  // VALIDATE BLOCKCHAIN
  // =========================================================

  const handleValidateChain = async () => {
    setValidating(true);

    try {
      const response = await api.get("/blockchain/verify");

      const isValid =
        response.data?.valid === true ||
        response.data?.is_valid === true;

      setValidationResult({
        valid: isValid,
        timestamp: new Date().toLocaleTimeString(),
        totalBlocks: chain.length,
      });

      if (isValid) {
        toast.success("Blockchain integrity validated successfully!");
      } else {
        toast.error(
          "Warning: Blockchain integrity violation detected!"
        );
      }
    } catch (error) {
      console.error("Blockchain validation error:", error);

      setValidationResult({
        valid: false,
        timestamp: new Date().toLocaleTimeString(),
        totalBlocks: chain.length,
      });

      toast.error(
        error?.response?.data?.detail ||
          "Validation check encountered an error."
      );
    } finally {
      setValidating(false);
    }
  };

  // =========================================================
  // COPY TO CLIPBOARD
  // =========================================================

  const handleCopy = async (key, value) => {
    if (!value) {
      toast.error("Nothing to copy.");
      return;
    }

    try {
      await navigator.clipboard.writeText(String(value));

      setCopiedHash(key);

      toast.success("Copied to clipboard.");

      setTimeout(() => {
        setCopiedHash(null);
      }, 2000);
    } catch (error) {
      console.error("Clipboard error:", error);
      toast.error("Failed to copy.");
    }
  };

  // =========================================================
  // FILTER BLOCKCHAIN
  // =========================================================

  const filteredChain = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) {
      return chain;
    }

    return chain.filter((block) => {
      const parsedData = parseBlockData(block?.data);

      const searchableData = [
        block?.index,
        block?.hash,
        block?.previous_hash,
        block?.timestamp,
        JSON.stringify(parsedData),
      ]
        .filter(
          (value) => value !== null && value !== undefined
        )
        .join(" ")
        .toLowerCase();

      return searchableData.includes(term);
    });
  }, [chain, searchTerm]);

  // =========================================================
  // BLOCK DATA
  // =========================================================

  const getBlockData = (block) => {
    return parseBlockData(block?.data);
  };

  // =========================================================
  // CHECK GENESIS BLOCK
  // =========================================================

  const isGenesisBlock = (block) => {
    return (
      Number(block?.index) === 0 ||
      block?.previous_hash === "0" ||
      block?.previous_hash === 0
    );
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="space-y-8">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <PageHeader
        title="Blockchain Explorer & Ledger"
        subtitle="Immutable distributed ledger recording every digital evidence transaction with cryptographic proof-of-integrity."
        breadcrumb="LEDGER"
        badge={`HEIGHT: ${chain.length} BLOCKS`}
        actions={
          <div className="flex items-center gap-3">

            {/* Refresh */}
            <button
              type="button"
              onClick={fetchBlockchain}
              disabled={loading}
              className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/60 text-slate-300 hover:text-white transition disabled:opacity-50"
              title="Refresh Blockchain"
            >
              <FaSync
                className={loading ? "animate-spin" : ""}
              />
            </button>

            {/* Validate */}
            <button
              type="button"
              onClick={handleValidateChain}
              disabled={validating || loading || chain.length === 0}
              className="cyber-btn text-xs py-2.5 px-4 flex items-center gap-2 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaShieldAlt />

              {validating
                ? "Verifying..."
                : "Validate Entire Chain"}
            </button>

          </div>
        }
      />

      {/* =====================================================
          VALIDATION RESULT
      ====================================================== */}

      {validationResult && (
        <div
          className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
            validationResult.valid
              ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/40 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-3">

            {validationResult.valid ? (
              <FaCheckCircle className="text-2xl text-emerald-400 shrink-0" />
            ) : (
              <FaExclamationTriangle className="text-2xl text-rose-400 shrink-0" />
            )}

            <div>

              <p className="text-sm font-bold font-mono">
                {validationResult.valid
                  ? "CRYPTOGRAPHIC CHAIN INTEGRITY: 100% VALID"
                  : "CRYPTOGRAPHIC CHAIN INTEGRITY: TAMPER DETECTED"}
              </p>

              <p className="text-xs opacity-80 font-mono mt-1">
                Verified {validationResult.totalBlocks}{" "}
                connected blocks across SHA-256 links at{" "}
                {validationResult.timestamp}.
              </p>

            </div>
          </div>

          <StatusBadge
            status={
              validationResult.valid
                ? "VALIDATED"
                : "TAMPERED"
            }
          />
        </div>
      )}

      {/* =====================================================
          SEARCH
      ====================================================== */}

      <div className="glass-card p-4 border-slate-800/80">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by block index, hash, or payload data..."
        />
      </div>

      {/* =====================================================
          BLOCKCHAIN
      ====================================================== */}

      {loading ? (
        <LoadingSpinner
          text="Reading Blockchain Ledger from Core Node..."
        />
      ) : filteredChain.length === 0 ? (
        <div className="glass-card p-12 text-center border-slate-800/80">

          {chain.length === 0 ? (
            <>
              <FaCubes className="mx-auto text-4xl text-slate-600 mb-4" />

              <p className="text-sm text-slate-400 font-mono">
                No blockchain blocks are currently available.
              </p>

              <button
                type="button"
                onClick={fetchBlockchain}
                className="mt-5 px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white text-xs font-mono transition"
              >
                Refresh Ledger
              </button>
            </>
          ) : (
            <>
              <FaCubes className="mx-auto text-4xl text-slate-600 mb-4" />

              <p className="text-sm text-slate-400 font-mono">
                No blocks match your search query.
              </p>
            </>
          )}

        </div>
      ) : (
        <div className="space-y-6">

          {filteredChain.map((block, idx) => {

            // =================================================
            // CURRENT BLOCK INFORMATION
            // =================================================

            const blockIndex =
              block?.index !== undefined
                ? block.index
                : idx;

            const blockHash =
              block?.hash || `block-${blockIndex}-${idx}`;

            const previousHash =
              block?.previous_hash ?? "N/A";

            const currentHash =
              block?.hash ?? "N/A";

            const dataObj = getBlockData(block);

            const isGenesis = isGenesisBlock(block);

            const isExpanded =
              expandedIndex === blockIndex;

            // =================================================
            // PAYLOAD INFORMATION
            // =================================================

            const isObject =
              dataObj !== null &&
              typeof dataObj === "object";

            const filename =
              dataObj?.filename ||
              dataObj?.file_name ||
              dataObj?.original_filename ||
              null;

            const payloadPreview =
              getPayloadText(block?.data);

            return (
              <div
                key={blockHash}
                className="relative"
              >

                {/* =================================================
                    CONNECTION LINE
                ================================================== */}

                {idx < filteredChain.length - 1 && (
                  <div className="absolute left-8 -bottom-6 w-0.5 h-6 bg-gradient-to-b from-cyan-500/50 to-cyan-500/10 z-0 hidden sm:block" />
                )}

                {/* =================================================
                    BLOCK CARD
                ================================================== */}

                <GlassCard
                  className={`p-6 sm:p-7 relative z-10 transition-all border ${
                    isGenesis
                      ? "border-purple-500/40 bg-purple-950/10"
                      : "border-slate-800 hover:border-cyan-500/40"
                  }`}
                >

                  {/* =================================================
                      BLOCK HEADER
                  ================================================== */}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-5">

                    <div className="flex items-center gap-3">

                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold border shrink-0 ${
                          isGenesis
                            ? "bg-purple-500/10 border-purple-500/30 text-purple-400"
                            : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                        }`}
                      >
                        <FaCubes />
                      </div>

                      <div>

                        <div className="flex flex-wrap items-center gap-2">

                          <h3 className="text-lg font-bold text-white font-mono">
                            Block #{blockIndex}
                          </h3>

                          {isGenesis && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              GENESIS BLOCK
                            </span>
                          )}

                        </div>

                        <p className="text-xs text-slate-400 font-mono flex items-center gap-1 mt-1">

                          <FaClock className="text-[10px]" />

                          {block?.timestamp
                            ? new Date(
                                block.timestamp
                              ).toLocaleString()
                            : "Timestamp unavailable"}

                        </p>

                      </div>
                    </div>

                    {/* Inspect Button */}

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedIndex(
                          isExpanded
                            ? null
                            : blockIndex
                        )
                      }
                      className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/70 text-slate-300 hover:text-white hover:border-cyan-500/40 text-xs font-mono transition flex items-center justify-center gap-1.5"
                    >
                      <FaCode />

                      {isExpanded
                        ? "Hide Payload"
                        : "Inspect Payload"}
                    </button>

                  </div>

                  {/* =================================================
                      HASH INFORMATION
                  ================================================== */}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono mb-5">

                    {/* Previous Hash */}

                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80">

                      <div className="flex items-center justify-between text-slate-400 mb-2">

                        <span className="flex items-center gap-1.5 text-[11px] uppercase">
                          <FaLink className="text-slate-500" />
                          Previous Block Hash
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(
                              `prev-${blockIndex}`,
                              previousHash
                            )
                          }
                          className="hover:text-cyan-400 transition text-[10px]"
                          title="Copy previous hash"
                        >
                          {copiedHash ===
                          `prev-${blockIndex}` ? (
                            <FaCheck className="text-emerald-400" />
                          ) : (
                            <FaCopy />
                          )}
                        </button>

                      </div>

                      <div className="text-slate-400 break-all select-all leading-relaxed">
                        {previousHash}
                      </div>

                    </div>

                    {/* Current Hash */}

                    <div className="p-3.5 rounded-xl bg-[#090e1a] border border-cyan-500/30">

                      <div className="flex items-center justify-between text-cyan-400 mb-2">

                        <span className="flex items-center gap-1.5 text-[11px] uppercase">
                          <FaHashtag />
                          Current Block Hash
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(
                              `curr-${blockIndex}`,
                              currentHash
                            )
                          }
                          className="hover:text-cyan-300 transition text-[10px]"
                          title="Copy current hash"
                        >
                          {copiedHash ===
                          `curr-${blockIndex}` ? (
                            <FaCheck className="text-emerald-400" />
                          ) : (
                            <FaCopy />
                          )}
                        </button>

                      </div>

                      <div className="text-cyan-300 break-all font-bold select-all leading-relaxed">
                        {currentHash}
                      </div>

                    </div>

                  </div>

                  {/* =================================================
                      BLOCK DATA
                  ================================================== */}

                  <div className="rounded-xl bg-black/50 border border-slate-800 overflow-hidden">

                    {/* Data Header */}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 border-b border-slate-800">

                      <div className="flex items-center gap-2 text-slate-400">

                        <FaCode className="text-cyan-400" />

                        <span className="text-[11px] font-mono uppercase">
                          Evidence Transaction Data
                        </span>

                      </div>

                      {filename && (
                        <span className="text-xs text-white font-semibold font-mono break-all">
                          {filename}
                        </span>
                      )}

                    </div>

                    {/* Data Content */}

                    <div className="p-4">

                      {isExpanded ? (

                        <pre className="p-4 bg-slate-950 rounded-lg text-cyan-300 overflow-x-auto whitespace-pre-wrap break-words text-[11px] border border-slate-800 leading-relaxed">
                          {isObject
                            ? JSON.stringify(
                                dataObj,
                                null,
                                2
                              )
                            : String(dataObj)}
                        </pre>

                      ) : (

                        <div className="text-slate-400 text-xs font-mono break-words leading-relaxed">

                          {payloadPreview}

                        </div>

                      )}

                    </div>

                  </div>

                  {/* =================================================
                      EXTRA DATA INFORMATION
                  ================================================== */}

                  {isExpanded &&
                    isObject &&
                    !Array.isArray(dataObj) && (
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">

                        {Object.entries(dataObj).map(
                          ([key, value]) => {

                            if (
                              value === null ||
                              value === undefined
                            ) {
                              return null;
                            }

                            let displayValue;

                            if (
                              typeof value ===
                              "object"
                            ) {
                              displayValue =
                                JSON.stringify(
                                  value
                                );
                            } else {
                              displayValue =
                                String(value);
                            }

                            return (
                              <div
                                key={key}
                                className="p-3 rounded-xl bg-slate-900/60 border border-slate-800"
                              >

                                <p className="text-[10px] uppercase font-mono text-slate-500 mb-1">
                                  {key.replace(
                                    /_/g,
                                    " "
                                  )}
                                </p>

                                <p className="text-xs font-mono text-slate-300 break-all">
                                  {displayValue}
                                </p>

                              </div>
                            );
                          }
                        )}

                      </div>
                    )}

                </GlassCard>
              </div>
            );
          })}

        </div>
      )}

      {/* =====================================================
          FOOTER INFORMATION
      ====================================================== */}

      {!loading && chain.length > 0 && (
        <div className="text-center text-xs text-slate-600 font-mono pt-2">
          Showing {filteredChain.length} of {chain.length} blocks
        </div>
      )}

    </div>
  );
}

export default Blockchain; 
