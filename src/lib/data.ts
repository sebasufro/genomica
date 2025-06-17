import type { InventoryItem, ReagentUsageDataPoint } from './types';
import { format, formatISO, addDays, subDays, eachDayOfInterval, parseISO } from 'date-fns';
import { db } from './firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  Timestamp,
  serverTimestamp // Added serverTimestamp for potential future use
} from "firebase/firestore";

const today = new Date();
const INVENTORY_COLLECTION = 'inventory';

// Helper to convert Firestore doc to InventoryItem
const fromFirestore = (docSnap: import("firebase/firestore").DocumentSnapshot): InventoryItem => {
  const data = docSnap.data()!;
  
  const convertTimestampToISO = (timestamp: any): string | undefined => {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate().toISOString();
    }
    // If it's already an ISO string (e.g., from client-side generation before saving)
    if (typeof timestamp === 'string') {
        try {
            parseISO(timestamp); // Check if it's a valid ISO string
            return timestamp;
        } catch (e) {
            // Not a valid ISO string, might be another format or invalid
            return undefined; 
        }
    }
    return undefined; 
  };
  
  return {
    id: docSnap.id,
    name: data.name,
    type: data.type,
    category: data.category,
    lotNumber: data.lotNumber,
    provider: data.provider,
    barcode: data.barcode,
    quantity: data.quantity,
    unit: data.unit,
    storageLocation: data.storageLocation,
    expirationDate: convertTimestampToISO(data.expirationDate),
    temperature: data.temperature,
    lastUsedDate: convertTimestampToISO(data.lastUsedDate),
    addedDate: convertTimestampToISO(data.addedDate) || new Date().toISOString(),
    lowStockThreshold: data.lowStockThreshold,
    notes: data.notes,
    imageUrl: data.imageUrl,
  };
};


export async function getInventoryItems(): Promise<InventoryItem[]> {
  const inventoryCol = collection(db, INVENTORY_COLLECTION);
  const q = query(inventoryCol, orderBy("addedDate", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(fromFirestore);
}

export async function getInventoryItemById(id: string): Promise<InventoryItem | undefined> {
  if (!id) return undefined;
  const docRef = doc(db, INVENTORY_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return fromFirestore(docSnap);
  }
  return undefined;
}

export async function getTotalItemsCount(items?: InventoryItem[]): Promise<number> {
  const inventory = items || await getInventoryItems();
  return inventory.length;
}

export async function getTotalReagentsCount(items?: InventoryItem[]): Promise<number> {
  const inventory = items || await getInventoryItems();
  return inventory.filter(item => item.type === 'Reagent').length;
}

export async function getLowStockItems(items?: InventoryItem[]): Promise<InventoryItem[]> {
  const inventory = items || await getInventoryItems();
  return inventory.filter(item => item.quantity <= item.lowStockThreshold).sort((a,b) => a.quantity - b.quantity);
}

export async function getNearingExpirationItems(items?: InventoryItem[], daysThreshold: number = 30): Promise<InventoryItem[]> {
  const inventory = items || await getInventoryItems();
  const thresholdDate = addDays(today, daysThreshold);
  return inventory.filter(item => 
    item.expirationDate && parseISO(item.expirationDate) <= thresholdDate && parseISO(item.expirationDate) >= today
  ).sort((a,b) => parseISO(a.expirationDate!).getTime() - parseISO(b.expirationDate!).getTime());
}

export async function getRecentlyUsedItems(items?: InventoryItem[], daysThreshold: number = 7): Promise<InventoryItem[]> {
  const inventory = items || await getInventoryItems();
  const thresholdDate = subDays(today, daysThreshold);
  return inventory.filter(item => 
    item.lastUsedDate && parseISO(item.lastUsedDate) >= thresholdDate
  ).sort((a, b) => parseISO(b.lastUsedDate!).getTime() - parseISO(a.lastUsedDate!).getTime());
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
  const docData = {
    ...itemData,
    addedDate: formatISO(new Date()), // siempre es ahora, porque el campo no existe en itemData
    expirationDate: itemData.expirationDate ? formatISO(parseISO(itemData.expirationDate)) : null,
    lastUsedDate: itemData.lastUsedDate ? formatISO(parseISO(itemData.lastUsedDate)) : null,
  };

  const docRef = await addDoc(collection(db, INVENTORY_COLLECTION), docData);
  return {
    ...itemData,
    id: docRef.id,
    addedDate: docData.addedDate,
  };
}

export async function updateInventoryItem(id: string, updates: Partial<Omit<InventoryItem, 'id'>>): Promise<InventoryItem | undefined> {
  if (!id) throw new Error("Item ID is required for update.");
  const docRef = doc(db, INVENTORY_COLLECTION, id);
  
  const dataToUpdate: any = { ...updates };
  if (updates.expirationDate) {
    dataToUpdate.expirationDate = formatISO(parseISO(updates.expirationDate));
  }
  if (updates.lastUsedDate) {
    dataToUpdate.lastUsedDate = formatISO(parseISO(updates.lastUsedDate));
  }
  if (updates.addedDate) { // Should typically not be updated, but if it is, ensure format
    dataToUpdate.addedDate = formatISO(parseISO(updates.addedDate));
  }
  
  await updateDoc(docRef, dataToUpdate);
  return getInventoryItemById(id);
}

export async function deleteInventoryItem(id: string): Promise<boolean> {
  if (!id) return false;
  try {
    const docRef = doc(db, INVENTORY_COLLECTION, id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Error deleting item from Firestore: ", error);
    return false;
  }
}