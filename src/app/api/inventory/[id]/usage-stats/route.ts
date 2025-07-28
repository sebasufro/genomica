import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const id = params.id;
  const { db } = await connectToDatabase();
  
  const stats = await db.collection("usageHistory").aggregate([
    { $match: { itemId: id } },
    {
      $group: {
        _id: null,
        totalUsed: { $sum: "$quantityUsed" },
        usageCount: { $sum: 1 }
      }
    }
  ]).toArray();

  return NextResponse.json(stats[0] || { totalUsed: 0, usageCount: 0 });
}