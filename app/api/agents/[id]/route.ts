import { NextRequest, NextResponse } from "next/server";
import { getAgentById, updateAgentStatus } from "@/lib/db";
import { broadcast } from "@/lib/sse";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const agent = getAgentById(id);
  if (!agent) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(agent);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { status } = await req.json();
  updateAgentStatus(id, status);
  const agent = getAgentById(id);
  broadcast("agent_updated", agent);
  return NextResponse.json(agent);
}
