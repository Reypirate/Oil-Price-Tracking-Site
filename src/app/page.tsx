import { Dashboard } from "@/components/dashboard/Dashboard";

/**
 * Page: / (root)
 * Server Component shell — renders the client-side Dashboard.
 * All data fetching happens via the /api/dashboard route inside the Dashboard component.
 */
export default function DashboardPage() {
  return <Dashboard />;
}
