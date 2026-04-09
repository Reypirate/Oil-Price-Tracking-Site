export const DASHBOARD_POLL_INTERVAL_MS = 60_000;

export function shouldDashboardPoll(visibilityState: DocumentVisibilityState): boolean {
  return visibilityState === "visible";
}
