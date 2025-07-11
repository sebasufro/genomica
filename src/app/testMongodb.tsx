'use client';

import React from 'react';

export default function TestMongo() {
  const handleAdd = async () => {
    const newItem = {
      name: 'Equine Genotypes Panel 1.1 100 Reacciones',
      type: 'Reagent',
      category: 'Químico',
      lotNumber: 'F850S',
      provider: 'Sigma-Aldrich',
      barcode: '123456789',
      quantity: 100,
      unit: 'ml',
      storageLocation: {
        type: 'Freezer',
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
      const res = await fetch('/api/addItem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Unknown error');
      }

      const savedItem = await res.json();
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
