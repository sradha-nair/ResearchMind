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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
          Loading<span className="animate-blink">...</span>
        </div>
      </div>
    );
  }

  if (!report.raw) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 px-4" style={{ background: "var(--bg-base)" }}>
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: "#fef2f2", border: "1px solid #fecaca" }}
        >
          <span style={{ color: "var(--status-error)", fontSize: "1.2rem" }}>✗</span>
        </div>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>
          No report data found
        </div>
        <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center", maxWidth: "400px", lineHeight: "1.7" }}>
          The research pipeline did not produce output. Check that your{" "}
          <code style={{ color: "var(--sage)", background: "var(--sage-dim)", padding: "1px 5px", borderRadius: "4px" }}>ANTHROPIC_API_KEY</code>{" "}
          is set in your Vercel environment variables.
        </div>
        <button className="btn-primary px-5 py-2.5 rounded-lg text-sm" onClick={() => router.push("/")}>
          ← Back to Home
        </button>
      </div>
    );
  }

  const agentTags = [
    { label: "Scout", color: "var(--agent-scout)", bg: "#edf4f1", border: "#c4ddd6" },
    { label: "Analyst", color: "var(--agent-analyst)", bg: "#f1f4ed", border: "#d0d9c4" },
    { label: "Critic", color: "var(--agent-critic)", bg: "#f6f2ed", border: "#ddd0c0" },
    { label: "Writer", color: "var(--agent-writer)", bg: "#edf1f6", border: "#c0cedd" },
  ];

  return (
    <main className="min-h-screen" style={{ background: "var(--bg-base)" }}>
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
            onClick={() => router.push("/")}
            className="text-sm"
            style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "var(--sage)")}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "var(--text-muted)")}
          >
            ← New Research
          </button>
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ background: "var(--sage-dim)", border: "1px solid var(--sage-pale)" }}
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--status-done)" }} />
            <span style={{ color: "var(--sage)", fontSize: "0.65rem", fontWeight: 600 }}>Report Ready</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="btn-ghost px-4 py-2 rounded-lg text-sm" onClick={exportWord} disabled={!!exporting} style={{ fontSize: "0.78rem" }}>
            {exporting === "word" ? "Exporting..." : "↓ Word"}
          </button>
          <button className="btn-secondary px-4 py-2 rounded-lg text-sm" onClick={exportPDF} disabled={!!exporting} style={{ fontSize: "0.78rem" }}>
            {exporting === "pdf" ? "Exporting..." : "↓ PDF"}
          </button>
        </div>
      </div>

      {/* Report */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10 pb-8 border-b" style={{ borderColor: "var(--border)" }}>
          <div
            className="text-xs mb-4 font-semibold tracking-widest uppercase"
            style={{ color: "var(--text-faint)", letterSpacing: "0.12em" }}
          >
            ResearchMind AI · Research Report
          </div>
          <h1
            className="text-3xl font-extrabold mb-4 leading-tight"
            style={{ fontFamily: "'Syne', sans-serif", color: "var(--text-primary)", letterSpacing: "-0.02em" }}
          >
            {query}
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <span style={{ color: "var(--text-faint)", fontSize: "0.78rem" }}>
              {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </span>
            {agentTags.map((t) => (
              <span
                key={t.label}
                className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                style={{ background: t.bg, border: `1px solid ${t.border}`, color: t.color, fontSize: "0.68rem" }}
              >
                {t.label}
              </span>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div className="report-body">
          <ReportSection title="Executive Summary" content={report.executiveSummary} color="var(--sage)" />
          <ReportSection title="Key Findings" content={report.keyFindings} color="var(--agent-analyst)" />
          <ReportSection title="Analysis" content={report.analysis} color="var(--text-secondary)" />
          <ReportSection title="Counterpoints & Alternative Perspectives" content={report.counterpoints} color="var(--agent-critic)" />
          <ReportSection title="Conclusion" content={report.conclusion} color="var(--agent-writer)" />
          <ReportSection title="Sources" content={report.sources} color="var(--text-muted)" />
        </div>

        {!report.executiveSummary && !report.keyFindings && (
          <div className="stream-content">{report.raw}</div>
        )}

        {/* Footer actions */}
        <div
          className="mt-12 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderColor: "var(--border)" }}
        >
          <div style={{ color: "var(--text-faint)", fontSize: "0.72rem" }}>
            Generated by 4 Claude AI agents · ResearchMind AI
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-ghost px-4 py-2 rounded-lg text-sm" onClick={exportWord} disabled={!!exporting} style={{ fontSize: "0.78rem" }}>
              {exporting === "word" ? "..." : "Export as Word"}
            </button>
            <button className="btn-secondary px-4 py-2 rounded-lg text-sm" onClick={exportPDF} disabled={!!exporting} style={{ fontSize: "0.78rem" }}>
              {exporting === "pdf" ? "..." : "Export as PDF"}
            </button>
            <button className="btn-primary px-4 py-2 rounded-lg text-sm" onClick={() => router.push("/")}>
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
        <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
          Loading<span className="animate-blink">...</span>
        </div>
      </div>
    }>
      <ReportView />
    </Suspense>
  );
}
