import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const storageLocationTypes = await db
      .collection("storageTypes")
      .distinct("type");
    const storageLocationNames = await db
      .collection("storageNames")
      .distinct("name");

    return NextResponse.json(
      {
        storageLocationTypes,
        storageLocationNames,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching storage options:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
