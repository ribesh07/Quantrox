import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import {
  CheckCircle2,
  Clock,
  LayoutDashboard,
  Wallet,
  XCircle,
  ArrowUpRight,
  TrendingUp,
  Gamepad2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any).id;

  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { game: true }
  });

  const stats = await prisma.order.groupBy({
    by: ["status"],
    where: { userId },
    _count: true,
  });

  const totalOrders = stats.reduce((acc, s) => acc + s._count, 0);
  const completedOrders = stats.find((s) => s.status === "COMPLETED")?._count || 0;
  const pendingOrders = stats.find((s) => s.status === "PENDING_REVIEW" || s.status === "PENDING_PAYMENT")?._count || 0;

  const cards = [
    {
      title: "Total Orders",
      value: totalOrders,
      icon: LayoutDashboard,
      description: "Total orders placed",
      color: "text-[#848E9C]",
      bg: "bg-[#1E2329]",
    },
    {
      title: "Completed",
      value: completedOrders,
      icon: CheckCircle2,
      description: "Successfully processed",
      color: "text-[#0ECB81]",
      bg: "bg-[#0ECB81]/10",
    },
    {
      title: "Pending",
      value: pendingOrders,
      icon: Clock,
      description: "Awaiting action",
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Wallet Balance",
      value: "$0.00",
      icon: Wallet,
      description: "Available balance",
      color: "text-primary",
      bg: "bg-primary/10",
    },
  ];

  return (
    <div className="space-y-10 pb-10 bg-[#0B0E11] min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Welcome, {(session?.user as any).username}</h1>
          <p className="text-[#848E9C] mt-1 font-medium">
            Manage your digital assets and gaming credits.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" className="rounded-xl border-[#2B3139] text-white hover:bg-[#1E2329]">
            <Link href="/dashboard/orders">History</Link>
          </Button>
          <Button asChild className="rounded-xl shadow-lg shadow-primary/20 bg-primary text-primary-foreground hover:bg-primary/90 font-bold">
            <Link href="/dashboard/exchange">Exchange Now</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, i) => (
          <Card key={i} className="border border-[#2B3139] bg-[#1E2329] shadow-sm overflow-hidden group hover:border-primary/50 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold text-[#848E9C]">{card.title}</CardTitle>
              <div className={cn("p-2 rounded-lg transition-colors", card.bg)}>
                <card.icon className={cn("h-4 w-4", card.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-white">{card.value}</div>
              <p className="text-xs text-[#848E9C] mt-1 font-medium">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <Card className="md:col-span-4 border border-[#2B3139] bg-[#1E2329] shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b border-[#2B3139] pb-6">
            <div>
              <CardTitle className="text-white font-bold">Recent Activity</CardTitle>
              <CardDescription className="text-[#848E9C]">Your latest transactions.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-primary font-bold hover:bg-primary/10" asChild>
              <Link href="/dashboard/orders">See All</Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                  <div className="bg-[#0B0E11] p-4 rounded-full">
                    <TrendingUp className="h-8 w-8 text-[#848E9C]" />
                  </div>
                  <p className="text-sm text-[#848E9C] font-medium">No recent orders found.</p>
                </div>
              ) : (
                orders.map((order) => (
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
                          {order.type === "EXCHANGE" ? "USD to USDT" : `${order.game?.name || 'Game'} Topup`}
                        </p>
                        <p className="text-xs text-[#848E9C] font-medium">
                          {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-sm text-white">${order.amount.toFixed(2)}</p>
                      <div className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider mt-1",
                        order.status === "COMPLETED" ? "bg-[#0ECB81]/10 text-[#0ECB81]" :
                        order.status === "REJECTED" ? "bg-destructive/10 text-destructive" :
                        "bg-primary/10 text-primary"
                      )}>
                        {order.status.replace("_", " ")}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3 border-none bg-primary text-primary-foreground overflow-hidden relative shadow-xl shadow-primary/10">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Wallet className="h-40 w-40 rotate-12" />
          </div>
          <CardHeader>
            <CardTitle className="font-black text-2xl">Asset Wallet</CardTitle>
            <CardDescription className="text-primary-foreground/80 font-medium text-sm">Securely manage your balances.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 relative z-10 pt-4">
            <div className="space-y-1">
              <p className="text-xs font-bold text-primary-foreground/70 uppercase tracking-widest">Total Estimated Balance</p>
              <div className="text-5xl font-black">$0.00</div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                <p className="text-[10px] uppercase font-black opacity-70 tracking-wider">Locked</p>
                <p className="font-black text-lg">$0.00</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                <p className="text-[10px] uppercase font-black opacity-70 tracking-wider">Available</p>
                <p className="font-black text-lg">$0.00</p>
              </div>
            </div>
            <Button className="w-full bg-white text-primary hover:bg-white/90 rounded-2xl h-14 font-black text-lg shadow-lg">
              Deposit Funds
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
