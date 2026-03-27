"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";

interface ParsedReport {
  executiveSummary: string;
  keyFindings: string;
  analysis: string;
  counterpoints: string;
  conclusion: string;
  sources: string;
  raw: string;
}

function parseReport(raw: string): ParsedReport {
  const extract = (heading: string, nextHeadings: string[]): string => {
    const pattern = new RegExp(
      `##\\s*${heading}\\s*\\n([\\s\\S]*?)(?=${nextHeadings.map((h) => `##\\s*${h}`).join("|")}|$)`,
      "i"
    );
    const match = raw.match(pattern);
    return match ? match[1].trim() : "";
  };

  return {
    executiveSummary: extract("Executive Summary", [
      "Key Findings",
      "Analysis",
      "Counterpoints",
      "Conclusion",
      "Sources",
    ]),
    keyFindings: extract("Key Findings", [
      "Analysis",
      "Counterpoints",
      "Conclusion",
      "Sources",
    ]),
    analysis: extract("Analysis", ["Counterpoints", "Conclusion", "Sources"]),
    counterpoints: extract("Counterpoints.*", ["Conclusion", "Sources"]),
    conclusion: extract("Conclusion", ["Sources"]),
    sources: extract("Sources", []),
    raw,
  };
}

function formatText(text: string): React.ReactNode[] {
  if (!text) return [];
  return text.split("\n").map((line, i) => {
    if (line.startsWith("- ") || line.startsWith("• ") || line.match(/^\d+\.\s/)) {
      return (
        <li key={i} style={{ color: "var(--text-secondary)", fontFamily: "'Space Mono', monospace", fontSize: "0.78rem", lineHeight: "1.8", marginBottom: "0.25rem" }}>
          {line.replace(/^[-•]\s+/, "").replace(/^\d+\.\s+/, "")}
        </li>
      );
    }
    if (line.trim() === "") return <br key={i} />;
    return (
      <p key={i} style={{ color: "var(--text-secondary)", fontFamily: "'Space Mono', monospace", fontSize: "0.78rem", lineHeight: "1.8", marginBottom: "0.5rem" }}>
        {line}
      </p>
    );
  });
}

function ReportSection({ title, content, color = "var(--cyan)" }: { title: string; content: string; color?: string }) {
  if (!content) return null;
  const lines = formatText(content);
  const hasList = content.split("\n").some((l) => l.startsWith("- ") || l.startsWith("• ") || l.match(/^\d+\.\s/));

  return (
    <div className="mb-8">
      <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "0.85rem", fontWeight: 700, color, borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem", marginBottom: "1rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>
        {title}
      </h2>
      {hasList ? (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {lines}
        </ul>
      ) : (
        <div>{lines}</div>
      )}
    </div>
  );
}

function ReportView() {
  const router = useRouter();
  const [report, setReport] = useState<ParsedReport | null>(null);
  const [query, setQuery] = useState("");
  const [exporting, setExporting] = useState<"pdf" | "word" | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("rm_report") ?? "";
    const q = sessionStorage.getItem("rm_query") ?? "";
    // Don't redirect — if raw is empty show whatever we have (parseReport handles it)
    setReport(parseReport(raw));
    setQuery(q || "Research Report");
  }, [router]);

  async function exportPDF() {
    if (!report) return;
    setExporting("pdf");
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: "a4" });

      const pageW = doc.internal.pageSize.getWidth();
      const margin = 20;
      const contentW = pageW - margin * 2;
      let y = margin;

      const addText = (text: string, size: number, bold: boolean, color: [number, number, number]) => {
        doc.setFontSize(size);
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.setTextColor(...color);
        const lines = doc.splitTextToSize(text, contentW);
        lines.forEach((line: string) => {
          if (y > 270) { doc.addPage(); y = margin; }
          doc.text(line, margin, y);
          y += size * 0.45;
        });
        y += 3;
      };

      // Title
      addText("ResearchMind AI — Research Report", 18, true, [0, 150, 200]);
      addText(query, 12, false, [100, 120, 160]);
      addText(`Generated: ${new Date().toLocaleDateString()}`, 9, false, [150, 150, 150]);
      y += 5;

      const sections = [
        ["Executive Summary", report.executiveSummary],
        ["Key Findings", report.keyFindings],
        ["Analysis", report.analysis],
        ["Counterpoints & Alternative Perspectives", report.counterpoints],
        ["Conclusion", report.conclusion],
        ["Sources", report.sources],
      ];

      for (const [title, content] of sections) {
        if (!content) continue;
        if (y > 240) { doc.addPage(); y = margin; }
        addText(title, 13, true, [0, 150, 200]);
        addText(content, 10, false, [60, 80, 100]);
        y += 4;
      }

      doc.save(`researchmind-${query.slice(0, 30).replace(/\s+/g, "-")}.pdf`);
    } finally {
      setExporting(null);
    }
  }

  async function exportWord() {
    if (!report) return;
    setExporting("word");
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import("docx");

      const sections = [
        ["Executive Summary", report.executiveSummary],
        ["Key Findings", report.keyFindings],
        ["Analysis", report.analysis],
        ["Counterpoints & Alternative Perspectives", report.counterpoints],
        ["Conclusion", report.conclusion],
        ["Sources", report.sources],
      ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const children: any[] = [
        new Paragraph({
          text: "ResearchMind AI — Research Report",
          heading: HeadingLevel.TITLE,
        }),
        new Paragraph({
          children: [new TextRun({ text: query, bold: true })],
        }),
        new Paragraph({
          children: [new TextRun({ text: `Generated: ${new Date().toLocaleDateString()}`, color: "888888" })],
        }),
        new Paragraph({ text: "" }),
      ];

      for (const [title, content] of sections) {
        if (!content) continue;
        children.push(
          new Paragraph({ text: title, heading: HeadingLevel.HEADING_1 }),
          ...content.split("\n").filter((l) => l.trim()).map(
            (line) => new Paragraph({ children: [new TextRun(line)] })
          ),
          new Paragraph({ text: "" })
        );
      }

      const doc = new Document({ sections: [{ children }] });
      const buffer = await Packer.toBlob(doc);
      const url = URL.createObjectURL(buffer);
      const a = document.createElement("a");
      a.href = url;
      a.download = `researchmind-${query.slice(0, 30).replace(/\s+/g, "-")}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(null);
    }
  }

  if (!report) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "var(--bg-base)" }}>
        <div style={{ color: "var(--text-muted)", fontFamily: "'Space Mono', monospace", fontSize: "0.8rem" }}>
          Loading report<span className="animate-blink">...</span>
        </div>
      </div>
    );
  }

  if (!report.raw) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4" style={{ background: "var(--bg-base)" }}>
        <div style={{ color: "#ef4444", fontSize: "2rem" }}>✗</div>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)" }}>
          No report data found
        </div>
        <div style={{ color: "var(--text-muted)", fontFamily: "'Space Mono', monospace", fontSize: "0.75rem", textAlign: "center", maxWidth: "420px", lineHeight: "1.7" }}>
          The research pipeline did not produce output — this usually means the API key is missing or invalid. Check your <code style={{ color: "var(--cyan)" }}>ANTHROPIC_API_KEY</code> in <code style={{ color: "var(--cyan)" }}>.env.local</code> and try again.
        </div>
        <button className="btn-primary px-6 py-2 rounded text-sm" onClick={() => router.push("/")} style={{ fontSize: "0.8rem" }}>
          ← Back to Home
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      {/* Top bar */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: "var(--border)", background: "rgba(10,15,30,0.95)", backdropFilter: "blur(8px)" }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="text-sm transition-colors"
            style={{ color: "var(--text-muted)", fontFamily: "'Space Mono', monospace", fontSize: "0.75rem" }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "var(--cyan)")}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "var(--text-muted)")}
          >
            ← New Research
          </button>
          <div
            className="flex items-center gap-2 px-2 py-1 rounded"
            style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)" }}
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#22c55e" }} />
            <span style={{ color: "#22c55e", fontSize: "0.6rem", fontFamily: "'Space Mono', monospace" }}>
              Report Ready
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="btn-ghost px-4 py-2 rounded text-sm flex items-center gap-2"
            onClick={exportWord}
            disabled={!!exporting}
            style={{ fontSize: "0.75rem" }}
          >
            {exporting === "word" ? "Exporting..." : "↓ Word"}
          </button>
          <button
            className="btn-secondary px-4 py-2 rounded text-sm flex items-center gap-2"
            onClick={exportPDF}
            disabled={!!exporting}
            style={{ fontSize: "0.75rem" }}
          >
            {exporting === "pdf" ? "Exporting..." : "↓ PDF"}
          </button>
        </div>
      </div>

      {/* Report content */}
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Report header */}
        <div className="mb-10 pb-6 border-b" style={{ borderColor: "var(--border)" }}>
          <div
            className="text-xs mb-3 tracking-widest uppercase"
            style={{ color: "var(--text-muted)", fontFamily: "'Space Mono', monospace" }}
          >
            ResearchMind AI · Research Report
          </div>
          <h1
            className="text-3xl font-extrabold mb-3 leading-tight"
            style={{ fontFamily: "'Syne', sans-serif", color: "var(--text-primary)" }}
          >
            {query}
          </h1>
          <div className="flex flex-wrap items-center gap-4">
            <span style={{ color: "var(--text-muted)", fontSize: "0.7rem", fontFamily: "'Space Mono', monospace" }}>
              {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </span>
            {["Scout", "Analyst", "Critic", "Writer"].map((agent, i) => {
              const colors = ["#00d4ff", "#7c6fff", "#f59e0b", "#22c55e"];
              return (
                <span
                  key={agent}
                  className="px-2 py-0.5 rounded text-xs"
                  style={{
                    background: `${colors[i]}22`,
                    border: `1px solid ${colors[i]}44`,
                    color: colors[i],
                    fontFamily: "'Space Mono', monospace",
                    fontSize: "0.6rem",
                  }}
                >
                  {agent}
                </span>
              );
            })}
          </div>
        </div>

        {/* Sections */}
        <div className="report-body">
          <ReportSection title="Executive Summary" content={report.executiveSummary} color="var(--cyan)" />
          <ReportSection title="Key Findings" content={report.keyFindings} color="#7c6fff" />
          <ReportSection title="Analysis" content={report.analysis} color="var(--text-primary)" />
          <ReportSection title="Counterpoints & Alternative Perspectives" content={report.counterpoints} color="#f59e0b" />
          <ReportSection title="Conclusion" content={report.conclusion} color="#22c55e" />
          <ReportSection title="Sources" content={report.sources} color="var(--text-muted)" />
        </div>

        {/* Raw output fallback */}
        {!report.executiveSummary && !report.keyFindings && (
          <div className="stream-content" style={{ opacity: 0.85 }}>
            {report.raw}
          </div>
        )}

        {/* Actions */}
        <div className="mt-12 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderColor: "var(--border)" }}>
          <div style={{ color: "var(--text-muted)", fontSize: "0.65rem", fontFamily: "'Space Mono', monospace" }}>
            Generated by 4 Claude AI agents · ResearchMind AI
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-ghost px-4 py-2 rounded text-sm" onClick={exportWord} disabled={!!exporting} style={{ fontSize: "0.75rem" }}>
              {exporting === "word" ? "..." : "Export as Word"}
            </button>
            <button className="btn-secondary px-4 py-2 rounded text-sm" onClick={exportPDF} disabled={!!exporting} style={{ fontSize: "0.75rem" }}>
              {exporting === "pdf" ? "..." : "Export as PDF"}
            </button>
            <button className="btn-primary px-4 py-2 rounded text-sm" onClick={() => router.push("/")} style={{ fontSize: "0.75rem" }}>
              New Research
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <div style={{ color: "var(--text-muted)", fontFamily: "'Space Mono', monospace", fontSize: "0.8rem" }}>
          Loading<span className="animate-blink">...</span>
        </div>
      </div>
    }>
      <ReportView />
    </Suspense>
  );
}
