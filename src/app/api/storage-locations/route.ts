import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const storageLocations = await db
      .collection("inventory")
      .distinct("storageLocation.type");

    return NextResponse.json(storageLocations, { status: 200 });
  } catch (error) {
    console.error("Error fetching storage locations:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
