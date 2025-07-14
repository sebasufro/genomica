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

interface ReagentUsageChartProps {
  data: ReagentUsageDataPoint[];
}

const chartConfig = {
  usage: {
    label: "Uso", // Translated label
    color: "hsl(var(--primary))",
  },
};

export function ReagentUsageChart({ data }: ReagentUsageChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>No hay datos de uso para mostrar.</p>
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
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
            // Assuming date is already localized or a simple format like "Jun 10"
            tickFormatter={(value) => value.slice(0, 6)}
            className="text-xs"
          />
          <YAxis
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
            dot={true}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
