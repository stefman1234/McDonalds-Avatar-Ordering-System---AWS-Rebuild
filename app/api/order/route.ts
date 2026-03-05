import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const TAX_RATE = 0.0825; // 8.25%

export async function POST(request: NextRequest) {
  try {
    const { items, orderType } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Order must contain at least one item" },
        { status: 400 }
      );
    }

    const subtotal = items.reduce(
      (sum: number, item: { unitPrice: number; quantity: number }) =>
        sum + item.unitPrice * item.quantity,
      0
    );

    const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;

    const order = await prisma.order.create({
      data: {
        total,
        status: "CONFIRMED",
        orderType: orderType || "dine_in",
        subtotal,
        tax,
        items: {
          create: items.map(
            (item: {
              menuItemId: number;
              quantity: number;
              unitPrice: number;
              customizations?: string[];
            }) => ({
              menuItemId: item.menuItemId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              customizations: item.customizations?.join(", ") ?? null,
            })
          ),
        },
      },
      include: { items: { include: { menuItem: true } } },
    });

    return NextResponse.json({
      orderId: order.id,
      status: order.status,
      orderType: order.orderType,
      subtotal: Number(order.subtotal),
      tax: Number(order.tax),
      total: Number(order.total),
      items: order.items.map((oi) => ({
        name: oi.menuItem.name,
        quantity: oi.quantity,
        unitPrice: Number(oi.unitPrice),
        customizations: oi.customizations,
      })),
    });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
