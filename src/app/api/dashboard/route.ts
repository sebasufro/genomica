import { NextResponse } from "next/server";
import {
  getInventoryItems,
  getLowStockItems,
  getNearingExpirationItems,
  getRecentlyUsedItems,
  getTotalItemsCount,
  getTotalReagentsCount,
  getAllItemsUsageData,
} from "@/lib/data";

export async function GET() {
  try {
    const inventory = await getInventoryItems();

    const [
      totalItemsCount,
      totalReagentsCount,
      lowStockItems,
      nearingExpirationItems,
      recentlyUsedItems,
    ] = await Promise.all([
      getTotalItemsCount(inventory),
      getTotalReagentsCount(inventory),
      getLowStockItems(inventory),
      getNearingExpirationItems(inventory, 30),
      getRecentlyUsedItems(inventory, 7),
    ]);

    const allItemsUsageData = await getAllItemsUsageData();

    const stats = {
      totalItems: totalItemsCount,
      totalReagents: totalReagentsCount,
      lowStock: lowStockItems,
      nearingExpiration: nearingExpirationItems,
      recentlyUsed: recentlyUsedItems,
    };

    return NextResponse.json({ stats,  allItemsUsageData });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
