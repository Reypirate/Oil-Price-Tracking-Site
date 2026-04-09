"use client";

import { Loader2, Lock, Mail, User } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { signInWithEmailPassword, signUpWithEmailPassword } from "@/lib/auth-client";

type AuthMode = "signin" | "signup";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => searchParams.get("next") || "/alerts", [searchParams]);

  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const onSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    setError(null);
    setStatusMessage(null);
    setIsSubmitting(true);

    try {
      if (!email.trim() || !password.trim()) {
        throw new Error("Email and password are required.");
      }

      if (mode === "signin") {
        const session = await signInWithEmailPassword({
          email: email.trim(),
          password,
        });

        if (!session) {
          throw new Error("Sign-in did not return a session.");
        }

        router.push(nextPath);
        router.refresh();
        return;
      }

      const session = await signUpWithEmailPassword({
        email: email.trim(),
        password,
        fullName: fullName.trim() || undefined,
      });

      if (session) {
        router.push(nextPath);
        router.refresh();
        return;
      }

      setStatusMessage("Account created. Check your email to confirm your account, then sign in.");
      setMode("signin");
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : "Authentication failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1121] flex items-center justify-center px-4">
      <div className="w-full max-w-md glass-surface p-6 space-y-5">
        <div className="space-y-1">
          <h1 className="font-[Outfit] text-2xl font-semibold text-white">
            {mode === "signin" ? "Sign In" : "Create Account"}
          </h1>
          <p className="text-sm text-[#94A3B8]">
            {mode === "signin"
              ? "Sign in to manage alerts and send test emails."
              : "Create a Supabase account for your alerts dashboard."}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold tracking-[0.08em] uppercase transition-colors ${
              mode === "signin"
                ? "bg-[#22D3EE]/15 text-[#22D3EE]"
                : "text-[#64748B] bg-white/[0.04] hover:text-[#94A3B8]"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold tracking-[0.08em] uppercase transition-colors ${
              mode === "signup"
                ? "bg-[#22D3EE]/15 text-[#22D3EE]"
                : "text-[#64748B] bg-white/[0.04] hover:text-[#94A3B8]"
            }`}
          >
            Sign Up
          </button>
        </div>

        <div className="space-y-3">
          {mode === "signup" && (
            <label className="block space-y-1">
              <span className="text-[10px] text-[#64748B] tracking-[0.12em] uppercase">
                Full Name
              </span>
              <div className="relative">
                <User className="w-4 h-4 text-[#475569] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="w-full rounded-lg bg-white/[0.04] border border-white/[0.12] pl-10 pr-3 py-2 text-sm text-white outline-none focus:border-[#22D3EE]/50"
                  placeholder="Juan Dela Cruz"
                />
              </div>
            </label>
          )}

          <label className="block space-y-1">
            <span className="text-[10px] text-[#64748B] tracking-[0.12em] uppercase">Email</span>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#475569] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-lg bg-white/[0.04] border border-white/[0.12] pl-10 pr-3 py-2 text-sm text-white outline-none focus:border-[#22D3EE]/50"
                placeholder="you@example.com"
              />
            </div>
          </label>

          <label className="block space-y-1">
            <span className="text-[10px] text-[#64748B] tracking-[0.12em] uppercase">Password</span>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#475569] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg bg-white/[0.04] border border-white/[0.12] pl-10 pr-3 py-2 text-sm text-white outline-none focus:border-[#22D3EE]/50"
                placeholder="********"
              />
            </div>
          </label>
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

        <button
          type="button"
          onClick={() => void onSubmit()}
          disabled={isSubmitting}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-[0.08em] uppercase bg-[#22D3EE]/10 text-[#22D3EE] hover:bg-[#22D3EE]/20 transition-colors disabled:opacity-60"
        >
          {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {mode === "signin" ? "Sign In" : "Create Account"}
        </button>

        <p className="text-xs text-[#64748B]">
          Back to{" "}
          <Link href="/" className="text-[#22D3EE] hover:underline">
            Dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}
