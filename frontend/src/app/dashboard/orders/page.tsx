"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Eye, Gamepad2, ArrowUpRight, Clock, Loader2, Search, Filter } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { getUserOrdersAction } from "@/actions/order.actions";

export default function UserOrdersPage() {
  const [search, setSearch] = useState("");
  
  const { data: orders, isLoading } = useQuery({
    queryKey: ["user-orders"],
    queryFn: async () => {
      const result = await getUserOrdersAction();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.orders;
    },
  });

  const filteredOrders = orders?.filter((o: any) => 
    o.id.toLowerCase().includes(search.toLowerCase()) ||
    o.type.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20 rounded-full px-3">Completed</Badge>;
      case "PENDING_REVIEW":
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/20 rounded-full px-3">Pending Review</Badge>;
      case "PENDING_PAYMENT":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20 rounded-full px-3">Pending Payment</Badge>;
      case "REJECTED":
        return <Badge variant="destructive" className="rounded-full px-3">Rejected</Badge>;
      case "APPROVED":
        return <Badge className="bg-cyan-500/10 text-cyan-600 border-cyan-500/20 hover:bg-cyan-500/20 rounded-full px-3">Approved</Badge>;
      default:
        return <Badge variant="secondary" className="rounded-full px-3">{status.replace("_", " ")}</Badge>;
    }
  };

  return (
    <div className="space-y-8 pb-10 bg-[#0B0E11] min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Order History</h1>
          <p className="text-[#848E9C] mt-1 font-medium">Track your exchange and gaming orders.</p>
        </div>
        <Button asChild className="rounded-xl shadow-lg shadow-primary/20 bg-primary text-primary-foreground hover:bg-primary/90 font-bold">
          <Link href="/dashboard/exchange">New Exchange</Link>
        </Button>
      </div>

      <Card className="border border-[#2B3139] bg-[#1E2329] shadow-sm overflow-hidden">
        <CardHeader className="border-b border-[#2B3139] bg-[#1E2329] pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-lg text-white font-bold">Transactions</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#848E9C]" />
              <Input 
                placeholder="Search..." 
                className="pl-10 h-10 rounded-xl border-2 border-[#2B3139] bg-[#0B0E11] text-white focus:border-primary transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading your orders...</p>
            </div>
          ) : !filteredOrders || filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="bg-muted p-6 rounded-full">
                <Clock className="h-10 w-10 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-bold">No orders found</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  {search ? "We couldn't find any orders matching your search." : "You haven't placed any orders yet. Start by creating a new exchange."}
                </p>
              </div>
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/dashboard/exchange">Create New Order</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#0B0E11] border-b border-[#2B3139]">
                    <TableHead className="w-[150px] font-bold text-[#848E9C]">Order ID</TableHead>
                    <TableHead className="font-bold text-[#848E9C]">Type</TableHead>
                    <TableHead className="font-bold text-[#848E9C]">Amount</TableHead>
                    <TableHead className="font-bold text-[#848E9C]">Total</TableHead>
                    <TableHead className="font-bold text-[#848E9C]">Status</TableHead>
                    <TableHead className="font-bold text-[#848E9C]">Date</TableHead>
                    <TableHead className="text-right font-bold text-[#848E9C]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order: any) => (
                    <TableRow key={order.id} className="hover:bg-[#0B0E11] border-b border-[#2B3139] transition-colors">
                      <TableCell className="font-mono text-xs font-bold text-white">{order.id.slice(-10).toUpperCase()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "p-1.5 rounded-lg",
                            order.type === "EXCHANGE" ? "bg-primary/10 text-primary" : "bg-[#0ECB81]/10 text-[#0ECB81]"
                          )}>
                            {order.type === "EXCHANGE" ? <ArrowUpRight className="h-3.5 w-3.5" /> : <Gamepad2 className="h-3.5 w-3.5" />}
                          </div>
                          <span className="font-bold capitalize text-sm text-white">{order.type.replace("_", " ")}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-black text-sm text-white">${order.amount.toFixed(2)}</TableCell>
                      <TableCell className="font-black text-sm text-primary">{order.total.toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="text-xs text-[#848E9C] font-bold">
                        {new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </TableCell>
                      <TableCell className="text-right">
                        {order.status === "PENDING_PAYMENT" ? (
                          <Button size="sm" asChild className="rounded-lg h-8 px-4 text-xs font-black bg-primary text-primary-foreground hover:bg-primary/90">
                            <Link href={`/dashboard/orders/${order.id}/payment`}>Pay Now</Link>
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" asChild className="rounded-lg h-8 px-4 text-xs text-[#848E9C] hover:text-white hover:bg-[#0B0E11]">
                            <Link href={`/dashboard/orders/${order.id}/payment`}>Details</Link>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
