"use client";

import { useState, useEffect, useMemo } from "react";
import type { InventoryItem, ItemType } from "@/lib/types";
import { InventoryItemCard } from "@/components/app/inventory-item-card";
import { InventoryFilter } from "@/components/app/inventory-filter";
import { Button } from "@/components/ui/button";
import { ListFilter, Loader2 } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseISO, addDays, subDays } from "date-fns";

export default function InventoryPage() {
  const [allItems, setAllItems] = useState<InventoryItem[]>([]); // Stores all fetched items
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("addedDate-desc");

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/inventory");
        const fetchedItems = await res.json();
        setAllItems(fetchedItems);
      } catch (error) {
        console.error("Error fetching inventory items:", error);
        // Optionally set an error state to display to the user
      } finally {
        setIsLoading(false);
      }
    };
    fetchItems();
  }, []);

  useEffect(() => {
    // The actual filtering based on filterParam is now done within filteredAndSortedItems memo
    // This effect can be used if you need to set initial filter states based on URL
    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }

    const typeParam = searchParams.get("type");
    if (typeParam) {
      setSelectedType(typeParam);
    }
  }, [searchParams]);

  const allTypesForFilter = useMemo(() => {
    if (!allItems || allItems.length === 0) return [];
    const typesMap: Record<ItemType, string> = {
      Reagent: "Reactivo",
      Consumable: "Consumible",
      "Equipment Part": "Pieza de Equipo",
      "General Lab Supply": "Suministro General de Laboratorio",
    };
    const uniqueEnglishTypes = Array.from(
      new Set(allItems.map((item) => item.type).filter(Boolean))
    ) as ItemType[];
    return uniqueEnglishTypes.map((type) => ({
      value: type,
      label: typesMap[type] || type,
    }));
  }, [allItems]);

  const uniqueCategories = useMemo(() => {
    if (!allItems || allItems.length === 0) {
      return [];
    }
    const categories = allItems
      .map((item) => item.category)
      .filter(
        (category): category is string =>
          typeof category === "string" && category.trim() !== ""
      )
      .map((category) => category.trim());

    return Array.from(new Set(categories)).sort();
  }, [allItems]);

  const filteredAndSortedItems = useMemo(async () => {
    // This memo now needs to be async or handle promises if getLowStockItems etc. are always async.
    // However, since we fetch allItems once, we can pass it to synchronous versions of these filters
    // if we adapt them or filter manually here.

    // Let's filter manually based on params for now, as those utility functions might refetch
    let tempItems = [...allItems];
    const filterParam = searchParams.get("filter");

    if (filterParam) {
      if (filterParam === "low_stock") {
        tempItems = tempItems
          .filter((item) => item.quantity <= item.lowStockThreshold)
          .sort((a, b) => a.quantity - b.quantity);
      } else if (filterParam === "nearing_expiration") {
        const today = new Date();
        const thresholdDate = addDays(today, 30);
        tempItems = tempItems
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
      } else if (filterParam === "recently_used") {
        const today = new Date();
        const thresholdDate = subDays(today, 7);
        tempItems = tempItems
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
    }

    tempItems = tempItems.filter((item) => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch =
        searchTermLower === "" ||
        item.name.toLowerCase().includes(searchTermLower) ||
        (item.lotNumber &&
          item.lotNumber.toLowerCase().includes(searchTermLower)) ||
        (item.provider &&
          item.provider.toLowerCase().includes(searchTermLower)) ||
        (item.barcode && item.barcode.toLowerCase().includes(searchTermLower));

      const matchesType = selectedType === "" || item.type === selectedType;
      const matchesCategory =
        selectedCategory === "" || item.category === selectedCategory;

      return matchesSearch && matchesType && matchesCategory;
    });

    const [sortKey, sortOrder] = sortBy.split("-");
    tempItems.sort((a, b) => {
      let valA = a[sortKey as keyof InventoryItem];
      let valB = b[sortKey as keyof InventoryItem];

      if (
        sortKey === "expirationDate" ||
        sortKey === "addedDate" ||
        sortKey === "lastUsedDate"
      ) {
        valA = valA
          ? parseISO(valA as string).getTime()
          : sortOrder === "asc"
          ? Infinity
          : -Infinity;
        valB = valB
          ? parseISO(valB as string).getTime()
          : sortOrder === "asc"
          ? Infinity
          : -Infinity;
      } else if (typeof valA === 'number' && typeof valB === 'number') {
        // Keep as numbers
      } else {
        valA = String(valA).toLowerCase();
        valB = String(valB).toLowerCase();
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return tempItems;
  }, [
    allItems,
    searchTerm,
    selectedType,
    selectedCategory,
    sortBy,
    searchParams,
  ]);

  // State for the resolved items from the async memo
  const [displayItems, setDisplayItems] = useState<InventoryItem[]>([]);

  useEffect(() => {
    filteredAndSortedItems.then((items) => {
      setDisplayItems(items);
    });
  }, [filteredAndSortedItems]);

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedType("");
    setSelectedCategory("");
    const currentPath = window.location.pathname; // No query params
    router.replace(currentPath, { scroll: false });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Cargando inventario...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-headline font-semibold">
          Lista de Inventario
        </h2>
      </div>

      <InventoryFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        allTypesForFilter={allTypesForFilter}
        uniqueCategories={uniqueCategories}
        onResetFilters={handleResetFilters}
      />

      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground">
          Mostrando {displayItems.length} de {allItems.length} insumos
        </p>
        <div className="flex items-center gap-2">
          <ListFilter className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Nombre (A-Z)</SelectItem>
              <SelectItem value="name-desc">Nombre (Z-A)</SelectItem>
              <SelectItem value="quantity-asc">
                Cantidad (Menor a Mayor)
              </SelectItem>
              <SelectItem value="quantity-desc">
                Cantidad (Mayor a Menor)
              </SelectItem>
              <SelectItem value="expirationDate-asc">
                Fecha de Expiración (Más Próxima)
              </SelectItem>
              <SelectItem value="expirationDate-desc">
                Fecha de Expiración (Más Lejana)
              </SelectItem>
              <SelectItem value="addedDate-desc">
                Fecha de Adición (Más Reciente)
              </SelectItem>
              <SelectItem value="addedDate-asc">
                Fecha de Adición (Más Antigua)
              </SelectItem>
              <SelectItem value="lastUsedDate-desc">
                Último Uso (Más Reciente)
              </SelectItem>
              <SelectItem value="lastUsedDate-asc">
                Último Uso (Más Antiguo)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {displayItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {displayItems.map((item) => (
            <InventoryItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-muted-foreground text-lg">
            No hay insumos que coincidan con tus filtros actuales.
          </p>
          {(searchTerm ||
            selectedType ||
            selectedCategory ||
            searchParams.get("filter")) && ( // Show only if filters are active
            <Button
              variant="link"
              onClick={handleResetFilters}
              className="mt-2"
            >
              Limpiar todos los filtros
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
