"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";

interface RevenueChartProps {
  data: { date: string; revenue: number }[];
  periodType?: string;
}

// Thresholds for data aggregation
const WEEKLY_AGGREGATION_THRESHOLD = 60; // Aggregate by week for 60+ data points
const MONTHLY_AGGREGATION_THRESHOLD = 180; // Aggregate by month for 180+ data points

export function RevenueChart({ data, periodType = "today" }: RevenueChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        Tidak ada data untuk ditampilkan
      </div>
    );
  }

  // Determine if this is hourly data (today period with HH:00 format)
  const isHourly = periodType === "today" && data.some(d => d.date.includes(":"));

  // Aggregate data if too many points (only for daily data, not hourly)
  let chartData = data;
  let aggregationType: "hourly" | "daily" | "weekly" | "monthly" = isHourly ? "hourly" : "daily";

  if (!isHourly) {
    if (data.length >= MONTHLY_AGGREGATION_THRESHOLD) {
      chartData = aggregateByMonth(data);
      aggregationType = "monthly";
    } else if (data.length >= WEEKLY_AGGREGATION_THRESHOLD) {
      chartData = aggregateByWeek(data);
      aggregationType = "weekly";
    }
  }

  // Calculate max revenue from chart data
  const maxRevenue = Math.max(...chartData.map((d) => d.revenue));

  return <LineChart data={chartData} maxRevenue={maxRevenue} aggregationType={aggregationType} />;
}

// Aggregate daily data into weekly data
function aggregateByWeek(data: { date: string; revenue: number }[]) {
  const weeks: Map<string, { revenue: number; dates: string[] }> = new Map();

  data.forEach((item) => {
    const date = parseISO(item.date);
    // Get week number and year
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
    const weekKey = format(weekStart, "yyyy-'W'ww", { locale: id });

    const existing = weeks.get(weekKey);
    if (existing) {
      existing.revenue += item.revenue;
      existing.dates.push(item.date);
    } else {
      weeks.set(weekKey, { revenue: item.revenue, dates: [item.date] });
    }
  });

  return Array.from(weeks.entries()).map(([weekKey, value]) => ({
    date: weekKey,
    revenue: value.revenue,
  }));
}

// Aggregate daily data into monthly data
function aggregateByMonth(data: { date: string; revenue: number }[]) {
  const months: Map<string, number> = new Map();

  data.forEach((item) => {
    const date = parseISO(item.date);
    const monthKey = format(date, "yyyy-MM", { locale: id });

    months.set(monthKey, (months.get(monthKey) || 0) + item.revenue);
  });

  return Array.from(months.entries()).map(([monthKey, revenue]) => ({
    date: monthKey,
    revenue,
  }));
}

// Line Chart Component (works for all periods)
function LineChart({
  data,
  maxRevenue,
  aggregationType
}: {
  data: { date: string; revenue: number }[];
  maxRevenue: number;
  aggregationType: "hourly" | "daily" | "weekly" | "monthly";
}) {
  const chartWidth = 1000;
  const chartHeight = 200;
  const padding = { top: 10, right: 10, bottom: 30, left: 10 };

  const xStep = (chartWidth - padding.left - padding.right) / Math.max(data.length - 1, 1);

  const points = data.map((item, index) => {
    const x = padding.left + index * xStep;
    const y = padding.top + (chartHeight - padding.top - padding.bottom) * (1 - item.revenue / maxRevenue);
    return { x, y, data: item };
  });

  // Create path data for the line
  const pathD = points
    .map((point, index) => {
      if (index === 0) return `M ${point.x} ${point.y}`;
      return `L ${point.x} ${point.y}`;
    })
    .join(" ");

  // Create area fill (close the path at the bottom)
  const areaPathD = `${pathD} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;

  // Determine x-axis labels (show based on data length)
  const labelInterval = Math.ceil(data.length / 8); // Show max 8 labels
  const showLabel = (index: number) => index % labelInterval === 0 || index === data.length - 1;

  // Format label based on aggregation type
  const formatLabel = (dateStr: string) => {
    if (aggregationType === "monthly") {
      const [year, month] = dateStr.split("-");
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
      return `${monthNames[parseInt(month) - 1]} ${year}`;
    }
    if (aggregationType === "weekly") {
      // Format: 2025-W01 -> "W01"
      return dateStr.includes("'W") ? dateStr.split("-W")[1] : dateStr;
    }
    // Daily or Hourly
    return dateStr;
  };

  return (
    <div className="space-y-4">
      <div className="relative w-full h-[250px]">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <line
              key={`grid-${ratio}`}
              x1={padding.left}
              y1={padding.top + (chartHeight - padding.top - padding.bottom) * ratio}
              x2={chartWidth - padding.right}
              y2={padding.top + (chartHeight - padding.top - padding.bottom) * ratio}
              stroke="currentColor"
              strokeWidth="1"
              className="text-border/30"
              strokeDasharray="4 4"
            />
          ))}

          {/* Area fill */}
          <path
            d={areaPathD}
            fill="currentColor"
            className="text-primary/10"
          />

          {/* Line */}
          <path
            d={pathD}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-primary"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {points.map((point, index) => {
            const isLast = index === data.length - 1;

            return (
              <g key={point.data.date}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isLast ? 6 : 4}
                  fill="currentColor"
                  className={isLast ? "text-primary" : "text-white"}
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ cursor: "pointer" }}
                >
                  <title>{formatCurrency(point.data.revenue)}</title>
                </circle>
              </g>
            );
          })}
        </svg>

        {/* X-axis labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2">
          {points.map((point, index) => {
            if (!showLabel(index)) return null;
            return (
              <div
                key={point.data.date}
                className="text-xs text-muted-foreground"
                style={{
                  position: "absolute",
                  left: `${(point.x / chartWidth) * 100}%`,
                  transform: "translateX(-50%)",
                }}
              >
                {formatLabel(point.data.date)}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend with stats */}
      <div className="flex justify-between items-center text-sm">
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-muted-foreground">
              {aggregationType === "monthly" && "Pendapatan Bulanan"}
              {aggregationType === "weekly" && "Pendapatan Mingguan"}
              {aggregationType === "daily" && "Pendapatan Harian"}
              {aggregationType === "hourly" && "Pendapatan Per Jam"}
            </span>
          </div>
        </div>
        <div className="text-muted-foreground">
          {formatCurrency(maxRevenue)} tertinggi
        </div>
      </div>
    </div>
  );
}
