import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const menuItemId = parseInt(id, 10);
    if (isNaN(menuItemId)) {
      return NextResponse.json([], { status: 400 });
    }

    const customizations = await prisma.customization.findMany({
      where: { menuItemId },
      select: { id: true, name: true, priceExtra: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(
      customizations.map((c) => ({
        id: c.id,
        name: c.name,
        priceExtra: Number(c.priceExtra),
      }))
    );
  } catch (error) {
    console.error("Failed to fetch customizations:", error);
    return NextResponse.json([]);
  }
}
