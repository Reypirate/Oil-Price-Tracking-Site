"use client";

import { BarChart3, Bell, Droplets, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { DieselComparison } from "./DieselComparison";
import { HistoricalChart } from "./HistoricalChart";
import { IntelligencePanel } from "./IntelligencePanel";
import { PriceTicker } from "./PriceTicker";

/* ─── Types ─── */
interface DashboardData {
  price: {
    usd: number;
    sgd: number;
    php: number;
    change24h: number;
    changeAmount: number;
  };
  diesel: {
    usdPerGallon: number;
    sgdPerLiter: number;
    phpPerLiter: number;
    change24h: number;
  };
  intelligence: {
    forecast: number;
    trend: "BULLISH" | "BEARISH" | "STAGNANT";
    mood: "OPTIMISTIC" | "NEUTRAL" | "CONCERNED";
    sentimentScore: number;
    keywords: string[];
  };
  history: Array<{ date: string; price: number }>;
}

/* ─── Loading Skeleton ─── */
function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 p-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="glass-surface p-6 space-y-4">
          <div className="skeleton h-4 w-24" />
          <div className="skeleton h-10 w-40" />
          <div className="skeleton h-4 w-32" />
          <div className="grid grid-cols-2 gap-3 pt-4">
            <div className="skeleton h-8 w-full" />
            <div className="skeleton h-8 w-full" />
          </div>
        </div>
      ))}
      <div className="col-span-1 md:col-span-2 lg:col-span-3 glass-surface p-6">
        <div className="skeleton h-[300px] w-full" />
      </div>
    </div>
  );
}

/* ─── Error State ─── */
function DashboardError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="glass-surface p-8 max-w-md text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-[#F43F5E]/10 flex items-center justify-center mx-auto">
          <Droplets className="w-6 h-6 text-[#F43F5E]" />
        </div>
        <h3 className="font-[Outfit] text-lg font-semibold text-white">Connection Failed</h3>
        <p className="text-sm text-[#94A3B8]">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 bg-[#22D3EE]/10 text-[#22D3EE] rounded-lg text-sm font-medium hover:bg-[#22D3EE]/20 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

/* ─── Main Dashboard Component ─── */
export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchDashboardData, 60_000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  return (
    <div className="min-h-screen bg-[#0B1121]">
      {/* ─── Navigation ─── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0B1121]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#22D3EE] to-[#0EA5E9] flex items-center justify-center shadow-lg shadow-[#22D3EE]/20">
              <Droplets className="w-5 h-5 text-[#0B1121]" />
            </div>
            <div>
              <h1 className="font-[Outfit] text-base font-bold text-white tracking-tight leading-none">
                OILPRICE <span className="text-[#22D3EE]">INTELLIGENCE</span>
              </h1>
              <p className="text-[10px] text-[#64748B] font-medium tracking-[0.15em] uppercase">
                Singapore × Philippines
              </p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { label: "Dashboard", icon: BarChart3, active: true },
              { label: "Alerts", icon: Bell, active: false },
            ].map(({ label, icon: Icon, active }) => (
              <Link
                key={label}
                href="/"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-[0.08em] uppercase transition-all duration-200 ${
                  active
                    ? "bg-[#22D3EE]/10 text-[#22D3EE]"
                    : "text-[#64748B] hover:text-[#94A3B8] hover:bg-white/[0.04]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="hidden md:block text-[10px] text-[#475569] tracking-wider font-mono">
                LAST UPDATE: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              type="button"
              onClick={fetchDashboardData}
              disabled={isLoading}
              className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] transition-colors disabled:opacity-30"
            >
              <RefreshCw className={`w-4 h-4 text-[#64748B] ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1E293B] to-[#334155] border border-white/10 flex items-center justify-center">
              <span className="text-[11px] font-bold text-white">JR</span>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Content ─── */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {isLoading && !data && <DashboardSkeleton />}
        {error && !data && <DashboardError message={error} onRetry={fetchDashboardData} />}
        {data && (
          <div className="space-y-5">
            {/* ─── Top Row: 3-Column Grid ─── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <PriceTicker
                usdPrice={data.price.usd}
                sgdPrice={data.price.sgd}
                phpPrice={data.price.php}
                change24h={data.price.change24h}
                changeAmount={data.price.changeAmount}
              />
              <IntelligencePanel
                mood={data.intelligence.mood}
                score={data.intelligence.sentimentScore}
                trend={data.intelligence.trend}
                keywords={data.intelligence.keywords}
                forecast={data.intelligence.forecast}
              />
              {/* Forecast Summary Card */}
              <div className="glass-surface p-6 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-semibold text-[#64748B] tracking-[0.2em] uppercase mb-1">
                    Tomorrow&apos;s Forecast
                  </p>
                  <p className="font-[Outfit] text-4xl font-bold text-white tracking-tight">
                    ${data.intelligence.forecast.toFixed(2)}
                  </p>
                  <p className="text-xs text-[#64748B] mt-1">Linear Regression · Daily Target</p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-[#64748B] tracking-[0.15em] uppercase">
                      Confidence
                    </span>
                    <span className="text-[10px] font-mono text-[#22D3EE]">8 data points</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#22D3EE] to-[#0EA5E9] transition-all duration-1000"
                      style={{ width: "72%" }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ─── Middle Row: Diesel + Chart ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <DieselComparison
                usdPerGallon={data.diesel.usdPerGallon}
                sgdPerLiter={data.diesel.sgdPerLiter}
                phpPerLiter={data.diesel.phpPerLiter}
                change24h={data.diesel.change24h}
              />
              <div className="lg:col-span-2">
                <HistoricalChart data={data.history} prediction={data.intelligence.forecast} />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ─── Footer ─── */}
      <footer className="max-w-7xl mx-auto px-6 py-8 border-t border-white/[0.04]">
        <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-[10px] text-[#334155] tracking-[0.15em] uppercase font-medium">
          <p>Estimated regional prices based on global crude benchmarks</p>
          <p>© 2026 OilPrice Intelligence · v0.1.0</p>
        </div>
      </footer>
    </div>
  );
}
