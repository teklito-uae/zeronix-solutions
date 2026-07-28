import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

// Status colors are fixed, reserved tokens (never themed like categorical
// series hues) — accepted reads as the "good" outcome, sent is "in progress"
// (warning-toned, not a real warning), draft is neutral/muted. Same hex in
// light and dark per the dataviz status palette.
const chartConfig = {
  count: { label: "Quotes" },
  draft: { label: "Draft", color: "#898781" },
  sent: { label: "Sent", color: "#fab219" },
  accepted: { label: "Accepted", color: "#0ca30c" },
} satisfies ChartConfig;

export function StatusBreakdownChart({
  draft,
  sent,
  accepted,
}: {
  draft: number;
  sent: number;
  accepted: number;
}) {
  const data = [
    { status: "draft", label: "Draft", count: draft, fill: "var(--color-draft)" },
    { status: "sent", label: "Sent", count: sent, fill: "var(--color-sent)" },
    { status: "accepted", label: "Accepted", count: accepted, fill: "var(--color-accepted)" },
  ];

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-56 w-full">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barSize={40}>
        <CartesianGrid vertical={false} strokeDasharray="0" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={28}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel nameKey="status" />} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ChartContainer>
  );
}
