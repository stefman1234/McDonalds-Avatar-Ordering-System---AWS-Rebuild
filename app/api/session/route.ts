import { NextResponse } from "next/server";
import { createSession } from "@/lib/cache/sessionStore";

export async function POST() {
  try {
    const session = createSession();
    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error("Session creation error:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
