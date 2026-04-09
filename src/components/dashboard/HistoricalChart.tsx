"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface HistoricalChartProps {
  data: Array<{ date: string; price: number }>;
  prediction?: number;
}

export function HistoricalChart({ data, prediction }: HistoricalChartProps) {
  const nextDateLabel = "Forecast";
  const displayData = prediction ? [...data, { date: nextDateLabel, price: prediction }] : data;

  return (
    <div className="glass-surface p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="font-[Outfit] text-base font-semibold text-white tracking-tight">
            Market Intelligence Chart
          </h3>
          <p className="text-[10px] text-[#475569] tracking-[0.1em] uppercase mt-0.5">
            WTI Crude Oil - Historical and Predicted
          </p>
        </div>
        <div className="flex gap-1">
          {["1W", "1M", "3M", "1Y"].map((range) => (
            <button
              type="button"
              key={range}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-[0.1em] transition-all ${
                range === "1M"
                  ? "bg-[#22D3EE]/15 text-[#22D3EE] border border-[#22D3EE]/20"
                  : "text-[#475569] hover:text-[#94A3B8] hover:bg-white/[0.04] border border-transparent"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={displayData} margin={{ top: 5, right: 5, bottom: 0, left: 5 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#22D3EE" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#475569", fontSize: 10, fontFamily: "Inter" }}
              minTickGap={25}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#475569", fontSize: 10, fontFamily: "JetBrains Mono" }}
              domain={["dataMin - 3", "dataMax + 3"]}
              tickFormatter={(value: number) => `$${value}`}
              width={50}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(15, 23, 42, 0.95)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "12px",
                fontSize: "12px",
                fontFamily: "JetBrains Mono",
                padding: "12px 16px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              }}
              itemStyle={{ color: "#22D3EE" }}
              labelStyle={{ color: "#94A3B8", marginBottom: "4px" }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, "Price"]}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="#22D3EE"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#priceGradient)"
              animationDuration={1200}
              animationEasing="ease-out"
              dot={false}
              activeDot={{
                r: 5,
                fill: "#22D3EE",
                stroke: "#0B1121",
                strokeWidth: 3,
              }}
            />
            {prediction && (
              <ReferenceLine
                x={nextDateLabel}
                stroke="#F59E0B"
                strokeDasharray="4 4"
                strokeOpacity={0.6}
                label={{
                  value: `$${prediction.toFixed(2)}`,
                  position: "top",
                  fill: "#F59E0B",
                  fontSize: 10,
                  fontFamily: "JetBrains Mono",
                }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/[0.04]">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 rounded-full bg-[#22D3EE]" />
          <span className="text-[10px] text-[#64748B] tracking-[0.1em] uppercase font-medium">
            Historical
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-0.5 rounded-full bg-[#F59E0B] opacity-60"
            style={{ borderTop: "1px dashed #F59E0B" }}
          />
          <span className="text-[10px] text-[#64748B] tracking-[0.1em] uppercase font-medium">
            Forecast (Linear Regression)
          </span>
        </div>
      </div>
    </div>
  );
}
