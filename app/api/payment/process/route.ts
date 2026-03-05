import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { orderId, amount, method } = await request.json();

    if (!orderId || !amount) {
      return NextResponse.json(
        { error: "orderId and amount are required" },
        { status: 400 }
      );
    }

    // Simulate payment processing delay
    await new Promise((r) => setTimeout(r, 1000 + Math.random() * 1000));

    // Mock: 95% success rate
    const success = Math.random() > 0.05;

    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    if (success) {
      return NextResponse.json({
        paymentId,
        status: "completed",
        orderId,
        amount,
        method: method || "card",
        processedAt: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        {
          paymentId,
          status: "failed",
          orderId,
          amount,
          method: method || "card",
          error: "Payment declined. Please try again.",
        },
        { status: 402 }
      );
    }
  } catch (error) {
    console.error("Payment processing error:", error);
    return NextResponse.json(
      { error: "Payment processing failed" },
      { status: 500 }
    );
  }
}
