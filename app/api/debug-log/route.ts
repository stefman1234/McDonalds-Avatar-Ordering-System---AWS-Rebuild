import { NextRequest, NextResponse } from "next/server";
import { appendFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

const LOG_FILE = join(process.cwd(), "conversation-debug.log");

export async function POST(request: NextRequest) {
  try {
    const { event, data } = await request.json();
    const timestamp = new Date().toISOString().slice(11, 19);
    const line = `[${timestamp}] ${event}: ${typeof data === "string" ? data : JSON.stringify(data)}\n`;
    appendFileSync(LOG_FILE, line);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}

export async function GET() {
  try {
    if (!existsSync(LOG_FILE)) return NextResponse.json({ lines: [] });
    const content = readFileSync(LOG_FILE, "utf-8");
    const lines = content.split("\n").filter(Boolean).slice(-50);
    return NextResponse.json({ lines });
  } catch {
    return NextResponse.json({ lines: [] });
  }
}

export async function DELETE() {
  try {
    const { writeFileSync } = require("fs");
    writeFileSync(LOG_FILE, "");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
