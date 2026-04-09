import { z } from "zod";
import { logger } from "./logger";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  OIL_PRICE_API_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(1),
});

let memoizedEnv: z.infer<typeof envSchema> | undefined;

const getEnv = () => {
  if (memoizedEnv) return memoizedEnv;

  const processEnv = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    OIL_PRICE_API_KEY: process.env.OIL_PRICE_API_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    CRON_SECRET: process.env.CRON_SECRET,
  };

  const parsed = envSchema.safeParse(processEnv);

  if (!parsed.success) {
    const isProduction = process.env.NODE_ENV === "production";
    const isBuild =
      process.env.NEXT_PHASE === "phase-production-build" ||
      process.env.SKIP_ENV_VALIDATION === "true";

    // 1. If we are BUILDING, never crash. Just return raw env (even if partial).
    if (isBuild) {
      return processEnv as unknown as z.infer<typeof envSchema>;
    }

    // 2. If we are in PRODUCTION RUNTIME, we must be strict.
    if (isProduction) {
      logger.error(
        { errors: parsed.error.format() },
        "❌ MISSION CRITICAL: Invalid environment variables in Production",
      );
      throw new Error("Environment validation failed. App cannot start.");
    }

    // 3. If we are in DEV, just warn so the developer can keep working.
    logger.warn("⚠️ [Env] Missing/invalid variables. Check your .env.local.");
    return processEnv as unknown as z.infer<typeof envSchema>;
  }

  memoizedEnv = parsed.data;
  return memoizedEnv;
};

// 2. Export a lazy-validated proxy
export const env = new Proxy({} as z.infer<typeof envSchema>, {
  get(_, prop: string) {
    return getEnv()[prop as keyof z.infer<typeof envSchema>];
  },
});
