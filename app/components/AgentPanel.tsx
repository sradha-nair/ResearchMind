"use client";

import { useEffect, useRef } from "react";
import { AgentState } from "@/app/types";

const AGENT_COLORS: Record<string, string> = {
  scout: "var(--agent-scout)",
  analyst: "var(--agent-analyst)",
  critic: "var(--agent-critic)",
  writer: "var(--agent-writer)",
};

const AGENT_BG: Record<string, string> = {
  scout: "#edf4f1",
  analyst: "#f1f4ed",
  critic: "#f6f2ed",
  writer: "#edf1f6",
};

const AGENT_BORDER: Record<string, string> = {
  scout: "#b8d4cc",
  analyst: "#c8d4b8",
  critic: "#d4c4a8",
  writer: "#b8c8d4",
};

interface AgentPanelProps {
  agent: AgentState;
  index: number;
}

export default function AgentPanel({ agent, index }: AgentPanelProps) {
  const outputRef = useRef<HTMLDivElement>(null);
  const color = AGENT_COLORS[agent.id];
  const agentBg = AGENT_BG[agent.id];
  const agentBorder = AGENT_BORDER[agent.id];

  useEffect(() => {
    if (outputRef.current && agent.status === "active") {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [agent.output, agent.status]);

  const statusLabel =
    agent.status === "active" ? "Working" :
    agent.status === "done"   ? "Complete" :
    agent.status === "error"  ? "Error" : "Waiting";

  const statusDot =
    agent.status === "active" ? "var(--status-active)" :
    agent.status === "done"   ? "var(--status-done)" :
    agent.status === "error"  ? "var(--status-error)" :
    "var(--text-faint)";

  const elapsed =
    agent.startTime && agent.endTime
      ? ((agent.endTime - agent.startTime) / 1000).toFixed(1) + "s"
      : null;

  const panelClass =
    agent.status === "active" ? "agent-active" :
    agent.status === "done"   ? "agent-done" : "agent-idle";

  return (
    <div
      className={`rounded-xl border flex flex-col transition-all duration-400 ${panelClass}`}
      style={{ minHeight: "260px", animationDelay: `${index * 80}ms` }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 rounded-t-xl border-b"
        style={{
          background: agent.status === "idle" ? "var(--bg-subtle)" : agentBg,
          borderColor: agent.status === "idle" ? "var(--border)" : agentBorder,
          transition: "background 0.4s ease",
        }}
      >
        <div className="flex items-center gap-3">
          {/* Status dot */}
          <div className="relative flex items-center justify-center w-4 h-4">
            {agent.status === "active" && (
              <div
                className="absolute inset-0 rounded-full animate-pulse-ring"
                style={{ background: color, opacity: 0.15 }}
              />
            )}
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: statusDot }}
            />
          </div>

          {/* Name + role */}
          <div>
            <div
              className="font-bold text-sm leading-none mb-0.5"
              style={{
                fontFamily: "'Syne', sans-serif",
                color: agent.status !== "idle" ? color : "var(--text-primary)",
              }}
            >
              {agent.name}
            </div>
            <div style={{ color: "var(--text-faint)", fontSize: "0.65rem", fontWeight: 500, letterSpacing: "0.04em" }}>
              {agent.role}
            </div>
          </div>
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-2">
          {elapsed && (
            <span style={{ color: "var(--text-faint)", fontSize: "0.68rem" }}>
              {elapsed}
            </span>
          )}
          <div
            className="px-2.5 py-0.5 rounded-full text-xs font-medium"
            style={{
              background: agent.status === "idle" ? "var(--bg-surface)" : `${agentBorder}88`,
              color: agent.status === "idle" ? "var(--text-faint)" : color,
              border: `1px solid ${agent.status === "idle" ? "var(--border)" : agentBorder}`,
              fontSize: "0.65rem",
              fontWeight: 600,
            }}
          >
            {statusLabel}
            {agent.status === "active" && <span className="animate-blink ml-0.5">·</span>}
          </div>
        </div>
      </div>

      {/* Output area */}
      <div
        ref={outputRef}
        className="flex-1 overflow-y-auto px-5 py-4"
        style={{ maxHeight: "280px" }}
      >
        {agent.status === "idle" && (
          <div style={{ color: "var(--text-faint)", fontSize: "0.8rem" }}>
            Waiting for previous agent to complete...
          </div>
        )}

        {(agent.status === "active" || agent.status === "done") && agent.output && (
          <div className="stream-content">
            {agent.output}
            {agent.status === "active" && (
              <span
                className="animate-blink inline-block ml-0.5 w-1.5 h-3.5 rounded-sm align-middle"
                style={{ background: color, verticalAlign: "text-bottom" }}
              />
            )}
          </div>
        )}

        {agent.status === "active" && !agent.output && (
          <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
            Initializing<span className="animate-blink">...</span>
          </div>
        )}

        {agent.status === "error" && (
          <div style={{ fontSize: "0.82rem" }}>
            {agent.output ? (
              <div>
                <div className="stream-content">{agent.output}</div>
                <div
                  className="mt-3 px-3 py-2 rounded-lg text-xs"
                  style={{ background: "#fef2f2", color: "var(--status-error)", border: "1px solid #fecaca" }}
                >
                  Agent stopped early — partial output above is still passed to downstream agents.
                </div>
              </div>
            ) : (
              <div
                className="px-3 py-2 rounded-lg text-xs"
                style={{ background: "#fef2f2", color: "var(--status-error)", border: "1px solid #fecaca" }}
              >
                Agent failed — verify that ANTHROPIC_API_KEY is set in your Vercel environment variables.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
