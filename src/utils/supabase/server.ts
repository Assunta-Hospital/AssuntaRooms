
// src/utils/supabase/server.ts
import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import cookie from "cookie";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createServerClient(req?: any, res?: any) {
  // If in App Router (no req/res), use next/headers dynamically
  if (!req && !res) {
    // Dynamically import so it doesn't break Pages Router build
    const { cookies } = require("next/headers");
    const cookieStore = cookies();

    return createSupabaseServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    });
  }

  // Pages Router: use req/res
  return createSupabaseServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookie.parse(req?.headers?.cookie || "")[name];
      },
      set(name: string, value: string, options: CookieOptions) {
        if (!res) return;
        const serializedCookie = cookie.serialize(name, value, options);
        res.setHeader("Set-Cookie", serializedCookie);
      },
      remove(name: string, options: CookieOptions) {
        if (!res) return;
        const serializedCookie = cookie.serialize(name, "", {
          ...options,
          maxAge: 0,
        });
        res.setHeader("Set-Cookie", serializedCookie);
      },
    },
  });
}
