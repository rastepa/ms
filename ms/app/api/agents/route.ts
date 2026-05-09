import { NextRequest, NextResponse } from "next/server";
import { getAllAgents, createAgent } from "@/lib/db";
import { broadcast } from "@/lib/sse";

export async function GET() {
  return NextResponse.json(getAllAgents());
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  if (!data.name || !data.role || !data.model) {
    return NextResponse.json({ error: "name, role, and model are required" }, { status: 400 });
  }
  const agent = createAgent(data);
  broadcast("agent_created", agent);
  return NextResponse.json(agent, { status: 201 });
}
