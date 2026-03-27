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
        a.id === agentId ? { ...a, status: "active", startTime: Date.now(), output: "" } : a
      )
    );
    setCurrentAgentIndex(agentIndex);

    const controller = new AbortController();
    abortRef.current = controller;

    let fullOutput = "";
    let agentErrored = false;
    let errorMessage = "";

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
        const text = await res.text().catch(() => "");
        throw new Error(`API error ${res.status}: ${text || "no response body"}`);
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
        buffer = lines.pop() ?? "";

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
              errorMessage = parsed.message || "Agent error";
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
      errorMessage = (err as Error).message || "Unknown error";
    }

    // Always persist whatever was accumulated — downstream agents need this context
    outputsRef.current[agentId] = fullOutput;

    setAgents((prev) =>
      prev.map((a) =>
        a.id === agentId
          ? {
              ...a,
              status: agentErrored ? "error" : "done",
              endTime: Date.now(),
              // Show error inline in the panel if nothing streamed
              output: fullOutput || (agentErrored ? `Error: ${errorMessage}` : a.output),
            }
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
    <main className="min-h-screen dot-bg flex flex-col">
      {/* Top bar */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: "var(--border)", background: "rgba(244,246,241,0.95)", backdropFilter: "blur(8px)" }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: "var(--sage)" }}
            >
              <span style={{ color: "#fff", fontSize: "0.65rem", fontWeight: 700, fontFamily: "'Syne', sans-serif" }}>R</span>
            </div>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)" }}>
              ResearchMind
            </span>
          </div>
          <div className="w-px h-4" style={{ background: "var(--border)" }} />
          <button
            onClick={handleNewResearch}
            className="text-sm transition-colors"
            style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "var(--sage)")}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "var(--text-muted)")}
          >
            ← New Research
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Step dots */}
          <div className="flex items-center gap-1.5">
            {AGENT_ORDER.map((id) => {
              const a = agents.find((ag) => ag.id === id);
              return (
                <div
                  key={id}
                  className="w-2 h-2 rounded-full transition-all duration-300"
                  style={{
                    background:
                      a?.status === "done" ? "var(--status-done)" :
                      a?.status === "active" ? "var(--sage)" :
                      "var(--border)",
                  }}
                />
              );
            })}
            <span style={{ color: "var(--text-muted)", fontSize: "0.72rem", marginLeft: "4px" }}>
              {completedCount}/4
            </span>
          </div>

          {hasStarted && !isComplete && (
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-full"
              style={{ background: "var(--sage-dim)", border: "1px solid var(--sage-pale)" }}
            >
              <div className="w-1.5 h-1.5 rounded-full animate-pulse-ring" style={{ background: "var(--sage)" }} />
              <span style={{ color: "var(--sage)", fontSize: "0.72rem", fontWeight: 500 }}>
                {formatTime(elapsedTime)}
              </span>
            </div>
          )}

          {isComplete && (
            <button className="btn-primary px-4 py-2 rounded-lg text-sm" onClick={handleViewReport}>
              View Report →
            </button>
          )}
        </div>
      </div>

      {/* Query bar */}
      <div
        className="px-6 py-4 border-b"
        style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}
      >
        <div style={{ color: "var(--text-faint)", fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.3rem" }}>
          Research Query
        </div>
        <div style={{ color: "var(--text-primary)", fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: "0.95rem" }}>
          {query}
        </div>
      </div>

      {/* Pipeline */}
      <div className="flex-1 px-4 sm:px-6 py-6 overflow-y-auto">
        <div className="max-w-3xl mx-auto flex flex-col">
          {agents.map((agent, index) => {
            const isActive = agent.status === "active";
            const prevDone = index === 0 || agents[index - 1].status === "done";
            const showConnector = index < agents.length - 1;
            return (
              <div key={agent.id}>
                <div className="animate-fade-in-up" style={{ animationDelay: `${index * 80}ms` }}>
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

        {/* Complete banner */}
        {isComplete && (
          <div
            className="max-w-3xl mx-auto mt-5 rounded-xl border p-6 text-center animate-fade-in-up"
            style={{ borderColor: "var(--sage-pale)", background: "var(--bg-surface)", boxShadow: "0 2px 12px rgba(92,122,92,0.08)" }}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ background: "var(--sage-dim)", border: "1px solid var(--sage-pale)" }}
            >
              <span style={{ color: "var(--sage)", fontSize: "1rem" }}>✓</span>
            </div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)", marginBottom: "0.4rem" }}>
              Research complete
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: "1.25rem" }}>
              All 4 agents finished in {formatTime(elapsedTime)}.
            </div>
            <button className="btn-primary px-7 py-2.5 rounded-lg text-sm" onClick={handleViewReport}>
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
        <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
          Initializing<span className="animate-blink">...</span>
        </div>
      </div>
    }>
      <ResearchDashboard />
    </Suspense>
  );
}
