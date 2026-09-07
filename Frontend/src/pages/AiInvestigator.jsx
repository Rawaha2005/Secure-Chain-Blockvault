import { useState, useRef, useEffect } from "react";
import api from "../api/api";
import PageHeader from "../components/ui/PageHeader";
import GlassCard from "../components/common/GlassCard";
import { FaRobot, FaPaperPlane, FaTrash, FaShieldAlt, FaSpinner, FaLightbulb } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const SUGGESTED_QUERIES = [
  "How many evidence files are registered?",
  "Is the blockchain valid and untampered?",
  "Show me recent chain of custody events",
  "Were there any failed verification attempts?",
  "Show security scan results and threat summary",
  "List all evidence uploaded by nafeesa",
  "How many users are registered and what are their roles?",
  "Show evidence for CASE-001",
];

function AiInvestigator() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `### SecureChain AI Forensic Investigator Online\n\nI am your AI investigation assistant with **read-only** access to the SecureChain evidence registry, blockchain ledger, chain of custody logs, and security scan results.\n\nI **cannot** modify, delete, or tamper with any evidence, hashes, or blockchain records.\n\n**Clearance Level:** ${user?.role?.toUpperCase() || "AUTHENTICATED"}\n**Agent:** @${user?.username || "Unknown"}\n\n💡 Ask me anything about evidence, blockchain integrity, custody timelines, or security threats.`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg) return;

    const userMsg = { role: "user", content: msg, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await api.post("/ai/chat", {
        message: msg,
        conversation_history: messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
      });
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: response.data.reply, tools_used: response.data.tools_used, timestamp: new Date() },
      ]);
    } catch (err) {
      const errMsg = err.response?.data?.detail || "AI Investigation Engine encountered an error. Please retry.";
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: `**Error:** ${errMsg}`, isError: true, timestamp: new Date() },
      ]);
      toast.error("AI Investigator error.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const clearChat = () => {
    setMessages([{
      role: "assistant",
      content: `### Chat Cleared\n\nSession reset. How can I assist with the investigation?\n\n**Clearance:** ${user?.role?.toUpperCase()} | **Agent:** @${user?.username}`,
      timestamp: new Date(),
    }]);
    toast.success("Chat history cleared");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] max-w-4xl mx-auto space-y-4">
      <PageHeader
        title="AI Forensic Investigator"
        subtitle="Intelligent, read-only forensic assistant with full evidence registry access. Protected by role-based clearance."
        breadcrumb="INTELLIGENCE UNIT"
        badge="AI POWERED"
      />

      {/* Suggested Queries */}
      <div className="flex flex-wrap gap-2">
        {SUGGESTED_QUERIES.map((q, i) => (
          <button
            key={i}
            onClick={() => sendMessage(q)}
            disabled={loading}
            className="text-[11px] font-mono px-3 py-1.5 rounded-full border border-slate-700 bg-slate-900/60 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300 hover:bg-cyan-500/5 transition disabled:opacity-40 flex items-center gap-1.5"
          >
            <FaLightbulb className="text-yellow-400 text-[10px]" /> {q}
          </button>
        ))}
      </div>

      {/* Chat Messages Area */}
      <GlassCard className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 custom-scrollbar">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
            {/* Avatar */}
            <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-sm border ${
              msg.role === "user"
                ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                : "bg-purple-500/10 border-purple-500/30 text-purple-400"
            }`}>
              {msg.role === "user" ? (user?.username?.[0]?.toUpperCase() || "U") : <FaRobot />}
            </div>

            {/* Bubble */}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm space-y-1 ${
              msg.role === "user"
                ? "bg-cyan-500/10 border border-cyan-500/20 text-slate-200 rounded-tr-sm"
                : msg.isError
                  ? "bg-rose-500/10 border border-rose-500/20 text-rose-200 rounded-tl-sm"
                  : "bg-slate-900/80 border border-slate-700/60 text-slate-200 rounded-tl-sm"
            }`}>
              <MarkdownContent content={msg.content} />
              <div className="flex items-center justify-between gap-2 pt-1">
                <p className="text-[10px] font-mono text-slate-500">
                  {msg.timestamp?.toLocaleTimeString()}
                </p>
                {msg.tools_used?.length > 0 && (
                  <div className="flex gap-1 flex-wrap justify-end">
                    {msg.tools_used.map((t, ti) => (
                      <span key={ti} className="text-[9px] font-mono px-1.5 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full">
                        🔧 {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center border bg-purple-500/10 border-purple-500/30 text-purple-400">
              <FaRobot />
            </div>
            <div className="bg-slate-900/80 border border-slate-700/60 rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-2">
              <FaSpinner className="text-cyan-400 animate-spin" />
              <span className="text-xs font-mono text-slate-400">Querying forensic database...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </GlassCard>

      {/* Input Bar */}
      <div className="flex gap-3 items-end">
        <div className="flex-1 relative">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about evidence, blockchain status, custody logs, security threats..."
            rows={2}
            className="w-full bg-[#090e1a] border border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 resize-none pr-12 font-mono"
          />
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 flex items-center justify-center hover:bg-cyan-500/30 transition disabled:opacity-40"
          >
            {loading ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
          </button>
          <button
            onClick={clearChat}
            className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center hover:bg-slate-700 transition"
            title="Clear chat"
          >
            <FaTrash />
          </button>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-center text-[10px] font-mono text-slate-600">
        <FaShieldAlt className="inline mr-1" />
        AI Investigator is strictly read-only. No evidence, hashes, or blockchain records can be modified through this interface.
        All queries are logged for audit compliance.
      </p>
    </div>
  );
}

// Minimal markdown renderer — handles headers, bold, tables, bullets
function MarkdownContent({ content }) {
  if (!content) return null;

  const lines = content.split("\n");
  const elements = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // H3
    if (line.startsWith("### ")) {
      elements.push(<h3 key={i} className="text-sm font-bold text-cyan-300 mt-2 mb-1">{line.slice(4)}</h3>);
    }
    // H2
    else if (line.startsWith("## ")) {
      elements.push(<h2 key={i} className="text-base font-bold text-cyan-300 mt-2 mb-1">{line.slice(3)}</h2>);
    }
    // Table header
    else if (line.startsWith("|") && lines[i + 1]?.startsWith("|---")) {
      const headers = line.split("|").filter(Boolean).map(h => h.trim());
      const rows = [];
      i += 2;
      while (i < lines.length && lines[i].startsWith("|")) {
        rows.push(lines[i].split("|").filter(Boolean).map(c => c.trim()));
        i++;
      }
      elements.push(
        <div key={`tbl-${i}`} className="overflow-x-auto my-2">
          <table className="text-[11px] font-mono w-full border-collapse">
            <thead>
              <tr>{headers.map((h, hi) => <th key={hi} className="border border-slate-700 px-2 py-1 text-cyan-400 text-left bg-slate-900/60">{h}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri}>{row.map((cell, ci) => <td key={ci} className="border border-slate-800 px-2 py-1 text-slate-300">{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }
    // Bullets
    else if (line.startsWith("- ") || line.startsWith("* ")) {
      const bLine = line.slice(2);
      elements.push(
        <li key={i} className="ml-3 text-xs text-slate-300 list-disc" dangerouslySetInnerHTML={{ __html: bLine.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/`(.*?)`/g, "<code class=\"bg-slate-800 px-1 rounded text-cyan-300 text-[10px]\">$1</code>") }} />
      );
    }
    // Regular paragraph
    else if (line.trim()) {
      elements.push(
        <p key={i} className="text-xs text-slate-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, "<strong class=\"text-white\">$1</strong>").replace(/`(.*?)`/g, "<code class=\"bg-slate-800 px-1 rounded text-cyan-300\">$1</code>").replace(/_(.*?)_/g, "<em>$1</em>") }} />
      );
    }
    // Empty line spacing
    else {
      elements.push(<div key={i} className="h-1" />);
    }
    i++;
  }

  return <div className="space-y-0.5">{elements}</div>;
}

export default AiInvestigator;
