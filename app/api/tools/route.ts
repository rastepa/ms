import { NextResponse } from "next/server";
import { getAllTools } from "@/lib/db";

export async function GET() {
  return NextResponse.json(getAllTools());
}
