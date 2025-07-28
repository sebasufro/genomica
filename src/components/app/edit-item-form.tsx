"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, formatISO, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { ItemType, StorageLocationType, InventoryItem } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const itemTypes: { value: ItemType; label: string }[] = [
  { value: "Reagent", label: "Reactivo" },
  { value: "Consumable", label: "Consumible" },
  { value: "Equipment Part", label: "Pieza de Equipo" },
  { value: "General Lab Supply", label: "Suministro General de Laboratorio" },
];

const storageLocationTypes: { value: StorageLocationType; label: string }[] = [
  { value: "Fridge", label: "Refrigerador" },
  { value: "Freezer", label: "Congelador" },
  { value: "Cabinet", label: "Armario" },
  { value: "Shelf", label: "Estante" },
  { value: "Room Temperature", label: "Temperatura Ambiente" },
];

const predefinedCategories: [string, ...string[]] = [
  "Enzimas",
  "Suministros de Pipeteo",
  "Solventes",
  "Kits",
  "EPP (Equipo de Protección Personal)",
  "Tubos y Viales",
  "Suministros de Electroforesis en Gel",
  "Material de Vidrio",
  "Químicos",
  "Buffers",
  "Medios de Cultivo Celular",
  "Suministros de Microscopía",
  "Consumibles Generales",
  "Partes de Hardware de Laboratorio",
  "Otro",
];
const itemTypeEnumValues = itemTypes.map((it) => it.value) as [
  ItemType,
  ...ItemType[]
];
const storageLocationTypeEnumValues = storageLocationTypes.map(
  (slt) => slt.value
) as [StorageLocationType, ...StorageLocationType[]];

const formSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(100),
  type: z.enum(itemTypeEnumValues),
  category: z.enum(predefinedCategories),
  lotNumber: z.string().max(50).optional(),
  provider: z.string().max(50).optional(),
  barcode: z.string().max(100).optional(),
  quantity: z.coerce.number().min(0, "La cantidad no puede ser negativa."),
  unit: z.string().min(1, "La unidad es requerida.").max(20),
  storageLocationType: z.enum(storageLocationTypeEnumValues),
  storageLocationName: z
    .string()
    .min(1, "El nombre de almacenamiento es requerido.")
    .max(50),
  storageLocationDetails: z.string().max(100).optional(),
  expirationDate: z.date().optional(),
  temperature: z.string().max(20).optional(),
  lowStockThreshold: z.coerce
    .number()
    .min(0, "El umbral no puede ser negativo."),
  notes: z.string().max(500).optional(),
});

type EditItemFormValues = z.infer<typeof formSchema>;

interface EditItemFormProps {
  item: InventoryItem;
}

export function EditItemForm({ item }: EditItemFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [storageOptions, setStorageOptions] = useState<{
    storageLocationTypes: string[];
    storageLocationNames: string[];
  }>({
    storageLocationTypes: [],
    storageLocationNames: [],
  });

  useEffect(() => {
    const fetchStorageOptions = async () => {
      try {
        const res = await fetch("/api/storage-options");
        const data = await res.json();
        setStorageOptions(data);
      } catch (error) {
        console.error("Error fetching storage options:", error);
      }
    };
    fetchStorageOptions();
  }, []);

  const form = useForm<EditItemFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...item,
      expirationDate: item.expirationDate
        ? parseISO(item.expirationDate)
        : undefined,
      storageLocationType: item.storageLocation.type,
      storageLocationName: item.storageLocation.name,
      storageLocationDetails: item.storageLocation.details,
    },
  });

  async function onSubmit(values: EditItemFormValues) {
    const updatedItemData = {
      ...values,
      expirationDate: values.expirationDate
        ? formatISO(values.expirationDate, { representation: "date" })
        : undefined,
      storageLocation: {
        type: values.storageLocationType,
        name: values.storageLocationName,
        details: values.storageLocationDetails,
      },
    };

    try {
      const res = await fetch(`/api/inventory/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedItemData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Unknown error");
      }

      const updatedItem = await res.json();
      toast({
        title: "Insumo Actualizado",
        description: `${updatedItem.name} ha sido actualizado exitosamente.`,
      });
      router.refresh();
      router.push(`/inventory/${updatedItem.id}`);
    } catch (error) {
      console.error("Error updating item:", error);
      toast({
        title: "Error al Actualizar",
        description:
          "No se pudo actualizar el insumo. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del Insumo*</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Polimerasa de ADN Taq" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo*</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo de insumo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {itemTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoría*</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona la categoría del insumo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {predefinedCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="provider"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Proveedor/Vendedor</FormLabel>
              <FormControl>
                <Input placeholder="Ej: BioSynth Inc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cantidad*</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Ej: 100" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unidad*</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: ml, piezas, kits" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="lotNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de Lote</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: LOTE001A" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="barcode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código de Barras</FormLabel>
                <FormControl>
                  <Input placeholder="Introducir o escanear código" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <h3 className="text-lg font-semibold font-headline pt-4 border-t">
          Información de Almacenamiento
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="storageLocationType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Almacenamiento*</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tipo de almacenamiento" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {storageOptions.storageLocationTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="storageLocationName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre de Almacenamiento*</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un almacenamiento" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {storageOptions.storageLocationNames.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="expirationDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha de Expiración</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: es })
                        ) : (
                          <span>Elige una fecha</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date("1900-01-01")}
                      initialFocus
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="temperature"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Temperatura de Almacenamiento</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: 4°C, -20°C, TA" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="lowStockThreshold"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Umbral de Stock Bajo*</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Ej: 10" {...field} />
              </FormControl>
              <FormDescription>
                Notificar cuando la cantidad alcance este nivel.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Cualquier nota adicional sobre el insumo..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full md:w-auto"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Guardar Cambios
        </Button>
      </form>
    </Form>
  );
}
