import { NextRequest, NextResponse } from "next/server";
import { getTaskById, updateTask, deleteTask } from "@/lib/db";
import { broadcast } from "@/lib/sse";
import { now } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const task = getTaskById(id);
  if (!task) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(task);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();

  // Approval timestamps
  if (body.status === "approved" && !body.approved_at) body.approved_at = now();
  if (body.status === "in_progress" && !body.started_at) body.started_at = now();
  if (body.status === "done" && !body.completed_at) body.completed_at = now();

  const task = updateTask(id, body);
  if (!task) return NextResponse.json({ error: "not found" }, { status: 404 });
  broadcast("task_updated", task);
  return NextResponse.json(task);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const ok = deleteTask(id);
  if (!ok) return NextResponse.json({ error: "not found" }, { status: 404 });
  broadcast("task_deleted", { id });
  return NextResponse.json({ ok: true });
}
