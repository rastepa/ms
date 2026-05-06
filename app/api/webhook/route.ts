import { NextRequest, NextResponse } from "next/server";
import { createTask, updateTask, deleteTask, getTaskById } from "@/lib/db";
import { broadcast } from "@/lib/sse";
import { buildPolicy } from "@/lib/policy";
import { now } from "@/lib/utils";
import type { AgentName } from "@/lib/policy";

// Agent-facing webhook. Actions: create | upsert | update | delete | approve | complete
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, task: payload, agent } = body;

  if (!action) return NextResponse.json({ error: "action required" }, { status: 400 });

  let result;

  if (action === "create" || (action === "upsert" && !payload?.id)) {
    if (!payload?.title) return NextResponse.json({ error: "title required" }, { status: 400 });
    const policy = agent ? JSON.stringify(buildPolicy(agent as AgentName, payload.title, payload.priority)) : null;
    result = createTask({ ...payload, source: "agent", policy });
    broadcast("task_created", result);
  } else if (action === "upsert" || action === "update") {
    const existing = getTaskById(payload.id);
    if (!existing) return NextResponse.json({ error: "task not found" }, { status: 404 });
    result = updateTask(payload.id, { ...payload, updated_at: now() });
    broadcast("task_updated", result);
  } else if (action === "approve") {
    result = updateTask(payload.id, { status: "approved", approved_at: now() });
    broadcast("task_updated", result);
  } else if (action === "complete") {
    result = updateTask(payload.id, { status: "done", completed_at: now() });
    broadcast("task_updated", result);
  } else if (action === "delete") {
    deleteTask(payload.id);
    broadcast("task_deleted", { id: payload.id });
    return NextResponse.json({ ok: true });
  } else {
    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  }

  return NextResponse.json(result);
}
