import { NextRequest, NextResponse } from "next/server";
import { getToolById, updateTool } from "@/lib/db";
import { broadcast } from "@/lib/sse";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const tool = getToolById(id);
  if (!tool) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(tool);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const tool = updateTool(id, body);
  if (!tool) return NextResponse.json({ error: "not found" }, { status: 404 });
  broadcast("tool_updated", tool);
  return NextResponse.json(tool);
}
