'use client'; // Si usas Next.js App Router

import React from 'react';
import { addInventoryItem } from '../lib/data'; // Ajusta la ruta si es necesario
import type { InventoryItem, ItemType, StorageLocationType } from '../lib/types';

export default function TestFirestore() {
  const handleAdd = async () => {
    const newItem = {
      name: 'quine Genotypes Panel 1.1 100 Reacciones',
      type: 'Reactivo' as ItemType,
      category: 'Quimico',
      lotNumber: 'F850S',
      provider: 'Sigma-Aldrich',
      barcode: '123456789',
      quantity: 100,
      unit: 'ml',
      storageLocation: {
        type: 'Freezer' as StorageLocationType,
        name: 'Refrigerador 2',
        details: 'Freezer Refrigerador 2'
      },
      expirationDate: new Date().toISOString(),
      temperature: '4°C',
      lastUsedDate: new Date().toISOString(),
      lowStockThreshold: 5,
      notes: 'Testing item',
      imageUrl: '',
    };

    try {
      const savedItem = await addInventoryItem(newItem);
      console.log('Item saved to Firestore:', savedItem);
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  return <button onClick={handleAdd}>Agregar item de prueba</button>;
}
