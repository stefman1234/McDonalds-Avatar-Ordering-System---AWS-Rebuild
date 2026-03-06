import { NextResponse } from "next/server";
import { getCachedCategories } from "@/lib/cache/menuCache";

export async function GET() {
  try {
    const categories = await getCachedCategories();
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Failed to fetch menu:", error);
    // Return empty array so the client doesn't crash on .flatMap()
    return NextResponse.json([]);
  }
}
