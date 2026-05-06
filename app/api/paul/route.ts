import { NextResponse } from "next/server";
import { getAllTasks, getAllAgents, getAllProjects, updateAgentStatus } from "@/lib/db";
import { broadcast } from "@/lib/sse";

// Paul's hourly sync endpoint — called by the cron scheduler
// Returns a state snapshot and resets stale in_progress tasks
export async function POST() {
  const tasks = getAllTasks();
  const agents = getAllAgents();
  const projects = getAllProjects();

  // Mark agents idle if they have no in_progress tasks
  for (const agent of agents) {
    const busy = tasks.some((t) => t.agent_id === agent.id && t.status === "in_progress");
    if (!busy && agent.status === "working") {
      updateAgentStatus(agent.id, "idle");
    }
  }

  const summary = {
    tasks: { total: tasks.length, pending: 0, approved: 0, in_progress: 0, done: 0, rejected: 0 },
    projects: { total: projects.length, active: 0, completed: 0 },
    agents: agents.map((a) => ({ name: a.name, status: a.status })),
    synced_at: new Date().toISOString(),
  };

  for (const t of tasks) summary.tasks[t.status as keyof typeof summary.tasks]++;
  for (const p of projects) {
    if (p.status === "active") summary.projects.active++;
    if (p.status === "completed") summary.projects.completed++;
  }

  broadcast("paul_sync", summary);

  return NextResponse.json(summary);
}
