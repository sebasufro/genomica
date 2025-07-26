"use client";

import { useState, useEffect } from "react";
import type { InventoryItem, ReagentUsageDataPoint } from "@/lib/types";
import { DashboardMetricCard } from "@/components/app/dashboard-metric-card";
import { QuickActionsCard } from "@/components/app/quick-actions-card";
import { ReagentUsageChart } from "@/components/app/reagent-usage-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Archive,
	CalendarClock,
	FlaskConical,
	History,
	PackageX,
	LineChart as LineChartIcon,
	Loader2,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface DashboardStats {
	totalItems: number;
	totalReagents: number;
	lowStock: InventoryItem[];
	nearingExpiration: InventoryItem[];
	recentlyUsed: InventoryItem[];
}

export default function DashboardPage() {
	const [stats, setStats] = useState<DashboardStats>({
		totalItems: 0,
		totalReagents: 0,
		lowStock: [],
		nearingExpiration: [],
		recentlyUsed: [],
	});
	const [reagentUsageData, setReagentUsageData] = useState<
		ReagentUsageDataPoint[]
	>([]);
	const [isLoading, setIsLoading] = useState(true);
	const isMobile = useIsMobile();

	useEffect(() => {
		const fetchDashboardData = async () => {
			setIsLoading(true);
			try {
				const res = await fetch("/api/dashboard");
				const { stats, reagentUsageData } = await res.json();
				setStats(stats);
				setReagentUsageData(reagentUsageData);
			} catch (error) {
				console.error("Error fetching dashboard data:", error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchDashboardData();
	}, []);

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
				<Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
				<p className="text-muted-foreground">Cargando dashboard...</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
				<DashboardMetricCard
					title="Insumos Totales"
					count={stats.totalItems}
					icon={Archive}
					items={[]}
					viewAllLink="/inventory"
					itemDescriptionKey={() => `${stats.totalItems} insumos en el sistema`}
					emptyStateMessage="No hay insumos en el inventario."
					className="xl:col-span-1"
				/>
				<DashboardMetricCard
					title="Reactivos Totales"
					count={stats.totalReagents}
					icon={FlaskConical}
					items={[]}
					viewAllLink="/inventory?type=Reagent"
					itemDescriptionKey={(item) => item.category}
					itemBadgeKey={(item) => `${item.quantity} ${item.unit}`}
					emptyStateMessage="No hay reactivos en el inventario."
					className="xl:col-span-1"
				/>
				<DashboardMetricCard
					title="Alertas de Stock Bajo"
					count={stats.lowStock.length}
					items={stats.lowStock.slice(0, 3)}
					icon={PackageX}
					viewAllLink="/inventory?filter=low_stock"
					itemBadgeKey={(item) =>
						`${item.quantity} / ${item.lowStockThreshold}`
					}
					itemBadgeVariant="destructive"
					itemDescriptionKey={(item) =>
						`Umbral: ${item.lowStockThreshold} ${item.unit}`
					}
					emptyStateMessage="No hay insumos con stock bajo actualmente."
					className="xl:col-span-1"
				/>
				<DashboardMetricCard
					title="Por Expirar"
					count={stats.nearingExpiration.length}
					items={stats.nearingExpiration.slice(0, 3)}
					icon={CalendarClock}
					viewAllLink="/inventory?filter=nearing_expiration"
					itemBadgeKey={(item) =>
						item.expirationDate
							? format(parseISO(item.expirationDate), "dd MMM", { locale: es })
							: "N/A"
					}
					itemBadgeVariant="destructive"
					itemDescriptionKey={(item) =>
						item.expirationDate
							? `Expira: ${format(
									parseISO(item.expirationDate),
									"dd 'de' MMMM 'de' yyyy",
									{ locale: es }
							  )}`
							: "Sin fecha de expiración"
					}
					emptyStateMessage="Ningún insumo está por expirar."
					className="xl:col-span-1"
				/>
				<DashboardMetricCard
					title="Usados Recientemente"
					count={stats.recentlyUsed.length}
					items={stats.recentlyUsed.slice(0, 3)}
					icon={History}
					viewAllLink="/inventory?filter=recently_used"
					itemBadgeKey={(item) =>
						item.lastUsedDate
							? format(parseISO(item.lastUsedDate), "dd MMM", { locale: es })
							: "N/A"
					}
					itemBadgeVariant="secondary"
					itemDescriptionKey={(item) =>
						item.lastUsedDate
							? `Último uso: ${format(
									parseISO(item.lastUsedDate),
									"dd 'de' MMMM 'de' yyyy",
									{ locale: es }
							  )}`
							: "No usado recientemente"
					}
					emptyStateMessage="Ningún insumo ha sido usado recientemente."
					className="xl:col-span-1"
				/>
			</div>

			<div className="grid gap-6 grid-cols-1 md:grid-cols-3">
				<QuickActionsCard className="md:col-span-1" />
				<Card className="md:col-span-2">
					<CardHeader>
						<CardTitle className="font-headline flex items-center gap-2">
							<LineChartIcon className="h-5 w-5 text-muted-foreground" />
							Visión General del Uso de Reactivos
						</CardTitle>
					</CardHeader>
					<CardContent
						className={cn("pr-0", isMobile ? "h-[200px]" : "h-[300px]")}
					>
						{reagentUsageData.length > 0 ? (
							<ReagentUsageChart data={reagentUsageData} />
						) : (
							<div className="flex items-center justify-center h-full text-muted-foreground">
								<p>No hay datos de uso disponibles.</p>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
