import { NextResponse } from "next/server";
import { getAllAgents } from "@/lib/db";

export async function GET() {
  return NextResponse.json(getAllAgents());
}
