export type ItemType = 'Reagent' | 'Consumable' | 'Equipment Part' | 'General Lab Supply';
export type StorageLocationType = 'Fridge' | 'Freezer' | 'Cabinet' | 'Shelf' | 'Room Temperature';

export interface InventoryItem {
  id: string;
  name: string;
  type: ItemType;
  category: string;
  lotNumber?: string;
  provider?: string;
  barcode?: string;
  quantity: number;
  unit: string; // e.g., 'ml', 'tubes', 'pieces', 'kit'
  storageLocation: {
    type: StorageLocationType;
    name: string; // e.g., "Fridge A", "Main Lab Cabinet"
    details?: string; // e.g., "Shelf 3, Bin 2"
  };
  expirationDate?: string; // ISO string format (YYYY-MM-DD)
  temperature?: string; // e.g., "4°C", "-20°C", "-80°C", "RT"
  lastUsedDate?: string; // ISO string format
  addedDate: string; // ISO string format
  lowStockThreshold: number;
  notes?: string;
  imageUrl?: string; // Optional, for visual identification
}

export interface DashboardMetrics {
  lowStockCount: number;
  nearingExpirationCount: number;
  recentlyUsedCount: number;
  totalItemsCount: number;
  totalReagentsCount: number;
}

export interface ReagentUsageDataPoint {
  date: string; // e.g., "Mon", "YYYY-MM-DD"
  usage: number;
}
