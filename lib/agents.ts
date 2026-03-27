import { AgentState } from "@/app/types";

export const INITIAL_AGENTS: AgentState[] = [
  {
    id: "scout",
    name: "Scout",
    role: "Web Intelligence",
    description: "Searches the live web for raw data, sources, and primary findings.",
    icon: "⬡",
    status: "idle",
    output: "",
  },
  {
    id: "analyst",
    name: "Analyst",
    role: "Pattern Recognition",
    description: "Identifies trends, data points, and knowledge gaps from Scout's findings.",
    icon: "◈",
    status: "idle",
    output: "",
  },
  {
    id: "critic",
    name: "Critic",
    role: "Adversarial Review",
    description: "Challenges weak assumptions, flags unreliable sources, adds counterarguments.",
    icon: "◇",
    status: "idle",
    output: "",
  },
  {
    id: "writer",
    name: "Writer",
    role: "Report Synthesis",
    description: "Synthesizes all findings into a clean, professional research report.",
    icon: "◉",
    status: "idle",
    output: "",
  },
];

export const AGENT_COLORS: Record<string, string> = {
  scout: "#00d4ff",
  analyst: "#7c6fff",
  critic: "#f59e0b",
  writer: "#22c55e",
};

export const AGENT_ORDER: string[] = ["scout", "analyst", "critic", "writer"];
