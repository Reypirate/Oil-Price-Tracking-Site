import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0B1121] flex items-center justify-center px-4 text-[#94A3B8]">
          Loading login...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
