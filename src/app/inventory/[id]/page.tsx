"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import type { InventoryItem } from "@/lib/types";
import { ItemDetailDisplay } from "@/components/app/item-detail-display";
import { Button } from "@/components/ui/button";
import {
	ArrowLeft,
	Edit,
	Trash2,
	MinusCircle,
	CheckCircle,
	AlertTriangle,
	BarChart2,
	History,
	Sigma,
	Loader2,
} from "lucide-react";
import Link from "next/link";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

// Types for usage data
interface UsageHistoryItem {
	date: Date;
	quantityUsed: number;
	notes?: string;
	userId?: string;
}

interface HistoryItem {
    date: string;
    quantityUsed: number;
    notes?: string;
    userId?: string;
}

interface UsageStats {
	totalUsedLast30Days: number;
	averageMonthlyUsage: number;
	lastUsedDate?: Date;
	usageCount: number;
}

export default function InventoryItemDetailPage() {
	const params = useParams();
	const router = useRouter();
	const { toast } = useToast();
	const [item, setItem] = useState<InventoryItem | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [useQuantity, setUseQuantity] = useState<number>(1);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [usageHistory, setUsageHistory] = useState<UsageHistoryItem[]>([]);
	const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
	const [loadingUsageData, setLoadingUsageData] = useState(false);

	const id = typeof params.id === "string" ? params.id : undefined;

	const fetchItem = useCallback(async () => {
		if (id) {
			setIsLoading(true);
			try {
				const res = await fetch(`/api/inventory/${id}`);
				const fetchedItem = await res.json();
				setItem(fetchedItem ?? null);
			} catch (error) {
				console.error("Error fetching item:", error);
				setItem(null);
				toast({
					title: "Error",
					description: "No se pudo cargar el insumo.",
					variant: "destructive",
				});
			} finally {
				setIsLoading(false);
			}
		} else {
			setItem(null);
			setIsLoading(false);
		}
	}, [id, toast]);

	const fetchUsageData = useCallback(async () => {
		if (!id) return;

		setLoadingUsageData(true);
		try {
			// Fetch usage history
			const historyRes = await fetch(`/api/inventory/history/${id}`);
			if (historyRes.ok) {
				const history = await historyRes.json();
				setUsageHistory(
					history.map((item: HistoryItem) => ({
						...item,
						date: new Date(item.date),
					}))
				);
			}

			// Fetch usage statistics
			const statsRes = await fetch(`/api/inventory/${id}/usage-stats`);
			if (statsRes.ok) {
				const stats = await statsRes.json();
				setUsageStats({
					...stats,
					lastUsedDate: stats.lastUsedDate
						? new Date(stats.lastUsedDate)
						: undefined,
				});
			}
		} catch (error) {
			console.error("Error fetching usage data:", error);
		} finally {
			setLoadingUsageData(false);
		}
	}, [id]);

	useEffect(() => {
		fetchItem();
	}, [fetchItem]);

	useEffect(() => {
		if (item) {
			fetchUsageData();
		}
	}, [item, fetchUsageData]);

	const handleUseItem = async () => {
		if (!item || useQuantity <= 0 || useQuantity > item.quantity) {
			toast({
				title: "Cantidad Inválida",
				description: "Por favor, introduce una cantidad válida para usar.",
				variant: "destructive",
			});
			return;
		}
		setIsSubmitting(true);
		try {
			const res = await fetch(`/api/inventory/${item.id}/use`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					quantityUsed: useQuantity,
					notes: `Uso registrado desde la interfaz de detalles`,
				}),
			});

			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.error || "Unknown error");
			}

			const updatedItem = await res.json();
			if (updatedItem) {
				setItem(updatedItem);
				toast({
					title: "Insumo Usado",
					description: `${useQuantity} ${item.unit}(s) de ${item.name} usados. Cantidad actualizada.`,
					action: <CheckCircle className="text-green-500" />,
				});
				setUseQuantity(1);
				// Refresh usage data
				fetchUsageData();
			} else {
				toast({
					title: "Error",
					description: "Error al actualizar la cantidad del insumo.",
					variant: "destructive",
				});
			}
		} catch (error) {
			console.error("Error using item:", error);
			toast({
				title: "Error",
				description: "Ocurrió un error al usar el insumo.",
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteItem = async () => {
		if (!item) return;
		setIsSubmitting(true);
		try {
			const res = await fetch(`/api/inventory/${item.id}`, {
				method: "DELETE",
			});

			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.error || "Unknown error");
			}

			toast({
				title: "Insumo Eliminado",
				description: `${item.name} ha sido eliminado del inventario.`,
			});
			router.push("/inventory");
		} catch (error) {
			console.error("Error deleting item:", error);
			toast({
				title: "Error",
				description: "Ocurrió un error al eliminar el insumo.",
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
				<Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
				<p className="text-muted-foreground">Cargando detalles del insumo...</p>
			</div>
		);
	}

	if (!item) {
		return (
			<div className="text-center py-10">
				<AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
				<h2 className="text-2xl font-headline font-semibold mb-2">
					Insumo No Encontrado
				</h2>
				<p className="text-muted-foreground mb-6">
					El insumo de inventario que buscas no existe o no pudo ser cargado.
				</p>
				<Button asChild variant="outline">
					<Link href="/inventory">
						<ArrowLeft className="mr-2 h-4 w-4" /> Volver al Inventario
					</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<Button asChild variant="outline" size="sm">
					<Link href="/inventory">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Volver al Inventario
					</Link>
				</Button>
				<div className="flex gap-2">
					<Button asChild variant="outline" size="sm">
          				<Link href={`/inventory/${item.id}/edit`} passHref>
							<Edit className="mr-2 h-4 w-4" />
          				  	Editar
          				</Link>
					</Button>
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button variant="destructive" size="sm" disabled={isSubmitting}>
								{isSubmitting ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : (
									<Trash2 className="mr-2 h-4 w-4" />
								)}
								Eliminar
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>
									¿Seguro que quieres eliminar este insumo?
								</AlertDialogTitle>
								<AlertDialogDescription>
									Esta acción no se puede deshacer. Esto eliminará
									permanentemente &quot;{item.name}&quot; de tu inventario.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancelar</AlertDialogCancel>
								<AlertDialogAction
									onClick={handleDeleteItem}
									disabled={isSubmitting}
								>
									{isSubmitting ? (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									) : null}
									Eliminar
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="order-1 lg:col-span-2">
					<ItemDetailDisplay item={item} />
				</div>

				<div className="order-2 lg:order-4 lg:col-span-1">
					<Card>
						<CardHeader>
							<CardTitle className="font-headline text-xl">
								Usar Insumo
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex flex-col sm:flex-row gap-4 sm:items-end">
								<div className="flex flex-col gap-1 flex-grow">
									<Label
										htmlFor="use-quantity"
										className="block text-sm font-medium"
									>
										Cantidad a Usar ({item.unit})
									</Label>
									<Input
										id="use-quantity"
										type="number"
										value={useQuantity}
										onChange={(e) =>
											setUseQuantity(
												Math.max(1, parseInt(e.target.value, 10) || 1)
											)
										}
										min="0"
										max={item.quantity}
										className="w-full"
										disabled={isSubmitting}
									/>
								</div>
								<Button
									onClick={handleUseItem}
									disabled={
										isSubmitting ||
										item.quantity === 0 ||
										useQuantity > item.quantity ||
										useQuantity <= 0
									}
									className="w-full sm:w-auto"
								>
									{isSubmitting ? (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									) : (
										<MinusCircle className="mr-2 h-4 w-4" />
									)}
									Confirmar Uso
								</Button>
							</div>
							{item.quantity === 0 && (
								<p className="text-destructive text-sm mt-2">
									Este insumo está agotado.
								</p>
							)}
							{useQuantity > item.quantity && item.quantity > 0 && (
								<p className="text-destructive text-sm mt-2">
									No se puede usar más cantidad de la disponible.
								</p>
							)}
							{useQuantity <= 0 && (
								<p className="text-destructive text-sm mt-2">
									La cantidad a usar debe ser mayor a cero.
								</p>
							)}
						</CardContent>
					</Card>
				</div>

				<div className="order-3 lg:order-2 lg:col-span-2">
					<Card>
						<CardHeader>
							<CardTitle className="font-headline flex items-center gap-2">
								<Sigma size={20} /> Estadísticas
							</CardTitle>
							<CardDescription>
								Métricas y proyecciones de uso del insumo.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{loadingUsageData ? (
    						    <div className="bg-muted/50 p-4 rounded-lg flex items-center justify-center h-[90px]">
    						        <Loader2 className="h-8 w-8 animate-spin text-primary" />
    						    </div>
    						) : (
								<div className="bg-muted/50 p-4 rounded-lg flex items-center justify-center h-[90px]">
									<BarChart2
										className="h-12 w-12 text-primary"
										data-ai-hint="chart placeholder"
									/>
								</div>
							)}
							<div className="space-y-2 text-sm">
								<div className="flex justify-between">
									<span>Uso en los últimos 30 días:</span>
									<span className="font-medium">
										{usageStats?.totalUsedLast30Days || 0}{" "}
										{item.unit || "unidades"}
									</span>
								</div>
								<div className="flex justify-between">
									<span>Promedio de uso mensual:</span>
									<span className="font-medium">
										{usageStats?.averageMonthlyUsage || 0}{" "}
										{item.unit || "unidades"}
									</span>
								</div>
								<div className="flex justify-between">
									<span>Total de registros de uso:</span>
									<span className="font-medium">
										{usageStats?.usageCount || 0} veces
									</span>
								</div>
								<div className="flex justify-between">
									<span>Última vez utilizado:</span>
									<span className="font-medium">
										{usageStats?.lastUsedDate
											? format(usageStats.lastUsedDate, "P", { locale: es })
											: item.lastUsedDate
											? format(parseISO(item.lastUsedDate), "P", { locale: es })
											: "N/A"}
									</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				<div className="order-4 lg:order-3 lg:col-span-1">
					<Card>
						<CardHeader>
							<CardTitle className="font-headline flex items-center gap-2">
								<History size={20} /> Usos Recientes
							</CardTitle>
							<CardDescription>
								Historial de consumo de este insumo.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							{loadingUsageData ? (
								<div className="flex items-center justify-center py-8">
									<Loader2 className="h-6 w-6 animate-spin text-primary" />
								</div>
							) : usageHistory.length > 0 ? (
								<>
									{usageHistory.slice(0, 5).map((usage, index) => (
										<div key={index} className="p-3 border rounded-md text-sm">
											<p className="font-medium">
												Fecha:{" "}
												{format(usage.date, "dd/MM/yyyy HH:mm", { locale: es })}
											</p>
											<p className="text-muted-foreground">
												Cantidad usada: {usage.quantityUsed}{" "}
												{item.unit || "unidades"}
											</p>
											{usage.notes && (
												<p className="text-xs text-muted-foreground mt-1">
													Notas: {usage.notes}
												</p>
											)}
										</div>
									))}
									<p className="text-xs text-center text-muted-foreground pt-2">
										Mostrando los {Math.min(5, usageHistory.length)} usos más
										recientes.
									</p>
								</>
							) : (
								<div className="text-center py-8">
									<History className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
									<p className="text-sm text-muted-foreground">
										No hay registros de uso para este insumo.
									</p>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
