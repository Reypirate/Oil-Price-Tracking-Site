"use client";

import { Droplets, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { type DashboardSnapshot, fetchDashboardSnapshot } from "@/lib/dashboard-client";
import { DASHBOARD_POLL_INTERVAL_MS, shouldDashboardPoll } from "@/lib/dashboard-polling";
import { DashboardMarketRow, DashboardTopRow } from "./DashboardSections";
import { HomeAlertsSummary } from "./HomeAlertsSummary";

type DashboardData = DashboardSnapshot;

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {[1, 2, 3].map((item) => (
        <div key={item} className="glass-surface p-6 space-y-4">
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

function DashboardHeaderActions({
  isLoading,
  lastUpdated,
  onRefresh,
}: {
  isLoading: boolean;
  lastUpdated: Date | null;
  onRefresh: () => void;
}) {
  return (
    <>
      {lastUpdated && (
        <span className="hidden md:block text-[10px] text-[#475569] tracking-wider font-mono">
          LAST UPDATE: {lastUpdated.toLocaleTimeString()}
        </span>
      )}
      <button
        type="button"
        onClick={onRefresh}
        disabled={isLoading}
        className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] transition-colors disabled:opacity-30"
        aria-label="Refresh dashboard"
      >
        <RefreshCw className={`w-4 h-4 text-[#64748B] ${isLoading ? "animate-spin" : ""}`} />
      </button>
    </>
  );
}

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const snapshot = await fetchDashboardSnapshot();
      setData(snapshot);
      setLastUpdated(new Date());
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const startPolling = () => {
      if (intervalId) {
        return;
      }
      intervalId = setInterval(() => {
        void fetchDashboardData();
      }, DASHBOARD_POLL_INTERVAL_MS);
    };

    const stopPolling = () => {
      if (!intervalId) {
        return;
      }
      clearInterval(intervalId);
      intervalId = undefined;
    };

    const syncPollingWithVisibility = () => {
      if (!shouldDashboardPoll(document.visibilityState)) {
        stopPolling();
        return;
      }

      void fetchDashboardData();
      startPolling();
    };

    void fetchDashboardData();
    if (shouldDashboardPoll(document.visibilityState)) {
      startPolling();
    }

    document.addEventListener("visibilitychange", syncPollingWithVisibility);
    window.addEventListener("focus", syncPollingWithVisibility);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", syncPollingWithVisibility);
      window.removeEventListener("focus", syncPollingWithVisibility);
    };
  }, [fetchDashboardData]);

  return (
    <AppShell
      headerActions={
        <DashboardHeaderActions
          isLoading={isLoading}
          lastUpdated={lastUpdated}
          onRefresh={() => {
            void fetchDashboardData();
          }}
        />
      }
    >
      {isLoading && !data && <DashboardSkeleton />}
      {error && !data && (
        <DashboardError message={error} onRetry={() => void fetchDashboardData()} />
      )}
      {data && (
        <div className="space-y-5">
          <DashboardTopRow data={data} />
          <DashboardMarketRow data={data} />
          <HomeAlertsSummary />
        </div>
      )}
    </AppShell>
  );
}
