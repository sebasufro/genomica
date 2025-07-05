import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScanLine, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import SimpleModal from "@/components/ui/SimpleModal";
import BarcodeScanner from "@/components/ui/BarcodeScanner";

export function QuickActionsCard({ className }: { className?: string }) {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [scannerOpen, setScannerOpen] = useState(false);

  const handleCodeDetected = async (code: string) => {
    setScannerOpen(false);
    try {
      const res = await fetch(`/api/getItemByBarcode?barcode=${code}`);
      if (res.ok) {
        // Producto encontrado, redirige para autocompletar formulario
        window.location.href = `/add-item?barcode=${encodeURIComponent(code)}`;
      } else {
        // Producto NO encontrado, igual redirige pero formulario vacío
        window.location.href = `/add-item?barcode=${encodeURIComponent(code)}`;
      }
    } catch {
      toast({
        title: "Error consultando backend.",
        description: "No se pudo buscar el producto.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="font-headline">Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {isMobile && (
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setScannerOpen(true)}
            >
              <ScanLine className="mr-2 h-4 w-4" />
              Escanear Código de Barras/QR
            </Button>
          )}
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() =>
              toast({
                title: "Función No Implementada",
                description: "Generación de informes está planificada para una futura actualización.",
                variant: "default",
              })
            }
          >
            <FileText className="mr-2 h-4 w-4" />
            Generar Informe
          </Button>
        </CardContent>
      </Card>
      <SimpleModal open={scannerOpen} onClose={() => setScannerOpen(false)}>
        <BarcodeScanner
          onResult={handleCodeDetected}
          onClose={() => setScannerOpen(false)}
        />
      </SimpleModal>
    </>
  );
}
