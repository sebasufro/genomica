"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FilterX } from "lucide-react";
import type { ItemType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface InventoryFilterProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedType: string;
  setSelectedType: (type: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  allTypesForFilter: { value: ItemType; label: string }[];
  uniqueCategories: string[];
  onResetFilters: () => void;
}

export function InventoryFilter({
  searchTerm,
  setSearchTerm,
  selectedType,
  setSelectedType,
  selectedCategory,
  setSelectedCategory,
  allTypesForFilter,
  uniqueCategories,
  onResetFilters,
}: InventoryFilterProps) {
  const categoriesForSelect = React.useMemo(() => {
    if (!Array.isArray(uniqueCategories)) {
      return [];
    }
    const processed = uniqueCategories
      .map((cat) => (typeof cat === "string" ? cat.trim() : ""))
      .filter((cat) => cat !== "");

    return Array.from(new Set(processed)).sort();
  }, [uniqueCategories]);

  const handleCategoryChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setSelectedCategory(event.target.value);
  };

  const handleTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedType(event.target.value);
  };

  return (
    <div className="mb-6 p-4 bg-card border rounded-lg shadow">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-end">
        <div>
          <label
            htmlFor="search"
            className="block text-sm font-medium text-muted-foreground mb-1"
          >
            Buscar
          </label>
          <div className="relative">
            <Input
              id="search"
              type="text"
              placeholder="Buscar por nombre, lote, proveedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <div>
          <label
            htmlFor="type-filter"
            className="block text-sm font-medium text-muted-foreground mb-1"
          >
            Tipo
          </label>
          <select
            id="type-filter"
            value={selectedType}
            onChange={handleTypeChange}
            className={cn(
              "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
            )}
          >
            <option value="">Todos los Tipos</option>
            {allTypesForFilter.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="category-filter"
            className="block text-sm font-medium text-muted-foreground mb-1"
          >
            Categoría
          </label>
          <select
            id="category-filter"
            value={selectedCategory}
            onChange={handleCategoryChange}
            className={cn(
              "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
            )}
          >
            <option value="">Todas las Categorías</option>
            {categoriesForSelect.map((category) => {
              if (category === "") return null; // Extra safeguard, should be handled by useMemo
              return (
                <option key={category} value={category}>
                  {category}
                </option>
              );
            })}
          </select>
        </div>

        <div className="flex items-end h-full">
          <Button
            onClick={onResetFilters}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <FilterX className="mr-2 h-4 w-4" />
            Limpiar Filtros
          </Button>
        </div>
      </div>
    </div>
  );
}
