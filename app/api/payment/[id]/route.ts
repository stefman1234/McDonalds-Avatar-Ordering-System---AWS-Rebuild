import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Mock payment status lookup
  return NextResponse.json({
    paymentId: id,
    status: "completed",
    processedAt: new Date().toISOString(),
  });
}
