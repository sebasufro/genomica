"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScanLine, FileText } from "lucide-react"; // Removed Loader2
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
// Removed unused imports: useState, useEffect, InventoryItem, data functions, Genkit flow, Dialog, format, parseISO, es

interface QuickActionsCardProps {
  className?: string;
}

export function QuickActionsCard({ className }: QuickActionsCardProps) {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  // Removed unused state variables: inventory, isReportLoading, isReportDialogOpen, reportContent

  // Removed useEffect for inventory loading

  const handlePlaceholderClick = (featureName: string) => {
    toast({
      title: "Función No Implementada",
      description: `${featureName} está planificada para una futura actualización.`,
      variant: "default",
    });
  };

  // Removed handleGenerateReport function and its AI logic

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
              onClick={() =>
                handlePlaceholderClick("Escaneo de Código de Barras/QR")
              }
            >
              <ScanLine className="mr-2 h-4 w-4" />
              Escanear Código de Barras/QR
            </Button>
          )}
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => handlePlaceholderClick("Generación de Informes")}
          >
            <FileText className="mr-2 h-4 w-4" />
            Generar Informe
          </Button>
        </CardContent>
      </Card>
      {/* Removed Dialog for report display */}
    </>
  );
}
