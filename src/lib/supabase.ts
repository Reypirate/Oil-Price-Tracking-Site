import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

let supabaseInstance: SupabaseClient | undefined;
let supabaseAdminInstance: SupabaseClient | undefined;

/**
 * Standard client for client-side and row-level security.
 * Memoized to ensure only one instance is created per request/session.
 */
export const getSupabase = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  }
  return supabaseInstance;
};

/**
 * Admin client for background processes (bypasses RLS).
 * Memoized to ensure only one instance is created per request/session.
 */
export const getSupabaseAdmin = () => {
  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }
  return supabaseAdminInstance;
};
