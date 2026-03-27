"use client";

interface FlowConnectorProps {
  active: boolean;
  done: boolean;
}

export default function FlowConnector({ active, done }: FlowConnectorProps) {
  const lineColor = done
    ? "var(--status-done)"
    : active
    ? "var(--sage-mid)"
    : "var(--border)";

  const opacity = done ? 0.5 : active ? 0.7 : 0.35;

  return (
    <div className="flex items-center justify-center py-1.5">
      <div className="flex flex-col items-center gap-0.5">
        <div className="w-px h-3 rounded-full transition-all duration-500" style={{ background: lineColor, opacity }} />
        <div
          className="w-1.5 h-1.5 rounded-full transition-all duration-500"
          style={{
            background: lineColor,
            opacity: done ? 0.6 : active ? 0.9 : 0.2,
          }}
        />
        <div className="w-px h-3 rounded-full transition-all duration-500" style={{ background: lineColor, opacity }} />
      </div>
    </div>
  );
}
