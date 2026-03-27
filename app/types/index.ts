export type AgentStatus = "idle" | "active" | "done" | "error";

export type AgentId = "scout" | "analyst" | "critic" | "writer";

export interface AgentState {
  id: AgentId;
  name: string;
  role: string;
  description: string;
  icon: string;
  status: AgentStatus;
  output: string;
  startTime?: number;
  endTime?: number;
}

export interface ResearchSession {
  query: string;
  agents: AgentState[];
  currentAgent: AgentId | null;
  isComplete: boolean;
  startTime: number;
}

export interface ReportSection {
  title: string;
  content: string;
}

export interface ParsedReport {
  executiveSummary: string;
  keyFindings: string;
  analysis: string;
  counterpoints: string;
  conclusion: string;
  sources: string;
  raw: string;
}
