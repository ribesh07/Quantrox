"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Permission, hasPermission } from "@/lib/permissions";

interface ProtectedPageProps {
  requiredPermission: Permission;
  children: React.ReactNode;
}

export function ProtectedPage({ requiredPermission, children }: ProtectedPageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/admin-login");
      return;
    }

    const userPermissions = (session?.user as any)?.permissions || [];
    const userRole = (session?.user as any)?.role;

    // SUPER_ADMIN has access to everything
    if (userRole === "SUPER_ADMIN") {
      return;
    }

    if (!hasPermission(userPermissions, requiredPermission)) {
      // Redirect to admin dashboard if no permission
      router.push("/admin");
    }
  }, [status, session, router, requiredPermission]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const userPermissions = (session?.user as any)?.permissions || [];
  const userRole = (session?.user as any)?.role;

  if (userRole === "SUPER_ADMIN" || hasPermission(userPermissions, requiredPermission)) {
    return <>{children}</>;
  }

  return null;
}
