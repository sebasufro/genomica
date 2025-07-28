import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET(
  request: NextRequest
) {
  try {
    const { db } = await connectToDatabase();
    const id = request.nextUrl.pathname.split("/").pop() as string;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const item = await db
      .collection("inventory")
      .findOne({ _id: new ObjectId(id) });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    type UsageHistoryEntry = {
      date?: Date | string;
      quantityUsed: number;
      notes?: string;
      userId?: string | ObjectId;
      [key: string]: unknown;
    };

    const usageHistory = (item.usageHistory || []).map((entry: UsageHistoryEntry) => ({
      ...entry,
      date: entry.date ? new Date(entry.date).toISOString() : undefined,
      userId: entry.userId ? entry.userId.toString() : undefined,
    }));
    item.usageHistory = usageHistory;
    return NextResponse.json(item.usageHistory, { status: 200 });
  } catch (error) {
    console.error("Error fetching item history:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
