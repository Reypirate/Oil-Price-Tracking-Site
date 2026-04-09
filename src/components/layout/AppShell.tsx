"use client";

import { BarChart3, Bell, Droplets } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { signOutClient } from "@/lib/auth-client";
import { getActivePrimaryNav } from "@/lib/navigation";
import { getSupabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: ReactNode;
  headerActions?: ReactNode;
};

function NavLink({
  href,
  icon,
  isActive,
  label,
}: {
  href: string;
  icon: ReactNode;
  isActive: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-[0.08em] uppercase transition-all duration-200 whitespace-nowrap",
        isActive
          ? "bg-[#22D3EE]/10 text-[#22D3EE]"
          : "text-[#64748B] hover:text-[#94A3B8] hover:bg-white/[0.04]",
      )}
      aria-current={isActive ? "page" : undefined}
    >
      {icon}
      {label}
    </Link>
  );
}

export function AppShell({ children, headerActions }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const activeNav = getActivePrimaryNav(pathname || "");
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const loginHref = useMemo(() => {
    const nextPath = pathname || "/";
    return `/login?next=${encodeURIComponent(nextPath)}`;
  }, [pathname]);

  useEffect(() => {
    let mounted = true;
    const supabase = getSupabase();

    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) {
        return;
      }
      setSessionEmail(data.session?.user.email ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionEmail(session?.user.email ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const sessionInitial = (sessionEmail?.[0] || "U").toUpperCase();

  return (
    <div className="min-h-screen bg-[#0B1121]">
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0B1121]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex flex-wrap items-center gap-3 md:gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-[220px]">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#22D3EE] to-[#0EA5E9] flex items-center justify-center shadow-lg shadow-[#22D3EE]/20">
              <Droplets className="w-5 h-5 text-[#0B1121]" />
            </div>
            <div>
              <h1 className="font-[Outfit] text-base font-bold text-white tracking-tight leading-none">
                OILPRICE <span className="text-[#22D3EE]">INTELLIGENCE</span>
              </h1>
              <p className="text-[10px] text-[#64748B] font-medium tracking-[0.15em] uppercase">
                Philippines Driver View
              </p>
            </div>
          </div>

          <nav className="order-3 w-full sm:order-2 sm:w-auto flex items-center gap-1 overflow-x-auto">
            <NavLink
              href="/"
              icon={<BarChart3 className="w-3.5 h-3.5" />}
              label="Dashboard"
              isActive={activeNav === "dashboard"}
            />
            <NavLink
              href="/alerts"
              icon={<Bell className="w-3.5 h-3.5" />}
              label="Alerts"
              isActive={activeNav === "alerts"}
            />
          </nav>

          <div className="order-2 sm:order-3 ml-auto flex items-center gap-3">
            {headerActions}
            {sessionEmail ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (isSigningOut) {
                      return;
                    }
                    setIsSigningOut(true);
                    void signOutClient()
                      .then(() => {
                        router.push("/login");
                        router.refresh();
                      })
                      .finally(() => {
                        setIsSigningOut(false);
                      });
                  }}
                  disabled={isSigningOut}
                  className="px-3 py-2 rounded-lg text-[10px] font-semibold tracking-[0.08em] uppercase text-[#94A3B8] bg-white/[0.04] hover:bg-white/[0.08] transition-colors disabled:opacity-50"
                >
                  {isSigningOut ? "Signing Out" : "Sign Out"}
                </button>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1E293B] to-[#334155] border border-white/10 flex items-center justify-center">
                  <span className="text-[11px] font-bold text-white">{sessionInitial}</span>
                </div>
              </>
            ) : (
              <Link
                href={loginHref}
                className="px-3 py-2 rounded-lg text-[10px] font-semibold tracking-[0.08em] uppercase bg-[#22D3EE]/10 text-[#22D3EE] hover:bg-[#22D3EE]/20 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">{children}</main>

      <footer className="max-w-7xl mx-auto px-4 md:px-6 py-8 border-t border-white/[0.04]">
        <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-[10px] text-[#334155] tracking-[0.15em] uppercase font-medium">
          <p>Estimated regional prices based on global crude benchmarks</p>
          <p>Copyright 2026 OilPrice Intelligence - v0.1.0</p>
        </div>
      </footer>
    </div>
  );
}
