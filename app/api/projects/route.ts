import { NextRequest, NextResponse } from "next/server";
import { getAllProjects, createProject } from "@/lib/db";
import { broadcast } from "@/lib/sse";

export async function GET() {
  return NextResponse.json(getAllProjects());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.name) return NextResponse.json({ error: "name required" }, { status: 400 });
  const project = createProject(body);
  broadcast("project_created", project);
  return NextResponse.json(project, { status: 201 });
}
