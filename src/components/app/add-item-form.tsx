// src/components/app/add-item-form.tsx
"use client";

console.log("Environment variables:", {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
});

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
import { CalendarIcon, Loader2, ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, formatISO } from "date-fns";
import { es } from "date-fns/locale";
import type { ItemType, StorageLocationType, InventoryItem } from "@/lib/types";
import { addInventoryItem } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

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

type AddItemFormValues = z.infer<typeof formSchema>;

export function AddItemForm() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const barcode = searchParams.get("barcode");

  const form = useForm<AddItemFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: itemTypes[0].value,
      category: predefinedCategories[0],
      quantity: 0,
      unit: "",
      storageLocationType:
        storageLocationTypes.find((slt) => slt.label === "Temperatura Ambiente")
          ?.value || storageLocationTypes[0].value,
      storageLocationName: "",
      lowStockThreshold: 0,
    },
  });

  // AUTOCOMPLETADO POR BARCODE
  useEffect(() => {
    if (barcode) {
      fetch(`/api/getItemByBarcode?barcode=${barcode}`)
        .then((res) => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then((data) => {
          form.reset({
            name: data.name || "",
            type: data.type || itemTypes[0].value,
            category: data.category || predefinedCategories[0],
            lotNumber: data.lotNumber || "",
            provider: data.provider || "",
            barcode: data.barcode || barcode,
            quantity: 0,
            unit: data.unit || "",
            storageLocationType: data.storageLocation?.type || storageLocationTypes[0].value,
            storageLocationName: data.storageLocation?.name || "",
            storageLocationDetails: data.storageLocation?.details || "",
            expirationDate: undefined,
            temperature: data.temperature || "",
            lowStockThreshold: data.lowStockThreshold || 0,
            notes: data.notes || "",
          });
        })
        .catch(() => {
          // Si no existe, al menos precarga el barcode
          form.setValue("barcode", barcode);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barcode]);

  async function onSubmit(values: AddItemFormValues) {
    const newItemData: Omit<InventoryItem, "id" | "addedDate" | "imageUrl"> = {
      name: values.name,
      type: values.type,
      category: values.category,
      lotNumber: values.lotNumber || "", // Convertir undefined a string vacío
      provider: values.provider || "",
      barcode: values.barcode || "",
      quantity: values.quantity,
      unit: values.unit,
      storageLocation: {
        type: values.storageLocationType,
        name: values.storageLocationName,
        details: values.storageLocationDetails || "", // Convertir undefined a string vacío
      },
      expirationDate: values.expirationDate
        ? formatISO(values.expirationDate, { representation: "date" })
        : "", // Convertir undefined a string vacío
      temperature: values.temperature || "",
      lowStockThreshold: values.lowStockThreshold,
      notes: values.notes || "", // Convertir undefined a string vacío
    };

    try {
      const addedItem = await addInventoryItem(newItemData);
      toast({
        title: "Insumo Añadido",
        description: `${addedItem.name} ha sido añadido al inventario exitosamente.`,
      });
      router.push(`/inventory/${addedItem.id}`);
    } catch (error) {
      console.error("Error adding item:", error);
      toast({
        title: "Error al Añadir",
        description:
          "No se pudo añadir el insumo al inventario. Inténtalo de nuevo.",
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
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Introducir o escanear código"
                      {...field}
                      className="flex-grow"
                      // readOnly // Descomenta si quieres que sea solo lectura
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        toast({
                          title: "Función No Implementada",
                          description:
                            "El escaneo de código de barras estará disponible próximamente.",
                        });
                      }}
                      aria-label="Escanear código de barras"
                    >
                      <ScanLine className="h-5 w-5" />
                    </Button>
                  </div>
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
                    {storageLocationTypes.map((type) => (
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
          <FormField
            control={form.control}
            name="storageLocationName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre de Almacenamiento*</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej: Congelador Principal, Estante A"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="storageLocationDetails"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Detalles de Almacenamiento</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Estante 3, Contenedor 2" {...field} />
                </FormControl>
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
          Añadir Insumo al Inventario
        </Button>
      </form>
    </Form>
  );
}
