"use client";

import { Bell, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchAlerts } from "@/lib/alerts-client";

type AlertsSummaryState = {
  activeCount: number;
  isLoading: boolean;
  message: string | null;
};

const initialState: AlertsSummaryState = {
  activeCount: 0,
  isLoading: true,
  message: null,
};

function mapSummaryMessage(errorMessage: string): string {
  if (errorMessage.includes("Unauthorized")) {
    return "Sign in with Supabase Auth to view your alert summary.";
  }
  if (errorMessage.includes("No profile found")) {
    return "Sign in once with Supabase Auth to enable alerts.";
  }
  return "Alert summary is temporarily unavailable.";
}

export function HomeAlertsSummary() {
  const [state, setState] = useState<AlertsSummaryState>(initialState);

  useEffect(() => {
    let cancelled = false;

    async function loadAlertsSummary() {
      setState((prev) => ({ ...prev, isLoading: true, message: null }));
      try {
        const result = await fetchAlerts();
        if (cancelled) {
          return;
        }
        setState({
          activeCount: result.alerts.length,
          isLoading: false,
          message: null,
        });
      } catch (error: unknown) {
        if (cancelled) {
          return;
        }
        const message = error instanceof Error ? mapSummaryMessage(error.message) : null;
        setState({
          activeCount: 0,
          isLoading: false,
          message,
        });
      }
    }

    void loadAlertsSummary();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="glass-surface p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-[#22D3EE]/10">
            <Bell className="w-4 h-4 text-[#22D3EE]" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#64748B] tracking-[0.2em] uppercase">
              Alert Snapshot
            </p>
            <p className="text-[10px] text-[#475569] mt-0.5">
              Quick status for your active price triggers.
            </p>
          </div>
        </div>

        <Link
          href="/alerts"
          className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold tracking-[0.08em] uppercase bg-[#22D3EE]/10 text-[#22D3EE] hover:bg-[#22D3EE]/20 transition-colors"
        >
          Manage Alerts
        </Link>
      </div>

      <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-5">
        {state.isLoading ? (
          <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Loading alert summary...
          </div>
        ) : (
          <p className="text-sm text-white">
            Active alerts:{" "}
            <span className="font-[Outfit] text-xl text-[#22D3EE]">{state.activeCount}</span>
          </p>
        )}

        {state.message && (
          <p className="mt-2 text-xs text-[#FCA5A5] border border-[#F43F5E]/30 bg-[#F43F5E]/10 rounded-md px-2.5 py-2">
            {state.message}
          </p>
        )}
      </div>
    </section>
  );
}
