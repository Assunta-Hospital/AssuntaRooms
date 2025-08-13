import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return req.cookies.get(name)?.value;
        },
        set(name, value, options) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          res.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // 1️⃣ Get session
  const {
    data: { session },
  } = await supabase.auth.getSession();
  console.log("hi")

  if (!session) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectedFrom", req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // 2️⃣ If it's an admin path, check role
  if (req.nextUrl.pathname.startsWith("/admin")) {
    const { data: userData, error } = await supabase
      .from("users")
      .select("role")
      .eq("user_id", session.user.id)
      .single();

    if (error || userData?.role !== "admin") {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = "/unauthorized";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return res;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/manage-bookings/:path*",
    "/manage-users/:path*",
    "/manage-venues/:path*",
    "/profile/:path*",
    "/status/:path*",
  ],
};
