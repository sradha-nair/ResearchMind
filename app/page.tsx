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
    icon: "⬡",
    name: "Scout",
    color: "#00d4ff",
    desc: "Searches the live web for sources, data, and raw intelligence.",
  },
  {
    icon: "◈",
    name: "Analyst",
    color: "#7c6fff",
    desc: "Identifies patterns, trends, and knowledge gaps from Scout's findings.",
  },
  {
    icon: "◇",
    name: "Critic",
    color: "#f59e0b",
    desc: "Challenges weak assumptions and adds counterarguments.",
  },
  {
    icon: "◉",
    name: "Writer",
    color: "#22c55e",
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
    const encoded = encodeURIComponent(query.trim());
    router.push(`/research?q=${encoded}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleStart();
    }
  }

  return (
    <main className="min-h-screen grid-bg flex flex-col items-center justify-center px-4 py-16 relative">
      {/* Ambient glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)" }}
      />

      <div className="w-full max-w-3xl flex flex-col items-center gap-10 z-10">
        {/* Header */}
        <div className="flex flex-col items-center gap-4 text-center animate-fade-in-up">
          <div className="flex items-center gap-3 mb-2">
            <span
              className="text-2xl animate-pulse-ring"
              style={{ color: "var(--cyan)", filter: "drop-shadow(0 0 8px var(--cyan))" }}
            >
              ◎
            </span>
            <span
              className="text-xs tracking-widest uppercase"
              style={{ color: "var(--text-muted)", fontFamily: "'Space Mono', monospace" }}
            >
              Multi-Agent Research Intelligence
            </span>
          </div>

          <h1
            className="text-5xl sm:text-6xl font-extrabold leading-tight tracking-tight"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            <span className="gradient-text">ResearchMind</span>
            <span style={{ color: "var(--text-primary)" }}> AI</span>
          </h1>

          <p
            className="text-lg max-w-xl"
            style={{ color: "var(--text-secondary)", fontFamily: "'Space Mono', monospace", fontSize: "0.85rem", lineHeight: "1.8" }}
          >
            Four specialized AI agents work in real time — searching the web, analyzing data,
            stress-testing assumptions, and writing a professional report. All for any topic you
            throw at them.
          </p>
        </div>

        {/* Query input */}
        <div className="w-full flex flex-col gap-3">
          <div
            className="w-full rounded-lg border overflow-hidden transition-all duration-300"
            style={{ borderColor: query ? "var(--cyan)" : "var(--border)", background: "var(--bg-card)", boxShadow: query ? "0 0 24px var(--cyan-dim)" : "none" }}
          >
            <textarea
              className="w-full bg-transparent resize-none outline-none px-5 py-4 text-sm"
              style={{
                color: "var(--text-primary)",
                fontFamily: "'Space Mono', monospace",
                fontSize: "0.85rem",
                lineHeight: "1.7",
                minHeight: "100px",
              }}
              placeholder="Enter your research question... (e.g. Analyze the impact of LLMs on healthcare in 2025)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <div
              className="flex items-center justify-between px-5 py-3 border-t"
              style={{ borderColor: "var(--border)" }}
            >
              <span style={{ color: "var(--text-muted)", fontSize: "0.7rem", fontFamily: "'Space Mono', monospace" }}>
                ⌘ + Enter to start
              </span>
              <button
                className="btn-primary px-6 py-2 rounded text-sm"
                onClick={handleStart}
                disabled={!query.trim() || isLoading}
              >
                {isLoading ? "Launching..." : "Start Research →"}
              </button>
            </div>
          </div>

          {/* Sample queries */}
          <div className="flex flex-wrap gap-2">
            {SAMPLE_QUERIES.map((q) => (
              <button
                key={q}
                className="btn-ghost text-xs px-3 py-1.5 rounded"
                style={{ fontSize: "0.65rem" }}
                onClick={() => setQuery(q)}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Pipeline visualization */}
        <div className="w-full">
          <div
            className="text-center mb-6 text-xs tracking-widest uppercase"
            style={{ color: "var(--text-muted)", fontFamily: "'Space Mono', monospace" }}
          >
            The 4-Agent Pipeline
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PIPELINE_STEPS.map((step, i) => (
              <div key={step.name} className="flex flex-col items-center gap-2">
                {/* Card */}
                <div
                  className="w-full rounded-lg border p-4 flex flex-col items-center gap-2 text-center transition-all duration-300 hover:border-opacity-60"
                  style={{
                    background: "var(--bg-card)",
                    borderColor: "var(--border)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = step.color;
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 0 16px ${step.color}22`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  }}
                >
                  <span className="text-2xl" style={{ color: step.color, filter: `drop-shadow(0 0 6px ${step.color})` }}>
                    {step.icon}
                  </span>
                  <div>
                    <div className="text-sm font-bold mb-0.5" style={{ fontFamily: "'Syne', sans-serif", color: step.color }}>
                      {step.name}
                    </div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.65rem", fontFamily: "'Space Mono', monospace", lineHeight: "1.5" }}>
                      {step.desc}
                    </div>
                  </div>
                </div>

                {/* Step number */}
                <span style={{ color: "var(--text-muted)", fontSize: "0.6rem", fontFamily: "'Space Mono', monospace" }}>
                  0{i + 1}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          className="text-center"
          style={{ color: "var(--text-muted)", fontSize: "0.65rem", fontFamily: "'Space Mono', monospace" }}
        >
          Powered by Claude claude-sonnet-4-20250514 · Live web search · Real-time streaming
        </div>
      </div>
    </main>
  );
}
