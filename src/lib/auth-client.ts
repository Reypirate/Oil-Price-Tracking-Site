import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";

export type PasswordAuthInput = {
  email: string;
  password: string;
};

export type SignUpInput = PasswordAuthInput & {
  fullName?: string;
};

export async function getClientSession(): Promise<Session | null> {
  const { data, error } = await getSupabase().auth.getSession();
  if (error) {
    throw error;
  }
  return data.session;
}

export async function signInWithEmailPassword(input: PasswordAuthInput): Promise<Session | null> {
  const { data, error } = await getSupabase().auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (error) {
    throw error;
  }

  return data.session;
}

export async function signUpWithEmailPassword(input: SignUpInput): Promise<Session | null> {
  const { data, error } = await getSupabase().auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        full_name: input.fullName || null,
      },
    },
  });

  if (error) {
    throw error;
  }

  return data.session;
}

export async function signOutClient(): Promise<void> {
  const { error } = await getSupabase().auth.signOut();
  if (error) {
    throw error;
  }
}
