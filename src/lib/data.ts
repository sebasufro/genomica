import type { InventoryItem, ReagentUsageDataPoint } from './types';
import { format, formatISO, addDays, subDays, eachDayOfInterval, parseISO } from 'date-fns';
import { getDatabase } from './mongodb';
import { ObjectId } from 'mongodb';

const today = new Date();
const INVENTORY_COLLECTION = 'inventory';

// Helper para convertir documento de MongoDB a InventoryItem
const fromMongoDB = (doc: any): InventoryItem => {
  const convertDateToISO = (date: any): string | undefined => {
    if (date instanceof Date) {
      return date.toISOString();
    }
    if (typeof date === 'string') {
      try {
        parseISO(date); // Verificar si es un string ISO válido
        return date;
      } catch (e) {
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
    console.error('Error fetching inventory items:', error);
    throw error;
  }
}

export async function getInventoryItemById(id: string): Promise<InventoryItem | undefined> {
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
    console.error('Error fetching inventory item by ID:', error);
    return undefined;
  }
}

export async function getTotalItemsCount(items?: InventoryItem[]): Promise<number> {
  if (items) {
    return items.length;
  }
  
  try {
    const db = await getDatabase();
    const collection = db.collection(INVENTORY_COLLECTION);
    return await collection.countDocuments({});
  } catch (error) {
    console.error('Error getting total items count:', error);
    return 0;
  }
}

export async function getTotalReagentsCount(items?: InventoryItem[]): Promise<number> {
  if (items) {
    return items.filter(item => item.type === 'Reagent').length;
  }
  
  try {
    const db = await getDatabase();
    const collection = db.collection(INVENTORY_COLLECTION);
    return await collection.countDocuments({ type: 'Reagent' });
  } catch (error) {
    console.error('Error getting total reagents count:', error);
    return 0;
  }
}

export async function getLowStockItems(items?: InventoryItem[]): Promise<InventoryItem[]> {
  if (items) {
    return items.filter(item => item.quantity <= item.lowStockThreshold)
                .sort((a, b) => a.quantity - b.quantity);
  }
  
  try {
    const db = await getDatabase();
    const collection = db.collection(INVENTORY_COLLECTION);
    const docs = await collection.find({
      $expr: { $lte: ['$quantity', '$lowStockThreshold'] }
    }).sort({ quantity: 1 }).toArray();
    
    return docs.map(fromMongoDB);
  } catch (error) {
    console.error('Error getting low stock items:', error);
    return [];
  }
}

export async function getNearingExpirationItems(items?: InventoryItem[], daysThreshold: number = 30): Promise<InventoryItem[]> {
  if (items) {
    const thresholdDate = addDays(today, daysThreshold);
    return items.filter(item => 
      item.expirationDate && 
      parseISO(item.expirationDate) <= thresholdDate && 
      parseISO(item.expirationDate) >= today
    ).sort((a, b) => parseISO(a.expirationDate!).getTime() - parseISO(b.expirationDate!).getTime());
  }
  
  try {
    const db = await getDatabase();
    const collection = db.collection(INVENTORY_COLLECTION);
    const thresholdDate = addDays(today, daysThreshold);
    
    const docs = await collection.find({
      expirationDate: {
        $lte: thresholdDate,
        $gte: today
      }
    }).sort({ expirationDate: 1 }).toArray();
    
    return docs.map(fromMongoDB);
  } catch (error) {
    console.error('Error getting nearing expiration items:', error);
    return [];
  }
}

export async function getRecentlyUsedItems(items?: InventoryItem[], daysThreshold: number = 7): Promise<InventoryItem[]> {
  if (items) {
    const thresholdDate = subDays(today, daysThreshold);
    return items.filter(item => 
      item.lastUsedDate && parseISO(item.lastUsedDate) >= thresholdDate
    ).sort((a, b) => parseISO(b.lastUsedDate!).getTime() - parseISO(a.lastUsedDate!).getTime());
  }
  
  try {
    const db = await getDatabase();
    const collection = db.collection(INVENTORY_COLLECTION);
    const thresholdDate = subDays(today, daysThreshold);
    
    const docs = await collection.find({
      lastUsedDate: { $gte: thresholdDate }
    }).sort({ lastUsedDate: -1 }).toArray();
    
    return docs.map(fromMongoDB);
  } catch (error) {
    console.error('Error getting recently used items:', error);
    return [];
  }
}

export function getMockReagentUsageData(): ReagentUsageDataPoint[] {
  const endDate = today;
  const startDate = subDays(endDate, 6);
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  return days.map(day => ({
    date: format(day, 'MMM dd'),
    usage: Math.floor(Math.random() * 20) + 5,
  }));
}

export async function addInventoryItem(itemData: Omit<InventoryItem, 'id' | 'addedDate'>): Promise<InventoryItem> {
  try {
    const db = await getDatabase();
    const collection = db.collection(INVENTORY_COLLECTION);
    
    const docData = {
      ...itemData,
      addedDate: new Date(),
      expirationDate: itemData.expirationDate ? parseISO(itemData.expirationDate) : null,
      lastUsedDate: itemData.lastUsedDate ? parseISO(itemData.lastUsedDate) : null,
    };

    const result = await collection.insertOne(docData);
    
    return {
      id: result.insertedId.toString(),
      ...itemData,
      addedDate: docData.addedDate.toISOString(),
    };
  } catch (error) {
    console.error('Error adding inventory item:', error);
    throw error;
  }
}

export async function updateInventoryItem(id: string, updates: Partial<Omit<InventoryItem, 'id'>>): Promise<InventoryItem | undefined> {
  if (!id) throw new Error("Item ID is required for update.");
  
  try {
    const db = await getDatabase();
    const collection = db.collection(INVENTORY_COLLECTION);
    
    const dataToUpdate: any = { ...updates };
    
    if (updates.expirationDate) {
      dataToUpdate.expirationDate = parseISO(updates.expirationDate);
    }
    if (updates.lastUsedDate) {
      dataToUpdate.lastUsedDate = parseISO(updates.lastUsedDate);
    }
    if (updates.addedDate) {
      dataToUpdate.addedDate = parseISO(updates.addedDate);
    }
    
    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: dataToUpdate }
    );
    
    return getInventoryItemById(id);
  } catch (error) {
    console.error('Error updating inventory item:', error);
    throw error;
  }
}

export async function deleteInventoryItem(id: string): Promise<boolean> {
  if (!id) return false;  
  try {
    const db = await getDatabase();
    const collection = db.collection(INVENTORY_COLLECTION);
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    
    return result.deletedCount === 1;
  } catch (error) {
    console.error("Error deleting item from MongoDB:", error);
    return false;
  }
}
