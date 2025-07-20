import { NextResponse } from "next/server";
import { getInventoryItems } from "@/lib/data";

export async function GET() {
  try {
    const items = await getInventoryItems();
    return NextResponse.json(items);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
