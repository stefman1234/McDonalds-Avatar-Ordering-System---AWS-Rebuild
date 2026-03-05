import { NextRequest, NextResponse } from "next/server";
import { checkMealConversion, getComboDefaults } from "@/lib/mealConversion";

export async function POST(request: NextRequest) {
  try {
    const { menuItemId } = await request.json();

    if (!menuItemId || typeof menuItemId !== "number") {
      return NextResponse.json(
        { error: "menuItemId is required" },
        { status: 400 }
      );
    }

    const combo = await checkMealConversion(menuItemId);
    if (!combo) {
      return NextResponse.json({ combo: null });
    }

    const defaults = await getComboDefaults(combo);

    return NextResponse.json({ combo, defaults });
  } catch (error) {
    console.error("Meal conversion check error:", error);
    return NextResponse.json(
      { error: "Failed to check meal conversion" },
      { status: 500 }
    );
  }
}
