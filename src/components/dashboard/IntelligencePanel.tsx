"use client";

import { Activity, Brain, Minus, Quote, TrendingDown, TrendingUp, Zap } from "lucide-react";

interface IntelligencePanelProps {
  mood: "OPTIMISTIC" | "NEUTRAL" | "CONCERNED";
  score: number;
  trend: "BULLISH" | "BEARISH" | "STAGNANT";
  keywords: string[];
  forecast: number;
}

export function IntelligencePanel({
  mood,
  score,
  trend,
  keywords,
  forecast,
}: IntelligencePanelProps) {
  const moodConfig = {
    OPTIMISTIC: {
      color: "text-[#10B981]",
      bg: "bg-[#10B981]/10",
      border: "border-[#10B981]/20",
      label: "Optimistic",
      description: "Market sentiment is positive",
    },
    NEUTRAL: {
      color: "text-[#22D3EE]",
      bg: "bg-[#22D3EE]/10",
      border: "border-[#22D3EE]/20",
      label: "Neutral",
      description: "Market is balanced",
    },
    CONCERNED: {
      color: "text-[#F59E0B]",
      bg: "bg-[#F59E0B]/10",
      border: "border-[#F59E0B]/20",
      label: "Concerned",
      description: "Caution advised",
    },
  };

  const trendConfig = {
    BULLISH: { color: "text-[#10B981]", icon: TrendingUp, label: "Bullish" },
    BEARISH: { color: "text-[#F43F5E]", icon: TrendingDown, label: "Bearish" },
    STAGNANT: { color: "text-[#94A3B8]", icon: Minus, label: "Stagnant" },
  };

  const mc = moodConfig[mood];
  const tc = trendConfig[trend];
  const TrendIcon = tc.icon;

  return (
    <div className="glass-surface p-6 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-5">
        <div className="p-2 rounded-lg bg-[#22D3EE]/10">
          <Brain className="w-4 h-4 text-[#22D3EE]" />
        </div>
        <p className="text-[10px] font-bold text-[#64748B] tracking-[0.2em] uppercase">
          AI Intelligence Engine
        </p>
      </div>

      {/* Mood + Trend Row */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {/* Sentiment */}
        <div
          className={`glass-surface-light p-4 ${mc.border} border flex flex-col items-center justify-center text-center`}
        >
          <Quote className={`w-3.5 h-3.5 ${mc.color} opacity-50 mb-2`} />
          <p className="text-[9px] font-bold text-[#64748B] tracking-[0.2em] uppercase mb-1">
            Market Mood
          </p>
          <span className={`font-[Outfit] text-lg font-bold ${mc.color}`}>{mc.label}</span>
          <p className="text-[9px] text-[#475569] mt-0.5">Score: {score}</p>
        </div>

        {/* Trend */}
        <div className="glass-surface-light p-4 border border-white/[0.06] flex flex-col items-center justify-center text-center">
          <TrendIcon className={`w-3.5 h-3.5 ${tc.color} opacity-50 mb-2`} />
          <p className="text-[9px] font-bold text-[#64748B] tracking-[0.2em] uppercase mb-1">
            Trend Forecast
          </p>
          <span className={`font-[Outfit] text-lg font-bold ${tc.color}`}>{tc.label}</span>
          <p className="text-[9px] text-[#475569] mt-0.5">5-day momentum</p>
        </div>
      </div>

      {/* Keywords */}
      <div>
        <div className="flex items-center gap-1.5 text-[9px] font-bold text-[#475569] tracking-[0.15em] uppercase mb-2.5">
          <Activity className="w-3 h-3" />
          <span>Market Drivers (NLP)</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {keywords.length > 0 ? (
            keywords.map((word) => (
              <span
                key={word}
                className="px-2.5 py-1 bg-white/[0.04] rounded-full text-[10px] font-medium text-[#94A3B8] border border-white/[0.06] lowercase"
              >
                #{word}
              </span>
            ))
          ) : (
            <span className="text-[10px] text-[#475569]">No keywords detected</span>
          )}
        </div>
      </div>
    </div>
  );
}
