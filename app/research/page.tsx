"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AgentPanel from "@/app/components/AgentPanel";
import FlowConnector from "@/app/components/FlowConnector";
import { AgentState, AgentId } from "@/app/types";
import { INITIAL_AGENTS } from "@/lib/agents";

const AGENT_ORDER: AgentId[] = ["scout", "analyst", "critic", "writer"];

function ResearchDashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";

  const [agents, setAgents] = useState<AgentState[]>(
    INITIAL_AGENTS.map((a) => ({ ...a }))
  );
  const [currentAgentIndex, setCurrentAgentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const startTimeRef = useRef<number>(0);
  const outputsRef = useRef<Record<string, string>>({});
  const abortRef = useRef<AbortController | null>(null);

  // Timer
  useEffect(() => {
    if (!hasStarted || isComplete) return;
    startTimeRef.current = Date.now();
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [hasStarted, isComplete]);

  useEffect(() => {
    if (!query) {
      router.push("/");
      return;
    }
    runPipeline();
    return () => {
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runAgent(agentId: AgentId, agentIndex: number): Promise<string> {
    setAgents((prev) =>
      prev.map((a) =>
        a.id === agentId ? { ...a, status: "active", startTime: Date.now() } : a
      )
    );
    setCurrentAgentIndex(agentIndex);

    const controller = new AbortController();
    abortRef.current = controller;

    let fullOutput = "";
    let agentErrored = false;

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent: agentId,
          query,
          previousOutputs: outputsRef.current,
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`API request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (!json) continue;

          try {
            const parsed = JSON.parse(json);
            if (parsed.type === "text") {
              fullOutput += parsed.text;
              setAgents((prev) =>
                prev.map((a) =>
                  a.id === agentId ? { ...a, output: fullOutput } : a
                )
              );
            } else if (parsed.type === "done") {
              streamDone = true;
              break;
            } else if (parsed.type === "error") {
              agentErrored = true;
              streamDone = true;
              break;
            }
          } catch {
            // skip malformed SSE chunk
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        return fullOutput;
      }
      agentErrored = true;
    }

    // Always store whatever output was accumulated, even partial
    outputsRef.current[agentId] = fullOutput;

    setAgents((prev) =>
      prev.map((a) =>
        a.id === agentId
          ? { ...a, status: agentErrored ? "error" : "done", endTime: Date.now() }
          : a
      )
    );

    return fullOutput;
  }

  async function runPipeline() {
    setHasStarted(true);

    for (let i = 0; i < AGENT_ORDER.length; i++) {
      await runAgent(AGENT_ORDER[i], i);
    }

    setIsComplete(true);
  }

  function handleViewReport() {
    const report = outputsRef.current["writer"] || "";
    sessionStorage.setItem("rm_report", report);
    sessionStorage.setItem("rm_query", query);
    sessionStorage.setItem("rm_scout", outputsRef.current["scout"] || "");
    router.push("/report");
  }

  function handleNewResearch() {
    router.push("/");
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  const completedCount = agents.filter((a) => a.status === "done").length;

  return (
    <main className="min-h-screen dot-bg flex flex-col" style={{ background: "var(--bg-base)" }}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: "var(--border)", background: "rgba(13,21,38,0.95)", backdropFilter: "blur(8px)" }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={handleNewResearch}
            className="flex items-center gap-2 text-sm transition-colors"
            style={{ color: "var(--text-muted)", fontFamily: "'Space Mono', monospace", fontSize: "0.75rem" }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "var(--cyan)")}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "var(--text-muted)")}
          >
            ← New Research
          </button>
          <div className="w-px h-4" style={{ background: "var(--border)" }} />
          <div style={{ color: "var(--text-muted)", fontFamily: "'Space Mono', monospace", fontSize: "0.7rem" }}>
            ResearchMind AI
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Progress */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {AGENT_ORDER.map((id) => {
                const a = agents.find((ag) => ag.id === id);
                return (
                  <div
                    key={id}
                    className="w-2 h-2 rounded-full transition-all duration-300"
                    style={{
                      background:
                        a?.status === "done"
                          ? "#22c55e"
                          : a?.status === "active"
                          ? "var(--cyan)"
                          : "var(--border)",
                      boxShadow: a?.status === "active" ? "0 0 6px var(--cyan)" : "none",
                    }}
                  />
                );
              })}
            </div>
            <span style={{ color: "var(--text-muted)", fontSize: "0.65rem", fontFamily: "'Space Mono', monospace" }}>
              {completedCount}/4 agents
            </span>
          </div>

          {hasStarted && !isComplete && (
            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded"
              style={{ background: "var(--cyan-dim)", border: "1px solid var(--cyan)", borderColor: "rgba(0,212,255,0.3)" }}
            >
              <div className="w-1.5 h-1.5 rounded-full animate-pulse-ring" style={{ background: "var(--cyan)" }} />
              <span style={{ color: "var(--cyan)", fontSize: "0.65rem", fontFamily: "'Space Mono', monospace" }}>
                {formatTime(elapsedTime)}
              </span>
            </div>
          )}

          {isComplete && (
            <button className="btn-primary px-4 py-2 rounded text-sm" onClick={handleViewReport}>
              View Report →
            </button>
          )}
        </div>
      </div>

      {/* Query display */}
      <div
        className="px-6 py-4 border-b"
        style={{ borderColor: "var(--border)", background: "rgba(0,0,0,0.2)" }}
      >
        <div style={{ color: "var(--text-muted)", fontSize: "0.6rem", fontFamily: "'Space Mono', monospace", marginBottom: "0.25rem" }}>
          RESEARCH QUERY
        </div>
        <div
          className="text-sm"
          style={{ color: "var(--text-primary)", fontFamily: "'Syne', sans-serif", fontWeight: 600 }}
        >
          {query}
        </div>
      </div>

      {/* Agent pipeline */}
      <div className="flex-1 px-4 sm:px-6 py-6 overflow-y-auto">
        <div className="max-w-5xl mx-auto flex flex-col gap-0">
          {agents.map((agent, index) => {
            const isActive = agent.status === "active";
            const prevDone = index === 0 || agents[index - 1].status === "done";
            const showConnector = index < agents.length - 1;

            return (
              <div key={agent.id}>
                <div
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <AgentPanel agent={agent} index={index} />
                </div>

                {showConnector && (
                  <FlowConnector
                    active={isActive || (prevDone && agents[index + 1].status === "active")}
                    done={agent.status === "done" && agents[index + 1].status !== "idle"}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Complete state */}
        {isComplete && (
          <div
            className="max-w-5xl mx-auto mt-6 rounded-lg border p-6 text-center animate-fade-in-up"
            style={{
              borderColor: "#22c55e44",
              background: "rgba(34,197,94,0.05)",
            }}
          >
            <div className="text-2xl mb-2" style={{ color: "#22c55e" }}>
              ✓
            </div>
            <div
              className="text-lg font-bold mb-1"
              style={{ fontFamily: "'Syne', sans-serif", color: "#22c55e" }}
            >
              Research Complete
            </div>
            <div
              className="text-sm mb-4"
              style={{ color: "var(--text-muted)", fontFamily: "'Space Mono', monospace", fontSize: "0.75rem" }}
            >
              All 4 agents finished in {formatTime(elapsedTime)}. Your report is ready.
            </div>
            <button className="btn-primary px-8 py-3 rounded-lg text-base" onClick={handleViewReport}>
              View Full Report →
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default function ResearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <div style={{ color: "var(--text-muted)", fontFamily: "'Space Mono', monospace", fontSize: "0.8rem" }}>
          Initializing pipeline<span className="animate-blink">...</span>
        </div>
      </div>
    }>
      <ResearchDashboard />
    </Suspense>
  );
}
