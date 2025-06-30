import { NextRequest, NextResponse } from "next/server";
import { addInventoryItem } from "../../../lib/data";
import type { InventoryItem } from "../../../lib/types";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // Validar el payload mínimamente si quieres
    if (!data?.name) {
      return NextResponse.json({ error: "Missing name field" }, { status: 400 });
    }

    const newItem = await addInventoryItem(data);
    return NextResponse.json(newItem);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
