import type { InventoryItem, ReagentUsageDataPoint } from "./types";
import {
	format,
	addDays,
	subDays,
	eachDayOfInterval,
	parseISO,
	startOfDay,
	endOfDay,
} from "date-fns";
import { getDatabase } from "./mongodb";
import { ObjectId, WithId, Document } from "mongodb";

const today = new Date();
const INVENTORY_COLLECTION = "inventory";
const USAGE_HISTORY_COLLECTION = "usage_history"; // New collection for tracking usage

// Interface for usage history documents
// interface UsageHistoryDocument {
// 	itemId: ObjectId;
// 	itemName: string;
// 	quantityUsed: number;
// 	usedDate: Date;
// 	userId?: string; // Optional: track who used the item
// 	notes?: string; // Optional: additional notes
// }

const fromMongoDB = (doc: WithId<Document>): InventoryItem => {
	const convertDateToISO = (date: Date | string): string | undefined => {
		if (date instanceof Date) {
			return date.toISOString();
		}
		if (typeof date === "string") {
			try {
				parseISO(date);
				return date;
			} catch {
				return undefined;
			}
		}
		return undefined;
	};

	return {
		id: doc._id.toString(),
		name: doc.name,
		type: doc.type,
		category: doc.category,
		lotNumber: doc.lotNumber,
		provider: doc.provider,
		barcode: doc.barcode,
		quantity: doc.quantity,
		unit: doc.unit,
		storageLocation: doc.storageLocation,
		expirationDate: convertDateToISO(doc.expirationDate),
		temperature: doc.temperature,
		lastUsedDate: convertDateToISO(doc.lastUsedDate),
		addedDate: convertDateToISO(doc.addedDate) || new Date().toISOString(),
		lowStockThreshold: doc.lowStockThreshold,
		notes: doc.notes,
		imageUrl: doc.imageUrl,
	};
};

export async function getInventoryItems(): Promise<InventoryItem[]> {
	try {
		const db = await getDatabase();
		const collection = db.collection(INVENTORY_COLLECTION);
		const docs = await collection.find({}).sort({ addedDate: -1 }).toArray();
		return docs.map(fromMongoDB);
	} catch (error) {
		console.error("Error fetching inventory items:", error);
		throw error;
	}
}

export async function getInventoryItemById(
	id: string
): Promise<InventoryItem | undefined> {
	if (!id) return undefined;

	try {
		const db = await getDatabase();
		const collection = db.collection(INVENTORY_COLLECTION);
		const doc = await collection.findOne({ _id: new ObjectId(id) });

		if (doc) {
			return fromMongoDB(doc);
		}
		return undefined;
	} catch (error) {
		console.error("Error fetching inventory item by ID:", error);
		return undefined;
	}
}

export async function getTotalItemsCount(
	items?: InventoryItem[]
): Promise<number> {
	if (items) {
		return items.length;
	}

	try {
		const db = await getDatabase();
		const collection = db.collection(INVENTORY_COLLECTION);
		return await collection.countDocuments({});
	} catch (error) {
		console.error("Error getting total items count:", error);
		return 0;
	}
}

export async function getTotalReagentsCount(
	items?: InventoryItem[]
): Promise<number> {
	if (items) {
		return items.filter((item) => item.type === "Reagent").length;
	}

	try {
		const db = await getDatabase();
		const collection = db.collection(INVENTORY_COLLECTION);
		return await collection.countDocuments({ type: "Reagent" });
	} catch (error) {
		console.error("Error getting total reagents count:", error);
		return 0;
	}
}

export async function getLowStockItems(
	items?: InventoryItem[]
): Promise<InventoryItem[]> {
	if (items) {
		return items
			.filter((item) => item.quantity <= item.lowStockThreshold)
			.sort((a, b) => a.quantity - b.quantity);
	}

	try {
		const db = await getDatabase();
		const collection = db.collection(INVENTORY_COLLECTION);
		const docs = await collection
			.find({
				$expr: { $lte: ["$quantity", "$lowStockThreshold"] },
			})
			.sort({ quantity: 1 })
			.toArray();

		return docs.map(fromMongoDB);
	} catch (error) {
		console.error("Error getting low stock items:", error);
		return [];
	}
}

export async function getNearingExpirationItems(
	items?: InventoryItem[],
	daysThreshold: number = 30
): Promise<InventoryItem[]> {
	if (items) {
		const thresholdDate = addDays(today, daysThreshold);
		return items
			.filter(
				(item) =>
					item.expirationDate &&
					parseISO(item.expirationDate) <= thresholdDate &&
					parseISO(item.expirationDate) >= today
			)
			.sort(
				(a, b) =>
					parseISO(a.expirationDate!).getTime() -
					parseISO(b.expirationDate!).getTime()
			);
	}

	try {
		const db = await getDatabase();
		const collection = db.collection(INVENTORY_COLLECTION);
		const thresholdDate = addDays(today, daysThreshold);

		const docs = await collection
			.find({
				expirationDate: {
					$lte: thresholdDate,
					$gte: today,
				},
			})
			.sort({ expirationDate: 1 })
			.toArray();

		return docs.map(fromMongoDB);
	} catch (error) {
		console.error("Error getting nearing expiration items:", error);
		return [];
	}
}

export async function getRecentlyUsedItems(
	items?: InventoryItem[],
	daysThreshold: number = 7
): Promise<InventoryItem[]> {
	if (items) {
		const thresholdDate = subDays(today, daysThreshold);
		return items
			.filter(
				(item) =>
					item.lastUsedDate && parseISO(item.lastUsedDate) >= thresholdDate
			)
			.sort(
				(a, b) =>
					parseISO(b.lastUsedDate!).getTime() -
					parseISO(a.lastUsedDate!).getTime()
			);
	}

	try {
		const db = await getDatabase();
		const collection = db.collection(INVENTORY_COLLECTION);
		const thresholdDate = subDays(today, daysThreshold);

		const docs = await collection
			.find({
				lastUsedDate: { $gte: thresholdDate },
			})
			.sort({ lastUsedDate: -1 })
			.toArray();

		return docs.map(fromMongoDB);
	} catch (error) {
		console.error("Error getting recently used items:", error);
		return [];
	}
}

// NEW: Get real reagent usage data from the database
export async function getReagentUsageData(
	daysBack: number = 7
): Promise<ReagentUsageDataPoint[]> {
	try {
		const db = await getDatabase();
		const usageCollection = db.collection(USAGE_HISTORY_COLLECTION);

		const endDate = today;
		const startDate = subDays(endDate, daysBack - 1);
		const days = eachDayOfInterval({ start: startDate, end: endDate });

		// Aggregate usage data by day for reagents only
		const usageData = await usageCollection
			.aggregate([
				{
					$match: {
						usedDate: {
							$gte: startOfDay(startDate),
							$lte: endOfDay(endDate),
						},
					},
				},
				{
					$lookup: {
						from: INVENTORY_COLLECTION,
						localField: "itemId",
						foreignField: "_id",
						as: "item",
					},
				},
				{
					$match: {
						"item.type": "Reagent",
					},
				},
				{
					$group: {
						_id: {
							$dateToString: {
								format: "%Y-%m-%d",
								date: "$usedDate",
							},
						},
						totalUsage: { $sum: "$quantityUsed" },
					},
				},
				{
					$sort: { _id: 1 },
				},
			])
			.toArray();

		// Create a map for quick lookup
		const usageMap = new Map(
			usageData.map((item) => [item._id, item.totalUsage])
		);

		// Fill in data for all days, including days with no usage
		return days.map((day) => ({
			date: format(day, "MMM dd"),
			usage: usageMap.get(format(day, "yyyy-MM-dd")) || 0,
		}));
	} catch (error) {
		console.error("Error getting reagent usage data:", error);
		// Fallback to mock data if there's an error
		return getMockReagentUsageData();
	}
}

export async function getAllItemsUsageData(daysBack: number = 7): Promise<ReagentUsageDataPoint[]> {
    try {
        const db = await getDatabase();
        const usageCollection = db.collection(USAGE_HISTORY_COLLECTION);
        const endDate = today;
        const startDate = subDays(endDate, daysBack - 1);
        const days = eachDayOfInterval({ start: startDate, end: endDate });

        const usageData = await usageCollection
            .aggregate([
                {
                    $match: {
                        usedDate: {
                            $gte: startOfDay(startDate),
                            $lte: endOfDay(endDate),
                        },
                    },
                },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: "%Y-%m-%d", date: "$usedDate" },
                        },
                        totalUsage: { $sum: "$quantityUsed" },
                    },
                },
                { $sort: { _id: 1 } },
            ])
            .toArray();

        const usageMap = new Map(usageData.map((item) => [item._id, item.totalUsage]));
        return days.map((day) => ({
            date: format(day, "MMM dd"),
            usage: usageMap.get(format(day, "yyyy-MM-dd")) || 0,
        }));
    } catch (error) {
        console.error("Error getting all items usage data:", error);
        return getMockReagentUsageData();
    }
}

// NEW: Get usage history for a specific item
export async function getItemUsageHistory(
	itemId: string,
	limit: number = 10
): Promise<
	Array<{
		date: Date;
		quantityUsed: number;
		notes?: string;
		userId?: string;
	}>
> {
	try {
		const db = await getDatabase();
		const usageCollection = db.collection(USAGE_HISTORY_COLLECTION);

		const usageHistory = await usageCollection
			.find({ itemId: new ObjectId(itemId) })
			.sort({ usedDate: -1 })
			.limit(limit)
			.toArray();

		return usageHistory.map((usage) => ({
			date: usage.usedDate,
			quantityUsed: usage.quantityUsed,
			notes: usage.notes,
			userId: usage.userId,
		}));
	} catch (error) {
		console.error("Error getting item usage history:", error);
		return [];
	}
}

// NEW: Record item usage in the history collection
export async function recordItemUsage(
	itemId: string,
	itemName: string,
	quantityUsed: number,
	userId?: string,
	notes?: string
): Promise<void> {
	try {
		const db = await getDatabase();
		const usageCollection = db.collection(USAGE_HISTORY_COLLECTION);

		await usageCollection.insertOne({
			itemId: new ObjectId(itemId),
			itemName,
			quantityUsed,
			usedDate: new Date(),
			userId,
			notes,
		});
	} catch (error) {
		console.error("Error recording item usage:", error);
		throw error;
	}
}

export async function getItemUsageStats(itemId: string): Promise<{
	totalUsedLast30Days: number;
	averageMonthlyUsage: number;
	lastUsedDate?: Date;
	usageCount: number;
}> {
	try {
		const db = await getDatabase();
		const usageCollection = db.collection(USAGE_HISTORY_COLLECTION);

		const thirtyDaysAgo = subDays(today, 30);

		const stats = await usageCollection
			.aggregate([
				{
					$match: { itemId: new ObjectId(itemId) },
				},
				{
					$facet: {
						last30Days: [
							{
								$match: {
									usedDate: { $gte: thirtyDaysAgo },
								},
							},
							{
								$group: {
									_id: null,
									totalUsed: { $sum: "$quantityUsed" },
								},
							},
						],
						overall: [
							{
								$group: {
									_id: null,
									totalUsed: { $sum: "$quantityUsed" },
									count: { $sum: 1 },
									lastUsed: { $max: "$usedDate" },
								},
							},
						],
					},
				},
			])
			.toArray();

		const result = stats[0];
		const last30DaysData = result.last30Days[0];
		const overallData = result.overall[0];

		return {
			totalUsedLast30Days: last30DaysData?.totalUsed || 0,
			averageMonthlyUsage: last30DaysData?.totalUsed || 0,
			lastUsedDate: overallData?.lastUsed,
			usageCount: overallData?.count || 0,
		};
	} catch (error) {
		console.error("Error getting item usage stats:", error);
		return {
			totalUsedLast30Days: 0,
			averageMonthlyUsage: 0,
			usageCount: 0,
		};
	}
}

export function getMockReagentUsageData(): ReagentUsageDataPoint[] {
	const endDate = today;
	const startDate = subDays(endDate, 6);
	const days = eachDayOfInterval({ start: startDate, end: endDate });
	return days.map((day) => ({
		date: format(day, "MMM dd"),
		usage: Math.floor(Math.random() * 20) + 5,
	}));
}

export async function addInventoryItem(
	itemData: Omit<InventoryItem, "id" | "addedDate">
): Promise<InventoryItem> {
	try {
		const db = await getDatabase();
		const collection = db.collection(INVENTORY_COLLECTION);

		const docData = {
			...itemData,
			addedDate: new Date(),
			expirationDate: itemData.expirationDate
				? parseISO(itemData.expirationDate)
				: null,
			lastUsedDate: itemData.lastUsedDate
				? parseISO(itemData.lastUsedDate)
				: null,
		};

		const result = await collection.insertOne(docData);

		return {
			id: result.insertedId.toString(),
			...itemData,
			addedDate: docData.addedDate.toISOString(),
		};
	} catch (error) {
		console.error("Error adding inventory item:", error);
		throw error;
	}
}

export async function updateInventoryItem(
	id: string,
	updates: Partial<Omit<InventoryItem, "id">>,
	recordUsage: boolean = false,
	quantityUsed?: number,
	userId?: string,
	notes?: string
): Promise<InventoryItem | undefined> {
	if (!id) throw new Error("Item ID is required for update.");

	try {
		const db = await getDatabase();
		const collection = db.collection(INVENTORY_COLLECTION);

		const currentItem = recordUsage ? await getInventoryItemById(id) : null;

		const dataToUpdate: Partial<InventoryItem> = { ...updates };

		if (updates.expirationDate) {
			dataToUpdate.expirationDate = new Date(
				updates.expirationDate
			).toISOString();
		}
		if (updates.lastUsedDate) {
			dataToUpdate.lastUsedDate = new Date(updates.lastUsedDate).toISOString();
		}
		if (updates.addedDate) {
			dataToUpdate.addedDate = new Date(updates.addedDate).toISOString();
		}

		await collection.updateOne(
			{ _id: new ObjectId(id) },
			{ $set: dataToUpdate }
		);

		if (recordUsage && currentItem && quantityUsed && quantityUsed > 0) {
			await recordItemUsage(id, currentItem.name, quantityUsed, userId, notes);
		}

		return getInventoryItemById(id);
	} catch (error) {
		console.error("Error updating inventory item:", error);
		throw error;
	}
}

export async function deleteInventoryItem(id: string): Promise<boolean> {
	if (!id) return false;
	try {
		const db = await getDatabase();
		const collection = db.collection(INVENTORY_COLLECTION);
		const usageCollection = db.collection(USAGE_HISTORY_COLLECTION);

		const [itemResult] = await Promise.all([
			collection.deleteOne({ _id: new ObjectId(id) }),
			usageCollection.deleteMany({ itemId: new ObjectId(id) }),
		]);

		return itemResult.deletedCount === 1;
	} catch (error) {
		console.error("Error deleting item from MongoDB:", error);
		return false;
	}
}
