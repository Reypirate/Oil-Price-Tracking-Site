"use client";

import { TrendingDown, TrendingUp } from "lucide-react";

interface PriceTickerProps {
  usdPrice: number;
  phpPrice: number;
  phDieselPerLiter: number;
  change24h: number;
  changeAmount: number;
}

export function PriceTicker({
  usdPrice,
  phpPrice,
  phDieselPerLiter,
  change24h,
  changeAmount,
}: PriceTickerProps) {
  const isPositive = change24h >= 0;

  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);

  return (
    <div className="glass-surface p-6 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-semibold text-[#64748B] tracking-[0.2em] uppercase">
          WTI Crude Oil
        </p>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE] animate-pulse-live" />
          <span className="text-[10px] font-bold text-[#22D3EE] tracking-[0.15em] uppercase">
            Live
          </span>
        </div>
      </div>

      {/* Hero Price */}
      <div className="mb-1">
        <span className="font-[Outfit] text-5xl font-bold text-gradient-cyan tracking-tight leading-none">
          {formatCurrency(usdPrice, "USD")}
        </span>
        <span className="text-xs text-[#475569] ml-2 tracking-wider">/ BARREL</span>
      </div>

      {/* 24h Change */}
      <div
        className={`flex items-center gap-1.5 mb-6 ${isPositive ? "text-[#10B981]" : "text-[#F43F5E]"}`}
      >
        {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        <span className="text-sm font-semibold font-mono">
          {isPositive ? "+" : ""}
          {change24h.toFixed(2)}%
        </span>
        <span className="text-xs opacity-60 font-mono">
          ({isPositive ? "+" : ""}${changeAmount.toFixed(2)})
        </span>
      </div>

      {/* Philippines-focused benchmarks */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/[0.06]">
        <div>
          <p className="text-[10px] font-bold text-[#64748B] tracking-[0.15em] uppercase flex items-center gap-1.5 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
            PH Benchmark
          </p>
          <p className="text-lg font-bold text-white font-mono">
            {formatCurrency(phpPrice, "PHP")}
          </p>
          <p className="text-[10px] text-[#475569] mt-0.5">WTI equivalent / barrel</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-[#64748B] tracking-[0.15em] uppercase flex items-center gap-1.5 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            PH Diesel
          </p>
          <p className="text-lg font-bold text-white font-mono">
            {formatCurrency(phDieselPerLiter, "PHP")}
          </p>
          <p className="text-[10px] text-[#475569] mt-0.5">Estimated pump / liter</p>
        </div>
      </div>
    </div>
  );
}
