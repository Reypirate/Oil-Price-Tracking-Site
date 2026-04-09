import { Dashboard } from "@/components/dashboard/Dashboard";

/**
 * Page: / (root)
 * Server component shell that renders the client-side dashboard.
 * Data fetching is handled by /api/dashboard from the dashboard container.
 */
export default function DashboardPage() {
  return <Dashboard />;
}
