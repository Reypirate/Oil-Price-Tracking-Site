import { getSupabaseAdmin } from "@/lib/supabase";

export class ApiAuthError extends Error {
  status: number;

  constructor(message = "Unauthorized", status = 401) {
    super(message);
    this.name = "ApiAuthError";
    this.status = status;
  }
}

function parseBearerToken(authHeader: string | null): string | null {
  if (!authHeader) {
    return null;
  }

  const [scheme, token] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token?.trim()) {
    return null;
  }

  return token.trim();
}

export async function requireSupabaseUserId(request: Request): Promise<string> {
  const token = parseBearerToken(request.headers.get("authorization"));
  if (!token) {
    throw new ApiAuthError("Unauthorized. Sign in with Supabase Auth.", 401);
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    throw new ApiAuthError("Unauthorized. Invalid or expired Supabase session.", 401);
  }

  return data.user.id;
}
