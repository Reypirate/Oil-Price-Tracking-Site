"use client";

import { Bell, Loader2, Plus, Power, Send } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type AlertCondition,
  type AlertRecord,
  createAlert,
  fetchAlerts as fetchAlertsApi,
  sendTestAlertEmail,
  updateAlert,
} from "@/lib/alerts-client";

type CreateAlertForm = {
  assetCode: string;
  condition: AlertCondition;
  recipientEmail: string;
  thresholdPrice: string;
};

const DEFAULT_ASSET = "WTI_USD";

function formatCondition(condition: AlertCondition) {
  return condition === "above" ? "Above" : "Below";
}

export function AlertsPanel({ currentPrice }: { currentPrice: number }) {
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [profileEmail, setProfileEmail] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [isUpdatingIds, setIsUpdatingIds] = useState<Record<string, boolean>>({});

  const defaultThreshold = useMemo(() => currentPrice.toFixed(2), [currentPrice]);
  const [form, setForm] = useState<CreateAlertForm>({
    assetCode: DEFAULT_ASSET,
    condition: "above",
    thresholdPrice: defaultThreshold,
    recipientEmail: "",
  });

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      thresholdPrice: prev.thresholdPrice || defaultThreshold,
    }));
  }, [defaultThreshold]);

  const loadAlerts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setStatusMessage(null);
    try {
      const response = await fetchAlertsApi();
      setAlerts(response.alerts);
      setProfileEmail(response.profileEmail || "");
      setForm((prev) => ({
        ...prev,
        recipientEmail: prev.recipientEmail || response.profileEmail || "",
      }));
    } catch (fetchError: unknown) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to fetch alerts");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const openModal = () => {
    setForm({
      assetCode: DEFAULT_ASSET,
      condition: "above",
      thresholdPrice: defaultThreshold,
      recipientEmail: profileEmail,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
  };

  const submitAlert = async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setStatusMessage(null);
    try {
      const thresholdPrice = Number(form.thresholdPrice);
      if (!Number.isFinite(thresholdPrice) || thresholdPrice <= 0) {
        throw new Error("Threshold price must be a positive number.");
      }
      if (!form.recipientEmail.trim()) {
        throw new Error("Recipient email is required.");
      }

      await createAlert({
        assetCode: form.assetCode,
        condition: form.condition,
        thresholdPrice,
        recipientEmail: form.recipientEmail,
      });

      setIsModalOpen(false);
      await loadAlerts();
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : "Failed to create alert");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deactivateAlert = async (alertId: string) => {
    if (isUpdatingIds[alertId]) {
      return;
    }

    setIsUpdatingIds((prev) => ({ ...prev, [alertId]: true }));
    setError(null);
    setStatusMessage(null);
    try {
      await updateAlert(alertId, { isActive: false });
      await loadAlerts();
    } catch (updateError: unknown) {
      setError(updateError instanceof Error ? updateError.message : "Failed to deactivate alert");
    } finally {
      setIsUpdatingIds((prev) => {
        const next = { ...prev };
        delete next[alertId];
        return next;
      });
    }
  };

  const sendTestEmail = async () => {
    if (isSendingTestEmail) {
      return;
    }

    setIsSendingTestEmail(true);
    setError(null);
    setStatusMessage(null);
    try {
      const recipientEmail = (form.recipientEmail || profileEmail).trim();
      if (!recipientEmail) {
        throw new Error("Recipient email is required.");
      }

      const result = await sendTestAlertEmail({
        recipientEmail,
        currentPrice,
        assetCode: DEFAULT_ASSET,
      });

      setStatusMessage(
        `Test email sent to ${result.recipientEmail}. Check Maildev at http://localhost:1080.`,
      );
      setForm((prev) => ({
        ...prev,
        recipientEmail: result.recipientEmail,
      }));
    } catch (testError: unknown) {
      setError(testError instanceof Error ? testError.message : "Failed to send test email");
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  return (
    <section id="alerts-section" className="glass-surface p-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-[#22D3EE]/10">
            <Bell className="w-4 h-4 text-[#22D3EE]" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#64748B] tracking-[0.2em] uppercase">
              Alert Center
            </p>
            <p className="text-[10px] text-[#475569] mt-0.5">
              {profileEmail ? `Sending to: ${profileEmail}` : "No recipient email configured yet"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openModal}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold tracking-[0.08em] uppercase bg-[#22D3EE]/10 text-[#22D3EE] hover:bg-[#22D3EE]/20 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New Alert
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={sendTestEmail}
          disabled={isSendingTestEmail}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold tracking-[0.08em] uppercase border border-[#22D3EE]/30 text-[#67E8F9] hover:bg-[#22D3EE]/10 transition-colors disabled:opacity-50"
        >
          {isSendingTestEmail ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
          Send Test Email
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-[#F43F5E]/30 bg-[#F43F5E]/10 px-3 py-2 text-xs text-[#FCA5A5]">
          {error}
        </div>
      )}

      {statusMessage && (
        <div className="rounded-lg border border-[#10B981]/30 bg-[#10B981]/10 px-3 py-2 text-xs text-[#6EE7B7]">
          {statusMessage}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          <div className="skeleton h-10 w-full" />
          <div className="skeleton h-10 w-full" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-5 text-xs text-[#94A3B8]">
          No active alerts yet. Create one to get notified when WTI crosses your threshold.
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
            >
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">
                  {alert.assetCode} {formatCondition(alert.condition)} $
                  {alert.thresholdPrice.toFixed(2)}
                </p>
                <p className="text-[10px] text-[#64748B] tracking-[0.1em] uppercase">
                  Created {new Date(alert.createdAt).toLocaleString()}
                </p>
              </div>

              <button
                type="button"
                onClick={() => deactivateAlert(alert.id)}
                disabled={Boolean(isUpdatingIds[alert.id])}
                className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold tracking-[0.1em] uppercase border border-[#F43F5E]/30 text-[#FCA5A5] hover:bg-[#F43F5E]/10 transition-colors disabled:opacity-50"
              >
                {isUpdatingIds[alert.id] ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Power className="w-3 h-3" />
                )}
                Deactivate
              </button>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[70] bg-[#020617]/80 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="w-full max-w-md rounded-2xl border border-white/[0.12] bg-[#0F172A] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-[Outfit] text-lg font-semibold text-white">Create Price Alert</h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-xs text-[#94A3B8] hover:text-white transition-colors"
              >
                Close
              </button>
            </div>

            <div className="space-y-3">
              <label className="block space-y-1">
                <span className="text-[10px] text-[#64748B] tracking-[0.12em] uppercase">
                  Asset
                </span>
                <input
                  value={form.assetCode}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, assetCode: event.target.value.toUpperCase() }))
                  }
                  className="w-full rounded-lg bg-white/[0.04] border border-white/[0.12] px-3 py-2 text-sm text-white outline-none focus:border-[#22D3EE]/50"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-[10px] text-[#64748B] tracking-[0.12em] uppercase">
                  Condition
                </span>
                <select
                  value={form.condition}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      condition: event.target.value as AlertCondition,
                    }))
                  }
                  className="w-full rounded-lg bg-white/[0.04] border border-white/[0.12] px-3 py-2 text-sm text-white outline-none focus:border-[#22D3EE]/50"
                >
                  <option value="above">Above</option>
                  <option value="below">Below</option>
                </select>
              </label>

              <label className="block space-y-1">
                <span className="text-[10px] text-[#64748B] tracking-[0.12em] uppercase">
                  Threshold Price (USD)
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.thresholdPrice}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, thresholdPrice: event.target.value }))
                  }
                  className="w-full rounded-lg bg-white/[0.04] border border-white/[0.12] px-3 py-2 text-sm text-white outline-none focus:border-[#22D3EE]/50"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-[10px] text-[#64748B] tracking-[0.12em] uppercase">
                  Recipient Email
                </span>
                <input
                  type="email"
                  placeholder="alerts@local.test"
                  value={form.recipientEmail}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, recipientEmail: event.target.value }))
                  }
                  className="w-full rounded-lg bg-white/[0.04] border border-white/[0.12] px-3 py-2 text-sm text-white outline-none focus:border-[#22D3EE]/50"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={submitAlert}
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-[0.08em] uppercase bg-[#22D3EE]/10 text-[#22D3EE] hover:bg-[#22D3EE]/20 transition-colors disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Alert
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
