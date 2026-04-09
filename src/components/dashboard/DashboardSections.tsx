import type { DashboardSnapshot } from "@/lib/dashboard-client";
import { DieselComparison } from "./DieselComparison";
import { HistoricalChart } from "./HistoricalChart";
import { IntelligencePanel } from "./IntelligencePanel";
import { PriceTicker } from "./PriceTicker";

export function DashboardTopRow({ data }: { data: DashboardSnapshot }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <PriceTicker
        usdPrice={data.price.usd}
        phpPrice={data.price.php}
        phDieselPerLiter={data.diesel.phpPerLiter}
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
      <div className="glass-surface p-6 flex flex-col justify-between">
        <div>
          <p className="text-[10px] font-semibold text-[#64748B] tracking-[0.2em] uppercase mb-1">
            Tomorrow&apos;s Forecast
          </p>
          <p className="font-[Outfit] text-4xl font-bold text-white tracking-tight">
            ${data.intelligence.forecast.toFixed(2)}
          </p>
          <p className="text-xs text-[#64748B] mt-1">Linear Regression - Daily Target</p>
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
  );
}

export function DashboardMarketRow({ data }: { data: DashboardSnapshot }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <DieselComparison
        usdPerGallon={data.diesel.usdPerGallon}
        phpPerLiter={data.diesel.phpPerLiter}
        change24h={data.diesel.change24h}
      />
      <div className="lg:col-span-2">
        <HistoricalChart data={data.history} prediction={data.intelligence.forecast} />
      </div>
    </div>
  );
}
