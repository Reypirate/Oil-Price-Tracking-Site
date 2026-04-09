"use client";

import { Calculator, Fuel } from "lucide-react";
import { useMemo, useState } from "react";

interface DieselComparisonProps {
  usdPerGallon: number;
  phpPerLiter: number;
  change24h: number;
}

const DEFAULTS = {
  kmPerLiter: 5,
  routeKmPerDay: 120,
  tripKm: 12,
  operatingDaysPerWeek: 6,
};

export function DieselComparison({ usdPerGallon, phpPerLiter, change24h }: DieselComparisonProps) {
  const [kmPerLiter, setKmPerLiter] = useState(DEFAULTS.kmPerLiter);
  const [routeKmPerDay, setRouteKmPerDay] = useState(DEFAULTS.routeKmPerDay);
  const [tripKm, setTripKm] = useState(DEFAULTS.tripKm);
  const [operatingDaysPerWeek, setOperatingDaysPerWeek] = useState(DEFAULTS.operatingDaysPerWeek);

  const isPositive = change24h >= 0;

  const metrics = useMemo(() => {
    const safeKmPerLiter = Math.max(0.1, kmPerLiter);
    const safeRouteKmPerDay = Math.max(1, routeKmPerDay);
    const safeTripKm = Math.max(0.1, tripKm);
    const safeDaysPerWeek = Math.min(7, Math.max(1, operatingDaysPerWeek));

    const costPerKm = phpPerLiter / safeKmPerLiter;
    const tripCost = costPerKm * safeTripKm;
    const dailyFuelCost = costPerKm * safeRouteKmPerDay;
    const weeklyFuelCost = dailyFuelCost * safeDaysPerWeek;

    return {
      costPerKm,
      tripCost,
      dailyFuelCost,
      weeklyFuelCost,
    };
  }, [kmPerLiter, operatingDaysPerWeek, phpPerLiter, routeKmPerDay, tripKm]);

  const formatPhp = (amount: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

  return (
    <div className="glass-surface p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-[#F59E0B]/10">
            <Fuel className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#64748B] tracking-[0.2em] uppercase">
              Philippines Diesel Planner
            </p>
            <p className="text-[10px] text-[#475569] mt-0.5">
              Diesel estimate: {formatPhp(phpPerLiter)}/L
              <span className={`ml-2 ${isPositive ? "text-[#10B981]" : "text-[#F43F5E]"}`}>
                {isPositive ? "+" : ""}
                {change24h.toFixed(1)}%
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="glass-surface-light p-4 border border-white/[0.06]">
          <p className="text-[9px] font-bold text-[#64748B] tracking-[0.2em] uppercase">
            Cost per km
          </p>
          <p className="font-[Outfit] text-2xl font-bold text-white mt-1">
            {formatPhp(metrics.costPerKm)}
          </p>
        </div>
        <div className="glass-surface-light p-4 border border-white/[0.06]">
          <p className="text-[9px] font-bold text-[#64748B] tracking-[0.2em] uppercase">
            Cost per trip
          </p>
          <p className="font-[Outfit] text-2xl font-bold text-white mt-1">
            {formatPhp(metrics.tripCost)}
          </p>
          <p className="text-[10px] text-[#475569] mt-0.5">{tripKm.toFixed(1)} km route</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-3">
          <p className="text-[9px] font-bold text-[#64748B] tracking-[0.2em] uppercase">
            Daily Fuel
          </p>
          <p className="text-sm font-semibold text-white mt-1">
            {formatPhp(metrics.dailyFuelCost)}
          </p>
        </div>
        <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-3">
          <p className="text-[9px] font-bold text-[#64748B] tracking-[0.2em] uppercase">
            Weekly Fuel
          </p>
          <p className="text-sm font-semibold text-white mt-1">
            {formatPhp(metrics.weeklyFuelCost)}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calculator className="w-3.5 h-3.5 text-[#22D3EE]" />
          <p className="text-[10px] font-bold text-[#64748B] tracking-[0.2em] uppercase">
            Jeep Inputs
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="text-[10px] text-[#64748B]">km per liter</span>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={kmPerLiter}
              onChange={(event) => setKmPerLiter(Number(event.target.value) || 0)}
              className="w-full rounded-lg bg-white/[0.04] border border-white/[0.12] px-3 py-2 text-sm text-white outline-none focus:border-[#22D3EE]/50"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-[10px] text-[#64748B]">trip km</span>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={tripKm}
              onChange={(event) => setTripKm(Number(event.target.value) || 0)}
              className="w-full rounded-lg bg-white/[0.04] border border-white/[0.12] px-3 py-2 text-sm text-white outline-none focus:border-[#22D3EE]/50"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-[10px] text-[#64748B]">km per day</span>
            <input
              type="number"
              min="1"
              step="1"
              value={routeKmPerDay}
              onChange={(event) => setRouteKmPerDay(Number(event.target.value) || 0)}
              className="w-full rounded-lg bg-white/[0.04] border border-white/[0.12] px-3 py-2 text-sm text-white outline-none focus:border-[#22D3EE]/50"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-[10px] text-[#64748B]">days/week</span>
            <input
              type="number"
              min="1"
              max="7"
              step="1"
              value={operatingDaysPerWeek}
              onChange={(event) => setOperatingDaysPerWeek(Number(event.target.value) || 0)}
              className="w-full rounded-lg bg-white/[0.04] border border-white/[0.12] px-3 py-2 text-sm text-white outline-none focus:border-[#22D3EE]/50"
            />
          </label>
        </div>
      </div>

      <p className="text-[10px] text-[#475569] mt-3">
        Wholesale reference: ${usdPerGallon.toFixed(2)}/gallon. Costs are estimates to help daily
        route planning.
      </p>
    </div>
  );
}
