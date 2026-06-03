import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import {
  Users,
  TrendingUp,
  Clock,
  DollarSign,
  ArrowUpRight,
  ArrowRight,
  Gamepad2,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default async function AdminDashboard() {
  const [
    totalUsers,
    totalOrders,
    pendingOrders,
    totalRevenue,
    recentOrders,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.order.aggregate({
      where: { status: "COMPLETED" },
      _sum: { total: true },
    }),
    prisma.order.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { username: true } }, game: true },
    }),
  ]);

  const stats = [
    {
      title: "Total Users",
      value: totalUsers,
      icon: Users,
      description: "Registered accounts",
      color: "text-[#848E9C]",
      bg: "bg-[#1E2329]",
    },
    {
      title: "Total Orders",
      value: totalOrders,
      icon: TrendingUp,
      description: "All time orders",
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Pending Review",
      value: pendingOrders,
      icon: Clock,
      description: "Awaiting approval",
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Total Revenue",
      value: `$${(totalRevenue._sum.total || 0).toFixed(2)}`,
      icon: DollarSign,
      description: "Completed volume",
      color: "text-[#0ECB81]",
      bg: "bg-[#0ECB81]/10",
    },
  ];

  return (
    <div className="space-y-10 pb-10 bg-[#0B0E11] min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Admin Overview</h1>
          <p className="text-[#848E9C] mt-1 font-medium">Platform analytics and real-time metrics.</p>
        </div>
        <div className="flex items-center gap-2 text-sm bg-[#1E2329] text-white px-4 py-2 rounded-full border border-[#2B3139] shadow-sm">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="font-bold">{new Date().toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border border-[#2B3139] bg-[#1E2329] shadow-sm overflow-hidden group hover:border-primary/50 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold text-[#848E9C]">{stat.title}</CardTitle>
              <div className={cn("p-2 rounded-lg transition-colors", stat.bg)}>
                <stat.icon className={cn("h-4 w-4", stat.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-white">{stat.value}</div>
              <p className="text-xs text-[#848E9C] mt-1 font-medium">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-8 border border-[#2B3139] bg-[#1E2329] shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b border-[#2B3139] pb-6">
            <div>
              <CardTitle className="text-white font-bold">Recent Orders</CardTitle>
              <CardDescription className="text-[#848E9C]">Latest platform transactions.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-primary font-bold hover:bg-primary/10" asChild>
              <Link href="/admin/orders">View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-4">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-[#0B0E11] hover:bg-[#1E2329] border border-transparent hover:border-[#2B3139] transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-3 rounded-xl",
                      order.type === "EXCHANGE" ? "bg-primary/10 text-primary" : "bg-[#0ECB81]/10 text-[#0ECB81]"
                    )}>
                      {order.type === "EXCHANGE" ? <ArrowUpRight className="h-5 w-5" /> : <Gamepad2 className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">
                        {order.user.username} — {order.type === "EXCHANGE" ? "USD to USDT" : `${order.game?.name || 'Game'} Topup`}
                      </p>
                      <p className="text-xs text-[#848E9C] font-medium">
                        {new Date(order.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} • {order.id.slice(-8).toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-sm text-white">${order.amount.toFixed(2)}</p>
                    <div className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider mt-1",
                      order.status === "COMPLETED" ? "bg-[#0ECB81]/10 text-[#0ECB81]" :
                      order.status === "REJECTED" ? "bg-destructive/10 text-destructive" :
                      order.status === "PENDING_REVIEW" ? "bg-primary/10 text-primary" :
                      "bg-primary/10 text-primary"
                    )}>
                      {order.status.replace("_", " ")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-4 border border-[#2B3139] bg-[#1E2329] shadow-sm">
          <CardHeader>
            <CardTitle className="text-white font-bold">Quick Actions</CardTitle>
            <CardDescription className="text-[#848E9C]">Common management tools.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {[
              { label: "Update Rates", href: "/admin/rates", icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
              { label: "Review Orders", href: "/admin/orders", icon: Clock, color: "text-primary", bg: "bg-primary/10" },
              { label: "Manage Games", href: "/admin/games", icon: Gamepad2, color: "text-[#0ECB81]", bg: "bg-[#0ECB81]/10" },
              { label: "QR Codes", href: "/admin/qr-codes", icon: DollarSign, color: "text-[#0ECB81]", bg: "bg-[#0ECB81]/10" },
            ].map((action, i) => (
              <Button
                key={i}
                variant="outline"
                className="w-full justify-start h-14 rounded-2xl group border-[#2B3139] bg-[#0B0E11] hover:border-primary/50 hover:bg-[#1E2329] transition-all"
                asChild
              >
                <Link href={action.href}>
                  <div className={cn("p-2 rounded-lg mr-3 transition-colors", action.bg)}>
                    <action.icon className={cn("h-4 w-4", action.color)} />
                  </div>
                  <span className="font-bold text-white">{action.label}</span>
                  <ArrowRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0 text-primary" />
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
