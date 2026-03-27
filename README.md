# ResearchMind AI

A multi-agent research intelligence platform where four specialized Claude AI agents collaborate in real time to research any topic from scratch and deliver a polished, professional report. Think of it as watching a team of AI research associates work live — one searching the web, one analyzing findings, one stress-testing the analysis, and one writing the final report.

## What it does

You type a research question. Four agents fire up in sequence:

1. **Scout** — Searches the live web using Claude's built-in web search tool. Pulls sources, summarizes findings, extracts data points and statistics.

2. **Analyst** — Takes Scout's raw findings and makes sense of them. Identifies trends, thematic clusters, knowledge gaps, and preliminary insights.

3. **Critic** — Challenges the Analyst's work. Flags weak assumptions, evaluates source reliability, adds counterarguments and missing perspectives.

4. **Writer** — Synthesizes everything into a clean research report with an Executive Summary, Key Findings, Analysis, Counterpoints, Conclusion, and Sources.

Each agent streams its output live so you can watch the research unfold in real time.

## Tech stack

- **Frontend**: Next.js 14+ with App Router, Tailwind CSS v4
- **AI**: Anthropic Claude (claude-sonnet-4-20250514) with streaming
- **Web Search**: `web_search_20250305` tool on the Scout agent
- **Export**: jsPDF for PDF, docx library for Word documents
- **Fonts**: Syne (headings), Space Mono (body/terminal)

## Getting started

### 1. Clone and install

```bash
git clone <repo-url>
cd ResearchMind
npm install
```

### 2. Set up environment

```bash
cp .env.example .env.local
```

Open `.env.local` and add your Anthropic API key:

```
ANTHROPIC_API_KEY=your_key_here
```

Get an API key at [console.anthropic.com](https://console.anthropic.com).

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
app/
  page.tsx              # Landing page with query input
  research/page.tsx     # Live dashboard showing all 4 agents streaming
  report/page.tsx       # Final report with PDF/Word export
  components/
    AgentPanel.tsx      # Individual agent terminal panel
    FlowConnector.tsx   # Visual connector between agents
  api/research/route.ts # Streaming API route for all agents
  types/index.ts        # TypeScript interfaces
lib/
  agents.ts             # Agent config and metadata
```

## Deploying to Vercel

1. Push this repo to GitHub
2. Import it on [vercel.com](https://vercel.com)
3. Add `ANTHROPIC_API_KEY` as an environment variable in your Vercel project settings
4. Deploy

The app is built to run on Vercel's edge-compatible streaming infrastructure out of the box.

## Notes

- Each research session makes 4 separate Claude API calls, one per agent. The Scout agent call enables web search. The Writer agent gets a higher token limit (4096) since it synthesizes all prior output.
- Agent outputs are passed sequentially — each agent receives the full output of all previous agents as context.
- Report data is stored in `sessionStorage` between the dashboard and report pages, so no backend persistence is needed.
- The web search tool requires that your Anthropic account has access to `web_search_20250305`. This is available on claude-sonnet-4-20250514.
