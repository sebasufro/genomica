
import Link from 'next/link';
import { Card, CardTitle, CardDescription, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { InventoryItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Package, Thermometer, CalendarClock, MapPin, Layers, FlaskConical, GripVertical, AlertTriangle } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface InventoryItemCardProps {
  item: InventoryItem;
}

const getItemIcon = (type: InventoryItem['type']) => {
  switch (type) {
    case 'Reagent': return <FlaskConical className="h-4 w-4" />;
    case 'Consumable': return <GripVertical className="h-4 w-4" />;
    case 'Equipment Part': return <Layers className="h-4 w-4" />;
    case 'General Lab Supply': return <Package className="h-4 w-4" />;
    default: return <Package className="h-4 w-4" />;
  }
};


export function InventoryItemCard({ item }: InventoryItemCardProps) {
  const isMobile = useIsMobile();
  const isLowStock = item.quantity <= item.lowStockThreshold;
  const isNearingExpiration = item.expirationDate ? differenceInDays(parseISO(item.expirationDate), new Date()) <= 30 && differenceInDays(parseISO(item.expirationDate), new Date()) >=0 : false;
  
  const itemTypeDisplay: Record<InventoryItem['type'], string> = {
    'Reagent': 'Reactivo',
    'Consumable': 'Consumible',
    'Equipment Part': 'Pieza de Equipo',
    'General Lab Supply': 'Suministro General de Laboratorio'
  };

  if (isMobile) {
    // Mobile View
    return (
      <Link href={`/inventory/${item.id}`} className="block h-full">
        <Card className="p-3 h-full shadow-md hover:shadow-lg transition-shadow relative flex flex-col justify-between">
          {/* Alert Badge - Top Right */}
          {(isLowStock || isNearingExpiration) && (
            <div className="absolute top-2 right-2 z-10">
              <Badge variant="destructive" className="flex items-center gap-1 text-[0.65rem] px-1.5 py-0.5">
                <AlertTriangle className="h-2.5 w-2.5" />
                Alerta
              </Badge>
            </div>
          )}
          
          {/* Top content section: Name, Type-Category */}
          <div> 
            <CardTitle className="text-sm font-headline leading-snug pr-10"> {/* pr-10 for alert badge space */}
              {item.name}
            </CardTitle>
            {/* Type and Category on the same line */}
            <CardDescription className="text-xs mt-0.5 text-muted-foreground flex pr-10">
              <span className="truncate">
                {itemTypeDisplay[item.type]}{item.category ? ` - ${item.category}` : ''}
              </span>
            </CardDescription>
          </div>

          {/* Bottom content section: Location, Temp, Stock */}
          <div className="mt-2 flex justify-between items-end text-xs">
            {/* Left side: Storage Location */}
            <div className="flex flex-col items-start max-w-[calc(100%-100px)]"> {/* Adjusted max-width slightly */}
              <span className="text-muted-foreground truncate w-full">{item.storageLocation.name}</span>
            </div>
            {/* Right side: Temp & Stock Quantity */}
            <div className="flex flex-col items-end text-right min-w-[80px]"> {/* Added min-width */}
              {item.temperature && (
                <div className="flex items-center gap-0.5 text-muted-foreground text-[0.65rem] leading-tight mb-0.5 font-medium">
                  <Thermometer className="h-3 w-3" />
                  <span className="truncate">{item.temperature}</span>
                </div>
              )}
              <span className="font-medium whitespace-nowrap">{item.quantity} {item.unit}</span>
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  // Desktop View
  return (
    <Card className="flex flex-col overflow-hidden h-full shadow-lg hover:shadow-xl transition-shadow duration-300 relative">
      <CardHeader className="relative p-4">
        {(isLowStock || isNearingExpiration) && (
          <div className="absolute top-3 right-3 z-10">
            <Badge variant="destructive" className="flex items-center gap-1 text-xs px-2 py-0.5">
              <AlertTriangle className="h-3 w-3" />
              Alerta
            </Badge>
          </div>
        )}
        <CardTitle className="text-md font-headline hover:text-primary transition-colors pr-16">
          <Link href={`/inventory/${item.id}`}>{item.name}</Link>
        </CardTitle>
        <CardDescription className="text-xs">{item.category || 'Sin categorizar'} - {itemTypeDisplay[item.type] || item.type}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-2 text-sm pt-2 pb-4 px-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Package className="h-4 w-4" />
          <span>{item.quantity} {item.unit}</span>
          {isLowStock && <Badge variant="secondary" className="text-xs whitespace-nowrap">Stock Bajo</Badge>}
        </div>
        {item.expirationDate && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarClock className="h-4 w-4" />
            <span>Exp: {format(parseISO(item.expirationDate), "dd 'de' MMM 'de' yyyy", { locale: es })}</span>
            {isNearingExpiration && <Badge variant="secondary" className="text-xs whitespace-nowrap">Expira Pronto</Badge>}
          </div>
        )}
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{item.storageLocation.name} {item.storageLocation.details ? `(${item.storageLocation.details})` : ''}</span>
        </div>
        {item.temperature && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Thermometer className="h-4 w-4" />
            <span>{item.temperature}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link href={`/inventory/${item.id}`}>Ver Detalles</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

