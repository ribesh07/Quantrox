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
import { signOut } from "next-auth/react";
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

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin",
  },
  {
    label: "Transactions",
    icon: TrendingUp,
    href: "/admin/orders",
  },
  {
    label: "Merchants",
    icon: Users,
    href: "/admin/merchants",
  },
  {
    label: "Merchant QRs",
    icon: QrCode,
    href: "/admin/merchant-qrs",
  },
  {
    label: "Transaction Reports",
    icon: BarChart3,
    href: "/admin/transaction-reports",
  },
  {
    label: "Deposits",
    icon: TrendingUp,
    href: "/admin/deposits",
  },
  {
    label: "Payout Requests",
    icon: TrendingUp,
    href: "/admin/payout-requests",
  },
  {
    label: "Rates & Fees",
    icon: BarChart3,
    href: "/admin/payment-settings",
  },
  {
    label: "Games",
    icon: Gamepad2,
    href: "/admin/games",
  },
  {
    label: "Game Requests",
    icon: Gamepad2,
    href: "/admin/game-requests",
  },
  {
    label: "Users",
    icon: Users,
    href: "/admin/users",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/admin/settings",
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-col border-r border-border bg-[#0B0E11] md:flex h-screen sticky top-0">
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href="/admin" className="flex items-center gap-2 font-bold text-xl">
          {/* <div className="bg-primary p-1.5 rounded-lg">
            <TrendingUp className="h-5 w-5 text-primary-foreground" />
          </div> */}
             <img
                    src="/icons/logo.png"
                    alt="SettlerPay"
                    className="h-8 sm:h-10 md:h-11 lg:h-12 w-auto object-contain"
                  />
          {/* <span className="text-white">Settlerpay</span> */}
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {routes.map((route) => (
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
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 rounded-xl text-[#848E9C] hover:text-destructive hover:bg-destructive/10"
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
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-16 items-center border-b border-border bg-[#0B0E11] px-4 md:hidden sticky top-0 z-50">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="mr-2 text-white">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0 bg-[#0B0E11] border-r border-border">
          <SheetHeader className="p-6 text-left border-b border-border">
            <SheetTitle className="flex items-center gap-2 font-bold text-xl text-white">
              <div className="bg-primary p-1.5 rounded-lg">
                <TrendingUp className="h-5 w-5 text-primary-foreground" />
              </div>
              <span>Settlerpay Admin</span>
            </SheetTitle>
          </SheetHeader>
          <nav className="flex-1 space-y-1 p-4">
            {routes.map((route) => (
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
              className="w-full justify-start gap-3 rounded-xl text-[#848E9C] hover:text-destructive hover:bg-destructive/10"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </nav>
        </SheetContent>
      </Sheet>
      <Link href="/admin" className="flex items-center gap-2 font-bold text-lg text-white">
        <TrendingUp className="h-5 w-5 text-primary" />
        <span>Settlerpay</span>
      </Link>
    </div>
  );
}
