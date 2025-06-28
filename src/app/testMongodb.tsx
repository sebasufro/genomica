'use client'; // Si usas Next.js App Router

import React from 'react';
import { addInventoryItem } from '../lib/data'; // Ajusta la ruta si es necesario
import type { InventoryItem, ItemType, StorageLocationType } from '../lib/types';

export default function TestMongo() {
  const handleAdd = async () => {
    const newItem = {
      name: 'Equine Genotypes Panel 1.1 100 Reacciones',
      type: 'Reagent' as ItemType,
      category: 'Químico',
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
      notes: 'Testing item with MongoDB',
      imageUrl: '',
    };

    try {
      const savedItem = await addInventoryItem(newItem);
      console.log('Item saved to MongoDB:', savedItem);
      alert('Item agregado exitosamente a MongoDB!');
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Error al agregar el item');
    }
  };

  return (
    <div>
      <button onClick={handleAdd}>Agregar item de prueba a MongoDB</button>
    </div>
  );
}