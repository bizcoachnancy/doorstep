import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Used in Server Components, Route Handlers, and middleware
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // called from a Server Component with no write access — safe to ignore
            // because middleware refreshes the session on every request.
          }
        },
      },
    }
  );
}

// Used only in the Stripe webhook route, where we need to bypass RLS
// to update a user's subscription row based on the Stripe event alone.
export function createServiceRoleClient() {
  const { createClient: createRawClient } = require("@supabase/supabase-js");
  return createRawClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
