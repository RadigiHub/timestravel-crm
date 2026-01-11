import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  /**
   * ✅ PUBLIC ROUTES (NO AUTH)
   * - Webhook intake must NOT redirect to /login
   */
  if (pathname.startsWith("/api/leads/intake")) {
    return NextResponse.next();
  }

  // Allow Next.js internals & static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  // Allow login page itself
  if (pathname.startsWith("/login")) {
    return NextResponse.next();
  }

  // Prepare response for Supabase SSR
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Check session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If no session -> redirect to login
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return res;
}

/**
 * ✅ Apply middleware to everything except:
 * - _next static
 * - images/static
 * - favicon
 */
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
