"use client";

interface FlowConnectorProps {
  active: boolean;
  done: boolean;
}

export default function FlowConnector({ active, done }: FlowConnectorProps) {
  return (
    <div className="flex items-center justify-center py-1">
      <div className="flex flex-col items-center gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-0.5 h-2 rounded-full transition-all duration-500"
            style={{
              background: done
                ? "#22c55e"
                : active
                ? "var(--cyan)"
                : "var(--border)",
              opacity: done ? 0.8 : active ? 1 - i * 0.2 : 0.3,
              boxShadow: active ? "0 0 4px var(--cyan)" : done ? "0 0 4px #22c55e" : "none",
              animationDelay: `${i * 150}ms`,
            }}
          />
        ))}
        <div
          className="text-xs transition-all duration-500"
          style={{
            color: done ? "#22c55e" : active ? "var(--cyan)" : "var(--border)",
            fontSize: "0.5rem",
            transform: "rotate(90deg)",
          }}
        >
          ▶
        </div>
        {[0, 1, 2].map((i) => (
          <div
            key={`b${i}`}
            className="w-0.5 h-2 rounded-full transition-all duration-500"
            style={{
              background: done
                ? "#22c55e"
                : active
                ? "var(--cyan)"
                : "var(--border)",
              opacity: done ? 0.8 : active ? 0.2 + i * 0.2 : 0.3,
              boxShadow: active ? "0 0 4px var(--cyan)" : done ? "0 0 4px #22c55e" : "none",
            }}
          />
        ))}
      </div>
    </div>
  );
}
