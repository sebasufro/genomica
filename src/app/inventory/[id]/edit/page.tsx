"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { EditItemForm } from "@/components/app/edit-item-form";
import { InventoryItem } from "@/lib/types";
import { Loader2 } from "lucide-react";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";

export default function EditItemPage() {
  const { id } = useParams();
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const fetchItem = async () => {
        setIsLoading(true);
        try {
          const res = await fetch(`/api/inventory/${id}`);
          if (res.ok) {
            const data = await res.json();
            setItem(data);
          } else {
            console.error("Failed to fetch item");
          }
        } catch (error) {
          console.error("Error fetching item:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchItem();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!item) {
    return <p>Item not found.</p>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline">
            Editar {item.name}
          </CardTitle>
          <CardDescription>
            Actualiza los detalles del insumo de inventario a continuación.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EditItemForm item={item} />
        </CardContent>
      </Card>
    </div>
  );
}
