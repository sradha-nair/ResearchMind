"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SAMPLE_QUERIES = [
  "Analyze the impact of LLMs on healthcare diagnostics in 2025",
  "What is the current state of fusion energy research?",
  "How is AI reshaping drug discovery and pharmaceutical R&D?",
  "The geopolitical implications of rare earth mineral supply chains",
];

const PIPELINE_STEPS = [
  {
    number: "01",
    name: "Scout",
    color: "var(--agent-scout)",
    bg: "#edf4f1",
    border: "#c4ddd6",
    desc: "Searches the live web for primary sources, data, and raw intelligence.",
  },
  {
    number: "02",
    name: "Analyst",
    color: "var(--agent-analyst)",
    bg: "#f1f4ed",
    border: "#d0d9c4",
    desc: "Identifies patterns, trends, and knowledge gaps across findings.",
  },
  {
    number: "03",
    name: "Critic",
    color: "var(--agent-critic)",
    bg: "#f6f2ed",
    border: "#ddd0c0",
    desc: "Stress-tests the analysis and surfaces counterarguments.",
  },
  {
    number: "04",
    name: "Writer",
    color: "var(--agent-writer)",
    bg: "#edf1f6",
    border: "#c0cedd",
    desc: "Synthesizes everything into a polished research report.",
  },
];

export default function LandingPage() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  function handleStart() {
    if (!query.trim() || isLoading) return;
    setIsLoading(true);
    router.push(`/research?q=${encodeURIComponent(query.trim())}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleStart();
  }

  return (
    <main className="min-h-screen grid-bg flex flex-col">
      {/* Nav */}
      <nav
        className="flex items-center justify-between px-8 py-5 border-b"
        style={{ background: "rgba(244,246,241,0.9)", borderColor: "var(--border)", backdropFilter: "blur(8px)" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center"
            style={{ background: "var(--sage)" }}
          >
            <span style={{ color: "#fff", fontSize: "0.75rem", fontWeight: 700, fontFamily: "'Syne', sans-serif" }}>R</span>
          </div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>
            ResearchMind
          </span>
        </div>
        <div
          className="text-xs px-3 py-1 rounded-full"
          style={{ background: "var(--sage-dim)", color: "var(--sage)", border: "1px solid var(--sage-pale)", fontWeight: 500 }}
        >
          Powered by Claude
        </div>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <div className="w-full max-w-2xl flex flex-col items-center gap-8">

          {/* Heading */}
          <div className="flex flex-col items-center gap-4 text-center animate-fade-in-up">
            <div
              className="text-xs tracking-widest uppercase px-3 py-1.5 rounded-full"
              style={{ color: "var(--sage)", background: "var(--sage-dim)", border: "1px solid var(--sage-pale)", fontWeight: 600, letterSpacing: "0.1em" }}
            >
              Multi-Agent Research Intelligence
            </div>

            <h1
              className="text-5xl sm:text-6xl font-extrabold leading-tight tracking-tight"
              style={{ fontFamily: "'Syne', sans-serif", color: "var(--text-primary)", letterSpacing: "-0.02em" }}
            >
              Research, at the<br />
              <span style={{ color: "var(--sage)" }}>speed of thought.</span>
            </h1>

            <p
              className="max-w-lg text-base leading-relaxed"
              style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}
            >
              Four specialized AI agents collaborate in real time — gathering sources,
              analyzing data, stress-testing assumptions, and writing your report.
            </p>
          </div>

          {/* Input */}
          <div className="w-full flex flex-col gap-3">
            <div
              className="w-full rounded-xl border overflow-hidden transition-all duration-200"
              style={{
                borderColor: query ? "var(--sage-mid)" : "var(--border)",
                background: "var(--bg-surface)",
                boxShadow: query ? "0 0 0 3px var(--sage-dim)" : "0 1px 4px rgba(0,0,0,0.06)",
              }}
            >
              <textarea
                className="w-full bg-transparent resize-none outline-none px-5 pt-4 pb-3"
                style={{
                  color: "var(--text-primary)",
                  fontSize: "0.95rem",
                  lineHeight: "1.65",
                  minHeight: "96px",
                }}
                placeholder="Enter your research question — e.g. Analyze the impact of LLMs on healthcare in 2025"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <div
                className="flex items-center justify-between px-5 py-3 border-t"
                style={{ borderColor: "var(--border)", background: "var(--bg-subtle)" }}
              >
                <span style={{ color: "var(--text-faint)", fontSize: "0.75rem" }}>
                  ⌘ + Enter to start
                </span>
                <button
                  className="btn-primary px-5 py-2 rounded-lg text-sm"
                  onClick={handleStart}
                  disabled={!query.trim() || isLoading}
                >
                  {isLoading ? "Starting..." : "Start Research →"}
                </button>
              </div>
            </div>

            {/* Sample queries */}
            <div className="flex flex-wrap gap-2">
              {SAMPLE_QUERIES.map((q) => (
                <button
                  key={q}
                  className="btn-ghost rounded-lg px-3 py-1.5"
                  style={{ fontSize: "0.72rem" }}
                  onClick={() => setQuery(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Pipeline steps */}
          <div className="w-full">
            <div
              className="text-center mb-5"
              style={{ color: "var(--text-faint)", fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600 }}
            >
              The 4-Agent Pipeline
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {PIPELINE_STEPS.map((step) => (
                <div
                  key={step.name}
                  className="rounded-xl border p-4 transition-all duration-200"
                  style={{ background: step.bg, borderColor: step.border }}
                >
                  <div
                    className="text-xs font-bold mb-2"
                    style={{ color: step.color, fontFamily: "'Syne', sans-serif", letterSpacing: "0.05em" }}
                  >
                    {step.number} — {step.name}
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.72rem", lineHeight: "1.55" }}>
                    {step.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className="text-center py-5 border-t"
        style={{ borderColor: "var(--border)", color: "var(--text-faint)", fontSize: "0.72rem" }}
      >
        Claude claude-sonnet-4-6 · Live web search · Real-time streaming
      </div>
    </main>
  );
}
