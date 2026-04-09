import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import { DASHBOARD_CACHE_TTL_SECONDS } from "@/lib/config";
import { buildDashboardSnapshot } from "@/lib/dashboard";
import { handleDashboardRequest } from "@/lib/dashboard-route";

/**
 * Controller: /api/dashboard
 * Orchestrates request-level concerns (throttling + observability)
 * and delegates all data assembly to the service layer.
 */
const getCachedDashboardSnapshot = unstable_cache(
  buildDashboardSnapshot,
  ["dashboard-snapshot-v1"],
  { revalidate: DASHBOARD_CACHE_TTL_SECONDS },
);

export async function GET(request: Request) {
  const result = await handleDashboardRequest(request, {
    getSnapshot: getCachedDashboardSnapshot,
  });
  return NextResponse.json(result.body, {
    status: result.status,
    headers: result.headers,
  });
}
