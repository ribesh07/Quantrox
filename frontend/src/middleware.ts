import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Admin routes protection
    if (path.startsWith("/admin") && token?.role !== "SUPER_ADMIN" && token?.role !== "STAFF_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Redirect logged in users away from auth pages
    if ((path === "/login" || path === "/register") && !!token) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        // Public paths
        if (
          path === "/" ||
          path === "/login" ||
          path === "/register" ||
          path.startsWith("/api/auth") ||
          path.startsWith("/api/register")
        ) {
          return true;
        }
        // Protected paths require token
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
