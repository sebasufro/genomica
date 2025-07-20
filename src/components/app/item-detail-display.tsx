import type { InventoryItem } from "@/lib/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, parseISO, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import {
  Package,
  Thermometer,
  CalendarClock,
  MapPin,
  Layers,
  FlaskConical,
  GripVertical,
  Barcode as BarcodeIcon,
  ClipboardList,
  Factory,
  FileText,
  CheckCircle,
  AlertTriangle,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ItemDetailDisplayProps {
  item: InventoryItem;
  className?: string;
}

const DetailRow: React.FC<{
  label: string;
  value?: string | number | null;
  icon?: React.ReactNode;
  className?: string;
}> = ({ label, value, icon, className }) => {
  if (value === undefined || value === null || String(value).trim() === "")
    return null;
  return (
    <div className={`flex items-start py-2 ${className}`}>
      {icon && <div className="mr-3 mt-1 text-primary">{icon}</div>}
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-base text-foreground">{String(value)}</p>
      </div>
    </div>
  );
};

const getStatusBadge = (item: InventoryItem) => {
  const today = new Date();
  if (item.expirationDate) {
    try {
      const expDate = parseISO(item.expirationDate);
      if (expDate < today) {
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Expirado
          </Badge>
        );
      }
      if (differenceInDays(expDate, today) <= 30) {
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <CalendarClock className="h-3 w-3" />
            Expira Pronto
          </Badge>
        );
      }
    } catch {
      console.error(
        "Formato de fecha de expiración inválido:",
        item.expirationDate
      );
    }
  }
  if (item.quantity <= item.lowStockThreshold) {
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <Package className="h-3 w-3" />
        Stock Bajo
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="flex items-center gap-1">
      <CheckCircle className="h-3 w-3" />
      En Stock
    </Badge>
  );
};

export function ItemDetailDisplay({ item, className }: ItemDetailDisplayProps) {
  const itemIcon = () => {
    switch (item.type) {
      case "Reagent":
        return <FlaskConical size={20} />;
      case "Consumable":
        return <GripVertical size={20} />;
      case "Equipment Part":
        return <Layers size={20} />;
      case "General Lab Supply":
        return <Package size={20} />;
      default:
        return <Info size={20} />;
    }
  };

  const itemTypeDisplay: Record<InventoryItem["type"], string> = {
    Reagent: "Reactivo",
    Consumable: "Consumible",
    "Equipment Part": "Pieza de Equipo",
    "General Lab Supply": "Suministro General de Laboratorio",
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <CardTitle className="text-2xl font-headline flex items-center gap-2">
            {itemIcon()} {item.name}
          </CardTitle>
          {getStatusBadge(item)}
        </div>
        <CardDescription>
          {item.category || "Sin categorizar"} -{" "}
          {itemTypeDisplay[item.type] || item.type}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
          <DetailRow
            label="Cantidad"
            value={`${item.quantity} ${item.unit}`}
            icon={<Package size={18} />}
          />
          <DetailRow
            label="Umbral de Stock Bajo"
            value={`${item.lowStockThreshold} ${item.unit}`}
            icon={<AlertTriangle size={18} />}
          />

          {item.lotNumber && (
            <DetailRow
              label="Número de Lote"
              value={item.lotNumber}
              icon={<ClipboardList size={18} />}
            />
          )}
          {item.provider && (
            <DetailRow
              label="Proveedor"
              value={item.provider}
              icon={<Factory size={18} />}
            />
          )}
          {item.barcode && (
            <DetailRow
              label="Código de Barras"
              value={item.barcode}
              icon={<BarcodeIcon size={18} />}
            />
          )}

          <DetailRow
            label="Ubicación de Almacenamiento"
            value={`${
              item.storageLocation.type === "Fridge"
                ? "Refrigerador"
                : item.storageLocation.type === "Freezer"
                ? "Congelador"
                : item.storageLocation.type === "Cabinet"
                ? "Armario"
                : item.storageLocation.type === "Shelf"
                ? "Estante"
                : "Temperatura Ambiente"
            }: ${item.storageLocation.name}${
              item.storageLocation.details
                ? ` (${item.storageLocation.details})`
                : ""
            }`}
            icon={<MapPin size={18} />}
          />
          {item.temperature && (
            <DetailRow
              label="Temperatura de Almacenamiento"
              value={item.temperature}
              icon={<Thermometer size={18} />}
            />
          )}

          {item.expirationDate && (
            <DetailRow
              label="Fecha de Expiración"
              value={format(
                parseISO(item.expirationDate),
                "dd 'de' MMMM 'de' yyyy",
                { locale: es }
              )}
              icon={<CalendarClock size={18} />}
            />
          )}
          <DetailRow
            label="Fecha de Adición"
            value={format(
              parseISO(item.addedDate),
              "dd 'de' MMMM 'de' yyyy, HH:mm",
              { locale: es }
            )}
            icon={<CalendarClock size={18} />}
          />
          {item.lastUsedDate && (
            <DetailRow
              label="Última Fecha de Uso"
              value={format(
                parseISO(item.lastUsedDate),
                "dd 'de' MMMM 'de' yyyy, HH:mm",
                { locale: es }
              )}
              icon={<CalendarClock size={18} />}
            />
          )}

          {item.notes && (
            <DetailRow
              label="Notas Adicionales"
              value={item.notes}
              icon={<FileText size={18} />}
              className="md:col-span-2"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
