"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { getClientSession } from "@/lib/auth-client";
import { fetchDashboardSnapshot } from "@/lib/dashboard-client";
import { AlertsPanel } from "./AlertsPanel";

const WTI_FALLBACK_PRICE = 80;

type PriceReferenceState = {
  currentPrice: number;
  statusMessage: string | null;
};

type AuthState = {
  isAuthenticated: boolean;
  isLoading: boolean;
};

const initialState: PriceReferenceState = {
  currentPrice: WTI_FALLBACK_PRICE,
  statusMessage: "Loading live WTI reference price...",
};

export function AlertsPageContent() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
  });
  const [priceState, setPriceState] = useState<PriceReferenceState>(initialState);

  useEffect(() => {
    let cancelled = false;

    async function loadAuthState() {
      try {
        const session = await getClientSession();
        if (cancelled) {
          return;
        }
        setAuthState({
          isAuthenticated: Boolean(session),
          isLoading: false,
        });
      } catch {
        if (cancelled) {
          return;
        }
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
        });
      }
    }

    void loadAuthState();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (authState.isLoading || !authState.isAuthenticated) {
      return;
    }

    let cancelled = false;

    async function loadReferencePrice() {
      try {
        const snapshot = await fetchDashboardSnapshot();
        if (cancelled) {
          return;
        }

        const livePrice = Number(snapshot.price.usd);
        if (!Number.isFinite(livePrice) || livePrice <= 0) {
          setPriceState({
            currentPrice: WTI_FALLBACK_PRICE,
            statusMessage: `Live WTI price unavailable. Using fallback $${WTI_FALLBACK_PRICE.toFixed(
              2,
            )}.`,
          });
          return;
        }

        setPriceState({
          currentPrice: livePrice,
          statusMessage: null,
        });
      } catch {
        if (cancelled) {
          return;
        }
        setPriceState({
          currentPrice: WTI_FALLBACK_PRICE,
          statusMessage: `Unable to fetch live WTI price. Using fallback $${WTI_FALLBACK_PRICE.toFixed(
            2,
          )}.`,
        });
      }
    }

    void loadReferencePrice();
    return () => {
      cancelled = true;
    };
  }, [authState.isAuthenticated, authState.isLoading]);

  if (authState.isLoading) {
    return (
      <AppShell>
        <section className="glass-surface p-6 text-sm text-[#94A3B8]">
          Checking authentication status...
        </section>
      </AppShell>
    );
  }

  if (!authState.isAuthenticated) {
    return (
      <AppShell>
        <section className="glass-surface p-6 space-y-3">
          <h2 className="font-[Outfit] text-lg font-semibold text-white">Sign in required</h2>
          <p className="text-sm text-[#94A3B8]">
            Alerts are now scoped to your Supabase account. Sign in to create and manage your own
            alerts.
          </p>
          <Link
            href="/login?next=%2Falerts"
            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold tracking-[0.08em] uppercase bg-[#22D3EE]/10 text-[#22D3EE] hover:bg-[#22D3EE]/20 transition-colors"
          >
            Go to Sign In
          </Link>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <section className="glass-surface p-4">
          <p className="text-[10px] font-bold text-[#64748B] tracking-[0.2em] uppercase">
            Alert Defaults
          </p>
          <p className="mt-1 text-sm text-white">
            Current WTI reference price:{" "}
            <span className="font-mono text-[#22D3EE]">${priceState.currentPrice.toFixed(2)}</span>
          </p>
          {priceState.statusMessage && (
            <p className="mt-2 text-xs text-[#94A3B8]">{priceState.statusMessage}</p>
          )}
        </section>

        <AlertsPanel currentPrice={priceState.currentPrice} />
      </div>
    </AppShell>
  );
}
