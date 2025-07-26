"use client";

import type { ReagentUsageDataPoint } from "@/lib/types";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	ResponsiveContainer,
} from "recharts";
import { AlertTriangle } from "lucide-react";

interface ReagentUsageChartProps {
	data: ReagentUsageDataPoint[];
	isLoading?: boolean;
	error?: string;
}

const chartConfig = {
	usage: {
		label: "Uso",
		color: "hsl(var(--primary))",
	},
};

export function ReagentUsageChart({
	data,
	isLoading = false,
	error,
}: ReagentUsageChartProps) {
	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-full text-muted-foreground">
				<div className="text-center">
					<div className="animate-pulse">
						<div className="h-4 bg-muted rounded w-32 mx-auto mb-2"></div>
						<div className="h-3 bg-muted rounded w-24 mx-auto"></div>
					</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex items-center justify-center h-full text-muted-foreground">
				<div className="text-center">
					<AlertTriangle className="h-8 w-8 mx-auto mb-2 text-destructive" />
					<p className="text-sm">Error al cargar datos</p>
					<p className="text-xs mt-1">{error}</p>
				</div>
			</div>
		);
	}

	if (!data || data.length === 0) {
		return (
			<div className="flex items-center justify-center h-full text-muted-foreground">
				<div className="text-center">
					<div className="h-8 w-8 mx-auto mb-2 rounded-full bg-muted flex items-center justify-center">
						<span className="text-xs">📊</span>
					</div>
					<p className="text-sm">No hay datos de uso para mostrar</p>
					<p className="text-xs mt-1">
						Los datos aparecerán cuando haya actividad registrada
					</p>
				</div>
			</div>
		);
	}
	const validData = data.filter(
		(point) =>
			point &&
			typeof point.date === "string" &&
			typeof point.usage === "number" &&
			!isNaN(point.usage)
	);

	if (validData.length === 0) {
		return (
			<div className="flex items-center justify-center h-full text-muted-foreground">
				<div className="text-center">
					<AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
					<p className="text-sm">Datos de uso inválidos</p>
					<p className="text-xs mt-1">Por favor contacte al administrador</p>
				</div>
			</div>
		);
	}

	return (
		<ChartContainer config={chartConfig} className="w-full h-full">
			<ResponsiveContainer width="100%" height="100%">
				<LineChart
					data={validData}
					margin={{
						top: 5,
						right: 10,
						left: -15,
						bottom: 0,
					}}
				>
					<CartesianGrid
						strokeDasharray="3 3"
						vertical={false}
						stroke="hsl(var(--border))"
					/>
					<XAxis
						dataKey="date"
						tickLine={false}
						axisLine={false}
						tickMargin={8}
						tickFormatter={(value) => {
							if (typeof value === "string" && value.length > 6) {
								return value.slice(0, 6);
							}
							return value;
						}}
						className="text-xs"
					/>
					<YAxis
						domain={[0, "dataMax + 2"]}
						tickLine={false}
						axisLine={false}
						tickMargin={8}
						tickCount={6}
						className="text-xs"
					/>
					<ChartTooltip
						cursor={true}
						content={<ChartTooltipContent hideIndicator />}
					/>
					<Line
						dataKey="usage"
						type="monotone"
						stroke="var(--color-usage)"
						strokeWidth={2}
						dot={{ r: 3 }}
						activeDot={{ r: 6 }}
						connectNulls={false}
					/>
				</LineChart>
			</ResponsiveContainer>
		</ChartContainer>
	);
}
