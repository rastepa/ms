export type AgentName = "John" | "Ringo" | "Paul";
export type ModelId = "claude-opus-4-7" | "claude-sonnet-4-6" | "claude-haiku-4-5-20251001";

export interface ExecutionPolicy {
  agent: AgentName;
  model: ModelId;
  task: string;
  priority: "low" | "medium" | "high" | "critical";
}

// Model routing — enforced per agent, never overridable
export const AGENT_MODEL_MAP: Record<AgentName, ModelId> = {
  John: "claude-opus-4-7",   // Coder: most capable
  Ringo: "claude-sonnet-4-6", // Researcher: balanced
  Paul: "claude-sonnet-4-6",  // Librarian: balanced + cron
};

export function buildPolicy(
  agent: AgentName,
  task: string,
  priority: ExecutionPolicy["priority"] = "medium"
): ExecutionPolicy {
  return {
    agent,
    model: AGENT_MODEL_MAP[agent],
    task,
    priority,
  };
}
