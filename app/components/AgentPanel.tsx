"use client";

import { useEffect, useRef } from "react";
import { AgentState } from "@/app/types";

const AGENT_COLORS: Record<string, string> = {
  scout: "#00d4ff",
  analyst: "#7c6fff",
  critic: "#f59e0b",
  writer: "#22c55e",
};

interface AgentPanelProps {
  agent: AgentState;
  index: number;
}

export default function AgentPanel({ agent, index }: AgentPanelProps) {
  const outputRef = useRef<HTMLDivElement>(null);
  const color = AGENT_COLORS[agent.id];

  // Auto-scroll to bottom when output updates
  useEffect(() => {
    if (outputRef.current && agent.status === "active") {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [agent.output, agent.status]);

  const panelClass =
    agent.status === "active"
      ? "agent-active"
      : agent.status === "done"
      ? "agent-done"
      : "agent-idle";

  const statusLabel =
    agent.status === "active"
      ? "thinking"
      : agent.status === "done"
      ? "complete"
      : "idle";

  const statusColor =
    agent.status === "active"
      ? "#00d4ff"
      : agent.status === "done"
      ? "#22c55e"
      : "#4a5978";

  const elapsed =
    agent.startTime && agent.endTime
      ? ((agent.endTime - agent.startTime) / 1000).toFixed(1) + "s"
      : null;

  return (
    <div
      className={`rounded-lg border flex flex-col transition-all duration-500 ${panelClass}`}
      style={{
        animationDelay: `${index * 100}ms`,
        minHeight: "280px",
      }}
    >
      {/* Panel header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-3">
          {/* Status indicator */}
          <div className="relative flex items-center justify-center w-5 h-5">
            {agent.status === "active" && (
              <div
                className="absolute inset-0 rounded-full animate-pulse-ring"
                style={{ background: color, opacity: 0.2 }}
              />
            )}
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{
                background: statusColor,
                boxShadow: agent.status !== "idle" ? `0 0 8px ${statusColor}` : "none",
              }}
            />
          </div>

          {/* Icon + name */}
          <div className="flex items-center gap-2">
            <span
              className="text-lg"
              style={{
                color,
                filter: agent.status !== "idle" ? `drop-shadow(0 0 6px ${color})` : "none",
              }}
            >
              {agent.icon}
            </span>
            <div>
              <div
                className="font-bold text-sm leading-none"
                style={{ fontFamily: "'Syne', sans-serif", color: agent.status !== "idle" ? color : "var(--text-primary)" }}
              >
                {agent.name}
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.6rem", fontFamily: "'Space Mono', monospace" }}>
                {agent.role}
              </div>
            </div>
          </div>
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-2">
          {elapsed && (
            <span style={{ color: "var(--text-muted)", fontSize: "0.6rem", fontFamily: "'Space Mono', monospace" }}>
              {elapsed}
            </span>
          )}
          <div
            className="px-2 py-0.5 rounded text-xs"
            style={{
              background: agent.status !== "idle" ? `${statusColor}22` : "var(--bg-base)",
              color: statusColor,
              fontFamily: "'Space Mono', monospace",
              fontSize: "0.6rem",
              border: `1px solid ${statusColor}44`,
            }}
          >
            {statusLabel}
            {agent.status === "active" && (
              <span className="animate-blink ml-1">_</span>
            )}
          </div>
        </div>
      </div>

      {/* Terminal header bar */}
      <div
        className="flex items-center gap-1.5 px-4 py-2 border-b"
        style={{ borderColor: "var(--border)", background: "rgba(0,0,0,0.2)" }}
      >
        <div className="w-2 h-2 rounded-full" style={{ background: "#ff5f57" }} />
        <div className="w-2 h-2 rounded-full" style={{ background: "#febc2e" }} />
        <div className="w-2 h-2 rounded-full" style={{ background: "#28c840" }} />
        <span
          className="ml-2 text-xs"
          style={{ color: "var(--text-muted)", fontFamily: "'Space Mono', monospace", fontSize: "0.6rem" }}
        >
          agent/{agent.id}.stream
        </span>
      </div>

      {/* Output area */}
      <div
        ref={outputRef}
        className="flex-1 overflow-y-auto p-4"
        style={{
          maxHeight: "300px",
          background: "rgba(0,0,0,0.15)",
        }}
      >
        {agent.status === "idle" && (
          <div
            style={{ color: "var(--text-muted)", fontSize: "0.7rem", fontFamily: "'Space Mono', monospace" }}
          >
            <span style={{ color: "var(--border)" }}>{">"}</span> Waiting for pipeline...
          </div>
        )}

        {(agent.status === "active" || agent.status === "done") && agent.output && (
          <div className="stream-content">
            {agent.output}
            {agent.status === "active" && (
              <span
                className="animate-blink inline-block ml-0.5 w-2 h-3 align-middle"
                style={{ background: color }}
              />
            )}
          </div>
        )}

        {agent.status === "active" && !agent.output && (
          <div
            style={{ color: "var(--text-muted)", fontSize: "0.7rem", fontFamily: "'Space Mono', monospace" }}
          >
            <span style={{ color }}>{">"}</span> Initializing
            <span className="animate-blink">...</span>
          </div>
        )}

        {agent.status === "error" && (
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.7rem" }}>
            {agent.output ? (
              // Show whatever partial output was received before the error
              <div>
                <div className="stream-content">{agent.output}</div>
                <div style={{ color: "#ef4444", marginTop: "0.5rem" }}>
                  ✗ Agent stopped early — partial output above may still be used by downstream agents.
                </div>
              </div>
            ) : (
              <div style={{ color: "#ef4444" }}>
                ✗ Agent failed — check that your ANTHROPIC_API_KEY is set correctly in Vercel environment variables.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
