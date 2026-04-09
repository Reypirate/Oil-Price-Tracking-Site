"use client";

import { ArrowRight, Fuel } from "lucide-react";

interface DieselComparisonProps {
  usdPerGallon: number;
  sgdPerLiter: number;
  phpPerLiter: number;
  change24h: number;
}

export function DieselComparison({
  usdPerGallon,
  sgdPerLiter,
  phpPerLiter,
  change24h,
}: DieselComparisonProps) {
  const isPositive = change24h >= 0;

  const format = (amount: number, currency: string) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amount);

  // Which is cheaper?
  // Convert PHP to SGD equivalent for comparison: phpPerLiter / (56.5 / 1.35)
  const phpInSgd = phpPerLiter / (56.5 / 1.35);
  const cheaperRegion = phpInSgd < sgdPerLiter ? "PH" : "SG";
  const savingsPercent = Math.abs(((sgdPerLiter - phpInSgd) / sgdPerLiter) * 100);

  return (
    <div className="glass-surface p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-[#F59E0B]/10">
            <Fuel className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#64748B] tracking-[0.2em] uppercase">
              Diesel — Per Liter Comparison
            </p>
            <p className="text-[10px] text-[#475569] mt-0.5">
              Wholesale: {format(usdPerGallon, "USD")}/gal
              <span className={`ml-2 ${isPositive ? "text-[#10B981]" : "text-[#F43F5E]"}`}>
                {isPositive ? "+" : ""}
                {change24h.toFixed(1)}%
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Price Cards Side by Side */}
      <div className="grid grid-cols-2 gap-3">
        {/* Singapore */}
        <div
          className={`glass-surface-light p-4 border ${cheaperRegion === "SG" ? "border-[#10B981]/30" : "border-white/[0.06]"}`}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
            <p className="text-[9px] font-bold text-[#64748B] tracking-[0.2em] uppercase">
              Singapore
            </p>
            {cheaperRegion === "SG" && (
              <span className="ml-auto text-[8px] font-bold text-[#10B981] bg-[#10B981]/10 px-1.5 py-0.5 rounded-full tracking-wider uppercase">
                Cheaper
              </span>
            )}
          </div>
          <p className="font-[Outfit] text-2xl font-bold text-white">
            {format(sgdPerLiter, "SGD")}
          </p>
          <p className="text-[10px] text-[#475569] mt-0.5">per liter</p>
        </div>

        {/* Philippines */}
        <div
          className={`glass-surface-light p-4 border ${cheaperRegion === "PH" ? "border-[#10B981]/30" : "border-white/[0.06]"}`}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
            <p className="text-[9px] font-bold text-[#64748B] tracking-[0.2em] uppercase">
              Philippines
            </p>
            {cheaperRegion === "PH" && (
              <span className="ml-auto text-[8px] font-bold text-[#10B981] bg-[#10B981]/10 px-1.5 py-0.5 rounded-full tracking-wider uppercase">
                Cheaper
              </span>
            )}
          </div>
          <p className="font-[Outfit] text-2xl font-bold text-white">
            {format(phpPerLiter, "PHP")}
          </p>
          <p className="text-[10px] text-[#475569] mt-0.5">per liter</p>
        </div>
      </div>

      {/* Comparison Insight */}
      <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center gap-2">
        <ArrowRight className="w-3 h-3 text-[#22D3EE] flex-shrink-0" />
        <p className="text-[10px] text-[#94A3B8]">
          Diesel is{" "}
          <span className="text-[#10B981] font-semibold">
            ~{savingsPercent.toFixed(0)}% cheaper
          </span>{" "}
          in the {cheaperRegion === "PH" ? "Philippines" : "Singapore"} after converting to
          equivalent currency.
        </p>
      </div>
    </div>
  );
}
