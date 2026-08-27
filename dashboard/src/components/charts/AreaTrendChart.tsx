"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import type { DailyTrendPoint } from "@/lib/types";

export function AreaTrendChart({
  data,
  color = "#22c55e",
  height = 260,
  tickInterval = 0,
}: {
  data: DailyTrendPoint[];
  color?: string;
  height?: number;
  tickInterval?: number;
}) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 8, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="area-trend-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.55} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            stroke="#71717a"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            interval={tickInterval}
            padding={{ left: 8, right: 8 }}
          />
          <Tooltip
            contentStyle={{
              background: "#18181b",
              border: "1px solid #27272a",
              borderRadius: 8,
              fontSize: 12,
              color: "#f5f5f5",
            }}
            labelStyle={{ color: "#a1a1aa" }}
            formatter={(value) => [Number(value).toLocaleString("nl-NL"), "Feedback"]}
          />
          <Area
            type="natural"
            dataKey="value"
            stroke={color}
            strokeWidth={2.5}
            fill="url(#area-trend-gradient)"
            dot={false}
            activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
