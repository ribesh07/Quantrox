import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Admin routes protection
    if (path.startsWith("/admin") && token?.role !== "SUPER_ADMIN" && token?.role !== "STAFF_ADMIN" && token?.role !== "VENDOR" && token?.role !== "SUB_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // console.log("Middleware token:", token);

  // Redirect admins from dashboard to admin panel
    if (
      path === "/dashboard" &&
      (token?.role === "SUPER_ADMIN" || token?.role === "STAFF_ADMIN" || token?.role === "VENDOR" || token?.role === "SUB_ADMIN")
    ) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }

      // Protect admin routes
  if (
    path.startsWith("/admin") &&
    token?.role !== "SUPER_ADMIN" &&
    token?.role !== "STAFF_ADMIN" &&
    token?.role !== "VENDOR" &&
    token?.role !== "SUB_ADMIN"
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

    // Redirect logged in users away from auth pages
    if ((path === "/login" || path === "/register" || path === "/forgot-password") && !!token) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
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
          path === "/forgot-password" ||
          path.startsWith("/api/auth") ||
           path.startsWith("/icons") ||
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
