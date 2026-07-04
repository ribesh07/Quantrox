"use client";

import { cn } from "@/lib/utils";
import {
  BarChart3,
  Gamepad2,
  LayoutDashboard,
  LogOut,
  QrCode,
  Settings,
  TrendingUp,
  Users,
  Menu,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Permission } from "@/lib/permissions";

// Define route configurations with required permissions
interface RouteConfig {
  label: string;
  icon: React.ElementType;
  href: string;
  requiredPermission?: Permission;
}

const routes: RouteConfig[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin",
    // Dashboard is accessible to all admin roles
  },
  {
    label: "Transactions",
    icon: TrendingUp,
    href: "/admin/orders",
    requiredPermission: "VIEW_ORDERS",
  },
  {
    label: "Merchants",
    icon: Users,
    href: "/admin/merchants",
    requiredPermission: "VIEW_MERCHANTS",
  },
  {
    label: "Merchant QRs",
    icon: QrCode,
    href: "/admin/merchant-qrs",
    requiredPermission: "MANAGE_MERCHANTS",
  },
  {
    label: "Transaction Reports",
    icon: BarChart3,
    href: "/admin/transaction-reports",
    requiredPermission: "VIEW_ORDERS",
  },
  {
    label: "Deposits",
    icon: TrendingUp,
    href: "/admin/deposits",
    requiredPermission: "VIEW_DEPOSITS",
  },
  {
    label: "Payout Requests",
    icon: TrendingUp,
    href: "/admin/payout-requests",
    requiredPermission: "VIEW_PAYOUTS",
  },
  {
    label: "Rates & Fees",
    icon: BarChart3,
    href: "/admin/payment-settings",
    requiredPermission: "MANAGE_PAYMENT_METHODS",
  },
  {
    label: "Games",
    icon: Gamepad2,
    href: "/admin/games",
    requiredPermission: "VIEW_GAMES",
  },
  {
    label: "Game Requests",
    icon: Gamepad2,
    href: "/admin/game-requests",
    requiredPermission: "VIEW_GAME_ID_REQUESTS",
  },
  {
    label: "Users",
    icon: Users,
    href: "/admin/users",
    requiredPermission: "VIEW_USERS",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/admin/settings",
    requiredPermission: "VIEW_SETTINGS",
  },
];

export function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const userPermissions = (session?.user as any)?.permissions || [];

  // Filter routes based on user permissions
  const filteredRoutes = routes.filter((route) => {
    if (!route.requiredPermission) return true;
    return userPermissions.includes(route.requiredPermission);
  });

  return (
    <aside className="hidden md:flex md:w-64 md:shrink-0 md:flex-col border-r border-border bg-[#0B0E11] h-dvh sticky top-0 z-30">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border px-6 shrink-0">
        <Link href="/admin" className="flex items-center">
          <img
            src="/icons/logo.png"
            alt="SettlerPay"
            className="h-10 w-auto object-contain"
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {filteredRoutes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              pathname === route.href
                ? "bg-secondary text-primary shadow-sm"
                : "text-[#848E9C] hover:bg-[#1E2329] hover:text-white"
            )}
          >
            <route.icon className="h-4 w-4" />
            {route.label}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="border-t border-border p-4 shrink-0">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 rounded-xl text-[#848E9C] hover:bg-destructive/10 hover:text-destructive"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}

export function MobileAdminNav() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const userPermissions = (session?.user as any)?.permissions || [];

  // Filter routes based on user permissions
  const filteredRoutes = routes.filter((route) => {
    if (!route.requiredPermission) return true;
    return userPermissions.includes(route.requiredPermission);
  });

  return (
    <div className="sticky top-0 z-50 flex h-16 items-center border-b border-border bg-[#0B0E11] px-4 md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="mr-2 text-white">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>

        <SheetContent
          side="left"
          className="w-72 border-r border-border bg-[#0B0E11] p-0"
        >
          <SheetHeader className="border-b border-border p-6 text-left">
            <SheetTitle className="flex items-center gap-2 text-xl font-bold text-white">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span>Settlerpay Admin</span>
            </SheetTitle>
          </SheetHeader>

          <nav className="space-y-1 p-4">
            {filteredRoutes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  pathname === route.href
                    ? "bg-secondary text-primary shadow-sm"
                    : "text-[#848E9C] hover:bg-[#1E2329] hover:text-white"
                )}
              >
                <route.icon className="h-4 w-4" />
                {route.label}
              </Link>
            ))}

            <Separator className="my-4 opacity-10" />

            <Button
              variant="ghost"
              className="w-full justify-start gap-3 rounded-xl text-[#848E9C] hover:bg-destructive/10 hover:text-destructive"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </nav>
        </SheetContent>
      </Sheet>

      <Link
        href="/admin"
        className="flex items-center gap-2 text-lg font-bold text-white"
      >
        <TrendingUp className="h-5 w-5 text-primary" />
        <span>Settlerpay</span>
      </Link>
    </div>
  );
}
