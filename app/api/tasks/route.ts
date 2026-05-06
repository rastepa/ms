import { NextRequest, NextResponse } from "next/server";
import { getAllTasks, createTask } from "@/lib/db";
import { broadcast } from "@/lib/sse";
import { now } from "@/lib/utils";

export async function GET() {
  return NextResponse.json(getAllTasks());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.title) return NextResponse.json({ error: "title required" }, { status: 400 });
  const task = createTask(body);
  broadcast("task_created", task);
  return NextResponse.json(task, { status: 201 });
}
