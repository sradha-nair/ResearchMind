import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

// Increase Vercel function timeout — web search + Claude generation can take 60-120s
export const maxDuration = 300;

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SCOUT_SYSTEM = `You are Scout, a web intelligence agent on a multi-agent research team. Your job is to search the web for current, accurate information about the given research topic.

Use the web search tool to find real sources. Search multiple times with different queries to get broad coverage. For each source you find, extract:
- The source URL
- A concise summary of what it says (2-4 sentences)
- Key data points, statistics, or quotes
- Publication date if available

Structure your output clearly with a numbered list of findings. End with a "Raw Data Summary" section that consolidates the most important facts you found.

Be thorough. Prioritize recent sources from 2024-2025. Flag any sources that seem biased or low quality.`;

const ANALYST_SYSTEM = `You are Analyst, a pattern recognition agent on a multi-agent research team. You receive structured findings from the Scout agent and your job is to make sense of them.

Analyze the provided findings and produce:

## Key Trends
Identify 3-5 major trends or patterns across the sources.

## Critical Data Points
Highlight the most important statistics, figures, and concrete evidence.

## Thematic Clusters
Group findings into 2-4 thematic areas with brief explanations.

## Knowledge Gaps
Identify what is still unknown, contested, or underexplored based on what Scout found.

## Preliminary Insights
Offer 3-5 analytical insights that go beyond surface-level observation.

Be precise and structured. Do not just summarize — synthesize and interpret.`;

const CRITIC_SYSTEM = `You are Critic, an adversarial review agent on a multi-agent research team. You receive the Analyst's structured analysis and your job is to stress-test it.

Produce:

## Source Reliability Assessment
Evaluate the quality and potential bias of the sources referenced.

## Weak Assumptions
Identify 3-5 assumptions in the analysis that may not hold up under scrutiny.

## Counterarguments
Provide 3-4 strong counterarguments or alternative perspectives to the main claims.

## Missing Perspectives
What viewpoints, demographics, or disciplines are missing from this analysis?

## Refined Insights
Based on your critique, offer 2-3 refined, more nuanced insights that survive scrutiny.

Be direct, even uncomfortable. Good research is stress-tested research.`;

const WRITER_SYSTEM = `You are Writer, a research synthesis agent on a multi-agent research team. You receive outputs from Scout, Analyst, and Critic agents and your job is to synthesize them into a polished, professional research report.

Produce a complete research report with these exact sections (use these exact headings):

## Executive Summary
A 2-3 paragraph high-level summary of the research topic, main findings, and significance. Written for a senior executive or decision-maker.

## Key Findings
A structured list of the 5-7 most important, evidence-backed findings. Each finding should be 1-2 sentences.

## Analysis
4-6 paragraphs of substantive analysis covering the major themes, trends, and interpretations. This is the analytical core of the report.

## Counterpoints & Alternative Perspectives
2-3 paragraphs presenting credible counterarguments and alternative interpretations that add nuance.

## Conclusion
1-2 paragraphs summarizing the state of knowledge and the most actionable takeaway.

## Sources
A numbered list of URLs and source names referenced throughout this research.

Write in a professional, authoritative tone. Use clear paragraph structure. The report should feel like it came from a top-tier research firm.`;

type AgentType = "scout" | "analyst" | "critic" | "writer";

function getSystemPrompt(agent: AgentType): string {
  const prompts: Record<AgentType, string> = {
    scout: SCOUT_SYSTEM,
    analyst: ANALYST_SYSTEM,
    critic: CRITIC_SYSTEM,
    writer: WRITER_SYSTEM,
  };
  return prompts[agent];
}

function buildUserMessage(
  agent: AgentType,
  query: string,
  previousOutputs: Record<string, string>
): string {
  // Truncate previous outputs to avoid hitting context limits
  const truncate = (text: string, maxLen = 6000) =>
    text.length > maxLen ? text.slice(0, maxLen) + "\n\n[truncated for context window]" : text;

  switch (agent) {
    case "scout":
      return `Research topic: ${query}\n\nSearch the web extensively and compile all relevant findings.`;
    case "analyst":
      return `Research topic: ${query}\n\nScout Agent Findings:\n${truncate(previousOutputs.scout || "")}\n\nAnalyze these findings and produce your structured analysis.`;
    case "critic":
      return `Research topic: ${query}\n\nScout Agent Findings:\n${truncate(previousOutputs.scout || "", 3000)}\n\nAnalyst Agent Output:\n${truncate(previousOutputs.analyst || "")}\n\nCritique the analysis thoroughly.`;
    case "writer":
      return `Research topic: ${query}\n\nScout Agent Findings:\n${truncate(previousOutputs.scout || "", 2000)}\n\nAnalyst Agent Output:\n${truncate(previousOutputs.analyst || "", 2000)}\n\nCritic Agent Output:\n${truncate(previousOutputs.critic || "", 2000)}\n\nSynthesize all of the above into a complete, professional research report.`;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { agent, query, previousOutputs } = await req.json();

    if (!agent || !query) {
      return new Response(JSON.stringify({ error: "Missing agent or query" }), { status: 400 });
    }

    const systemPrompt = getSystemPrompt(agent as AgentType);
    const userMessage = buildUserMessage(agent as AgentType, query, previousOutputs || {});

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        const send = (data: object) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          // Build request — Scout gets web search, others don't
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const requestBody: any = {
            model: "claude-sonnet-4-6",
            max_tokens: agent === "writer" ? 4096 : 2048,
            system: systemPrompt,
            messages: [{ role: "user", content: userMessage }],
          };

          if (agent === "scout") {
            requestBody.tools = [{ type: "web_search_20250305", name: "web_search" }];
          }

          const stream = await client.messages.stream(requestBody);

          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta" &&
              event.delta.text
            ) {
              send({ type: "text", text: event.delta.text });
            }
          }

          // Confirm the message fully completed
          await stream.finalMessage();
          send({ type: "done" });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);

          // If web search failed (e.g. tool not available on this API tier),
          // retry without the tool so Scout still produces useful output
          if (agent === "scout" && message.toLowerCase().includes("tool")) {
            try {
              const fallbackStream = await client.messages.stream({
                model: "claude-sonnet-4-6",
                max_tokens: 2048,
                system: systemPrompt,
                messages: [{ role: "user", content: userMessage }],
              });

              for await (const event of fallbackStream) {
                if (
                  event.type === "content_block_delta" &&
                  event.delta.type === "text_delta" &&
                  event.delta.text
                ) {
                  send({ type: "text", text: event.delta.text });
                }
              }

              await fallbackStream.finalMessage();
              send({ type: "done" });
              return;
            } catch (fallbackErr) {
              send({
                type: "error",
                message: fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr),
              });
            }
          } else {
            send({ type: "error", message });
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMsg }), { status: 500 });
  }
}
