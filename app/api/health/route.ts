import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "healthy", db: "connected" });
  } catch {
    return NextResponse.json(
      { status: "unhealthy", db: "disconnected" },
      { status: 503 }
    );
  }
}
