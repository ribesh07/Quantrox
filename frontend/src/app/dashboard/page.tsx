import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import {
  CheckCircle2,
  Clock,
  LayoutDashboard,
  Wallet as WalletIcon,
  TrendingUp,
  ArrowRightLeft,
  PlusCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { redirect } from "next/navigation";
import axios from "axios";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const accessToken = (session?.user as any)?.accessToken;
  
  if (!session || !(session.user as any)?.id) {
    redirect("/login");
  }

  const API_URL = (process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/+$/, '');

  try {
    const [ordersResponse, walletsResponse, statsResponse] = await Promise.all([
      axios.get(`${API_URL}/orders`, { headers: { Authorization: `Bearer ${accessToken}` } }),
      axios.get(`${API_URL}/wallets`, { headers: { Authorization: `Bearer ${accessToken}` } }),
      axios.get(`${API_URL}/orders/stats`, { headers: { Authorization: `Bearer ${accessToken}` } })
    ]);

    const orders = ordersResponse.data.orders;
    const wallets = walletsResponse.data.wallets;
    const stats = statsResponse.data.stats;

    const totalBalance = wallets.reduce((acc: any, w: any) => acc + w.balance, 0);
    const totalOrders = stats.reduce((acc: any, s: any) => acc + s._count, 0);
    const completedOrders = stats.find((s: any) => s.status === "COMPLETED")?._count || 0;
    const pendingOrders = stats.reduce((acc: any, s: any) => {
      if (s.status === "PENDING_REVIEW" || s.status === "PENDING_PAYMENT") {
        return acc + s._count;
      }
      return acc;
    }, 0);

    const cards = [
      {
        title: "Total Transactions",
        value: totalOrders,
        icon: LayoutDashboard,
        description: "Lifetime history",
        color: "text-[#848E9C]",
        bg: "bg-[#1E2329]",
      },
      {
        title: "Completed",
        value: completedOrders,
        icon: CheckCircle2,
        description: "Processed successfully",
        color: "text-[#0ECB81]",
        bg: "bg-[#0ECB81]/10",
      },
      {
        title: "Pending",
        value: pendingOrders,
        icon: Clock,
        description: "Awaiting approval",
        color: "text-primary",
        bg: "bg-primary/10",
      },
      {
        title: "Total Assets (Available)",
        value: `$${totalBalance.toFixed(2)}`,
        icon: WalletIcon,
        description: "Available across all wallets",
        color: "text-primary",
        bg: "bg-primary/10",
      },
    ];

    return (
      <div className="space-y-10 pb-10 bg-[#0B0E11] min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Welcome, {(session.user as any).username || "User"}</h1>
            <p className="text-[#848E9C] mt-1 font-medium">
              Manage your gaming assets and wallet exchange.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" className="rounded-xl border-[#2B3139] text-white hover:bg-[#1E2329]">
              <Link href="/dashboard/orders">History</Link>
            </Button>
            <Button asChild className="rounded-xl shadow-lg shadow-primary/20 bg-primary text-primary-foreground hover:bg-primary/90 font-bold">
              <Link href="/dashboard/exchange">
                <ArrowRightLeft className="mr-2 h-4 w-4" /> Exchange
              </Link>
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
                    <p className="text-sm text-[#848E9C] font-medium">No recent transactions found.</p>
                  </div>
                ) : (
                  orders.slice(0, 5).map((order: any) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 rounded-2xl bg-[#0B0E11] hover:bg-[#1E2329] border border-transparent hover:border-[#2B3139] transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "p-3 rounded-xl",
                          order.type === "EXCHANGE" ? "bg-primary/10 text-primary" : "bg-[#0ECB81]/10 text-[#0ECB81]"
                        )}>
                          {order.type === "EXCHANGE" ? <ArrowRightLeft className="h-5 w-5" /> : <PlusCircle className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-white">
                            {order.type} via {order.paymentMethod?.name || "Method"}
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
              <WalletIcon className="h-40 w-40 rotate-12" />
            </div>
            <CardHeader>
              <CardTitle className="font-black text-2xl">Asset Wallets</CardTitle>
              <CardDescription className="text-primary-foreground/80 font-medium text-sm">Individual balances per method.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 relative z-10 pt-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-primary-foreground/70 uppercase tracking-widest">Total Assets (Available)</p>
                <div className="text-5xl font-black">${totalBalance.toFixed(2)}</div>
              </div>
              
              <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {wallets.length === 0 ? (
                  <p className="text-sm opacity-70 italic">No active balances yet.</p>
                ) : (
                  wallets.map((wallet: any) => (
                    <div key={wallet.id} className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10 flex justify-between items-center">
                      <span className="text-xs font-bold uppercase tracking-wider">{wallet.paymentMethod?.name || "Method"}</span>
                      <span className="font-black">${wallet.balance.toFixed(2)}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-3">
                <Button asChild className="flex-1 bg-white text-primary hover:bg-white/90 rounded-2xl h-12 font-black shadow-lg">
                  <Link href="/dashboard/exchange">Exchange</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Dashboard Error:", error);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0B0E11] text-white p-6">
        <AlertCircle className="h-16 w-16 text-red-500 mb-6" />
        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
        <p className="text-[#848E9C] text-center mb-8 max-w-md">
          We encountered an error while loading your dashboard. This might be due to a temporary connection issue.
        </p>
        <Button asChild className="rounded-xl px-8 font-bold bg-primary text-primary-foreground">
          <Link href="/dashboard">Try Again</Link>
        </Button>
      </div>
    );
  }
}
