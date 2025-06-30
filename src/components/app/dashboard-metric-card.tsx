"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { InventoryItem } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardMetricCardProps {
  title: string;
  count: number;
  items?: InventoryItem[];
  icon: LucideIcon;
  viewAllLink?: string;
  itemDescriptionKey?: keyof InventoryItem | ((item: InventoryItem) => string);
  itemBadgeKey?:
    | keyof InventoryItem
    | ((item: InventoryItem) => string | number | undefined);
  itemBadgeVariant?: "default" | "secondary" | "destructive" | "outline";
  emptyStateMessage?: string;
  className?: string;
}

export function DashboardMetricCard({
  title,
  count,
  items = [],
  icon: Icon,
  viewAllLink,
  itemDescriptionKey,
  itemBadgeKey,
  itemBadgeVariant = "secondary",
  emptyStateMessage = "No hay insumos para mostrar.",
  className,
}: DashboardMetricCardProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Card className={cn("p-3 shadow-md", className)}>
        <h3 className="text-xs font-medium text-muted-foreground truncate">
          {title}
        </h3>
        <p className="text-2xl font-semibold">{count}</p>
      </Card>
    );
  }

  // Desktop rendering
  const maxItemsToList = 3; // Was: isMobile ? 1 : 3;
  const displayItems = items.slice(0, maxItemsToList);

  const getItemDescription = (item: InventoryItem): string => {
    if (typeof itemDescriptionKey === "function") {
      return itemDescriptionKey(item);
    }
    if (itemDescriptionKey && item[itemDescriptionKey]) {
      const value = item[itemDescriptionKey];
      if (
        itemDescriptionKey === "expirationDate" &&
        typeof value === "string"
      ) {
        return `Expira: ${format(parseISO(value), "dd 'de' MMMM 'de' yyyy", {
          locale: es,
        })}`;
      }
      if (itemDescriptionKey === "lastUsedDate" && typeof value === "string") {
        return `Usado: ${format(parseISO(value), "dd 'de' MMMM 'de' yyyy", {
          locale: es,
        })}`;
      }
      return String(value);
    }
    if (typeof itemDescriptionKey === "function" && items.length === 0) {
      return itemDescriptionKey({} as InventoryItem);
    }
    return item.category || "Detalles no disponibles";
  };

  const getItemBadge = (item: InventoryItem): string | number | undefined => {
    if (typeof itemBadgeKey === "function") {
      return itemBadgeKey(item);
    }
    if (itemBadgeKey && item[itemBadgeKey] !== undefined) {
      const value = item[itemBadgeKey];
      if (itemBadgeKey === "quantity") {
        return `${value} ${item.unit}`;
      }
      if (itemBadgeKey === "expirationDate" && typeof value === "string") {
        return format(parseISO(value), "dd MMM", { locale: es });
      }
      if (itemBadgeKey === "lastUsedDate" && typeof value === "string") {
        return format(parseISO(value), "dd MMM", { locale: es });
      }
      return String(value);
    }
    return undefined;
  };

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          {" "}
          {/* items-start to align badge with title if title wraps */}
          <CardTitle className="text-base font-headline flex items-center gap-2">
            <Icon className="h-5 w-5 text-muted-foreground" />
            {title}
          </CardTitle>
          <Badge
            variant="default"
            className="text-sm px-2 py-0.5 ml-2 shrink-0"
          >
            {count}
          </Badge>{" "}
          {/* Added shrink-0 and ml-2 */}
        </div>
        {displayItems.length > 0 && (
          <CardDescription className="text-xs pt-1">
            {" "}
            {/* Added pt-1 */}
            {`Primeros ${displayItems.length} insumos listados abajo.`}
          </CardDescription>
        )}
        {displayItems.length === 0 &&
          emptyStateMessage &&
          title !== "Insumos Totales" &&
          title !== "Reactivos Totales" && (
            <CardDescription className="text-xs pt-1">
              {emptyStateMessage}
            </CardDescription>
          )}
        {displayItems.length === 0 &&
          (title === "Insumos Totales" || title === "Reactivos Totales") &&
          itemDescriptionKey &&
          typeof itemDescriptionKey === "function" && (
            <CardDescription className="text-xs pt-1">
              {itemDescriptionKey({} as InventoryItem)}
            </CardDescription>
          )}
      </CardHeader>
      <CardContent className={cn("flex-grow min-h-[120px]")}>
        {" "}
        {/* Was: isMobile ? "min-h-fit" : "min-h-[120px]" */}
        {displayItems.length > 0 ? (
          <ul className="space-y-1.5">
            {displayItems.map((item) => (
              <li
                key={item.id}
                className="flex justify-between items-center text-xs p-1.5 rounded-md hover:bg-muted/50 transition-colors"
              >
                <div>
                  <Link
                    href={`/inventory/${item.id}`}
                    className="font-medium hover:underline leading-tight"
                  >
                    {item.name}
                  </Link>
                  <p className="text-muted-foreground text-[0.7rem]">
                    {getItemDescription(item)}
                  </p>
                </div>
                {getItemBadge(item) && (
                  <Badge
                    variant={itemBadgeVariant}
                    className="text-[0.65rem] px-1.5 py-0.5 whitespace-nowrap"
                  >
                    {getItemBadge(item)}
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            {title !== "Insumos Totales" && title !== "Reactivos Totales" && (
              <p className="text-sm">{emptyStateMessage}</p>
            )}
          </div>
        )}
      </CardContent>
      {viewAllLink &&
        (displayItems.length > 0 ||
          title === "Insumos Totales" ||
          title === "Reactivos Totales") && (
          <CardFooter>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full text-xs"
            >
              <Link href={viewAllLink}>
                Ver Todo{" "}
                {title.startsWith("Total") || title.startsWith("Insumos")
                  ? "el Inventario"
                  : ""}
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardFooter>
        )}
    </Card>
  );
}
