import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const combos = await prisma.comboMeal.findMany({
      where: { available: true },
      include: {
        mainItem: true,
        aliases: true,
      },
      orderBy: { popular: "desc" },
    });

    const result = combos.map((combo) => ({
      id: combo.id,
      name: combo.name,
      description: combo.description,
      basePrice: Number(combo.basePrice),
      discount: Number(combo.discount),
      mainItem: combo.mainItem.name,
      mainItemId: combo.mainItemId,
      defaultSideId: combo.defaultSideId,
      defaultDrinkId: combo.defaultDrinkId,
      available: combo.available,
      popular: combo.popular,
      aliases: combo.aliases.map((a) => a.alias),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch combos:", error);
    return NextResponse.json(
      { error: "Failed to fetch combos" },
      { status: 500 }
    );
  }
}
