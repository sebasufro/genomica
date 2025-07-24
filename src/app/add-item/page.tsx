import { AddItemForm } from "@/components/app/add-item-form";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export default function AddItemPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline">
            Añadir Nuevo Insumo de Inventario
          </CardTitle>
          <CardDescription>
            Completa los detalles a continuación para añadir un nuevo insumo a
            tu inventario de laboratorio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddItemForm />
        </CardContent>
      </Card>
    </div>
  );
}
