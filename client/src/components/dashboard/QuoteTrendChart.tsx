import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { DashboardStats } from "@/lib/types";

// Two plain-identity series (volume comparison, not a status readout) —
// categorical slots 1 (blue) and 2 (orange), the validated adjacent pair
// from the fixed default order.
const chartConfig = {
  quotes_created: {
    label: "Created",
    theme: { light: "#2a78d6", dark: "#3987e5" },
  },
  quotes_accepted: {
    label: "Accepted",
    theme: { light: "#eb6834", dark: "#d95926" },
  },
} satisfies ChartConfig;

function formatMonth(month: string): string {
  const [year, m] = month.split("-");
  const date = new Date(Number(year), Number(m) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "short" });
}

export function QuoteTrendChart({ data }: { data: DashboardStats["monthly_trend"] }) {
  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-56 w-full">
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="0" />
        <XAxis
          dataKey="month"
          tickFormatter={formatMonth}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} tickMargin={8} width={28} />
        <ChartTooltip
          content={<ChartTooltipContent labelFormatter={(_, payload) => formatMonth(String(payload[0]?.payload.month ?? ""))} />}
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          type="monotone"
          dataKey="quotes_created"
          stroke="var(--color-quotes_created)"
          strokeWidth={2}
          dot={{ r: 4, fill: "var(--color-quotes_created)" }}
        />
        <Line
          type="monotone"
          dataKey="quotes_accepted"
          stroke="var(--color-quotes_accepted)"
          strokeWidth={2}
          dot={{ r: 4, fill: "var(--color-quotes_accepted)" }}
        />
      </LineChart>
    </ChartContainer>
  );
}
