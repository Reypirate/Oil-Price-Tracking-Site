export type PrimaryNavItem = "dashboard" | "alerts";

export function getActivePrimaryNav(pathname: string): PrimaryNavItem | null {
  if (pathname === "/") {
    return "dashboard";
  }

  if (pathname === "/alerts" || pathname.startsWith("/alerts/")) {
    return "alerts";
  }

  return null;
}
