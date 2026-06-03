"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowDown, Info, Loader2, DollarSign, Wallet } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ExchangePage() {
  const router = useRouter();
  const [usdAmount, setUsdAmount] = useState("");
  const [usdtAmount, setUsdtAmount] = useState(0);

  const { data: rates, isLoading: ratesLoading } = useQuery({
    queryKey: ["rates"],
    queryFn: async () => {
      const res = await fetch("/api/admin/rates");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const usdToUsdtRate = Array.isArray(rates) ? rates.find((r: any) => r.type === "USD_TO_USDT")?.rate || 0.95 : 0.95;

  useEffect(() => {
    const amount = parseFloat(usdAmount);
    if (!isNaN(amount) && amount > 0) {
      setUsdtAmount(amount * usdToUsdtRate);
    } else {
      setUsdtAmount(0);
    }
  }, [usdAmount, usdToUsdtRate]);

  const createOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create order");
      return res.json();
    },
    onSuccess: (data) => {
      toast.success("Order created! Redirecting to payment...");
      router.push(`/dashboard/orders/${data.id}/payment`);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create order");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(usdAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    createOrderMutation.mutate({
      type: "EXCHANGE",
      amount: amount,
      rate: usdToUsdtRate,
      total: usdtAmount,
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-10 pb-20 bg-[#0B0E11] min-h-screen">
      <div className="text-center md:text-left">
        <h1 className="text-4xl font-black text-white tracking-tight">Convert Assets</h1>
        <p className="text-[#848E9C] mt-2 font-medium text-lg">Exchange Cash App USD to USDT instantly.</p>
      </div>

      <Card className="border border-[#2B3139] bg-[#1E2329] shadow-2xl rounded-[2.5rem] overflow-hidden">
        <div className="h-2 bg-primary" />
        <CardHeader className="pt-10 px-8 md:px-12">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-black text-white">Calculator</CardTitle>
            <div className="flex items-center gap-2 bg-[#0B0E11] px-4 py-2 rounded-full border border-[#2B3139]">
              <span className="text-[10px] font-black text-[#848E9C] uppercase tracking-widest">Rate</span>
              <span className="text-primary font-black text-sm">1 USD = {usdToUsdtRate} USDT</span>
            </div>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-8 px-8 md:px-12 py-6">
            <div className="space-y-4">
              <div className="flex justify-between items-end px-1">
                <Label htmlFor="usd" className="text-sm font-black text-[#848E9C] uppercase tracking-widest">You Send</Label>
                <span className="text-xs font-bold text-[#474D57]">Cash App USD</span>
              </div>
              <div className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 bg-[#0B0E11] p-2 rounded-xl group-focus-within:bg-primary/10 transition-colors">
                  <DollarSign className="h-6 w-6 text-[#848E9C] group-focus-within:text-primary transition-colors" />
                </div>
                <Input
                  id="usd"
                  type="number"
                  placeholder="0.00"
                  value={usdAmount}
                  onChange={(e) => setUsdAmount(e.target.value)}
                  className="pl-16 text-2xl h-20 rounded-3xl border-2 border-[#2B3139] bg-[#0B0E11] text-white focus:border-primary transition-all font-black placeholder:text-[#2B3139]"
                  required
                  min="1"
                  step="0.01"
                />
              </div>
            </div>

            <div className="flex justify-center relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-[#2B3139] border-dashed opacity-20" />
              </div>
              <div className="relative bg-[#1E2329] border-2 border-[#2B3139] p-4 rounded-[1.5rem] shadow-xl z-10 group-hover:rotate-180 transition-transform duration-500">
                <ArrowDown className="h-6 w-6 text-primary" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end px-1">
                <Label htmlFor="usdt" className="text-sm font-black text-[#848E9C] uppercase tracking-widest">You Receive</Label>
                <span className="text-xs font-bold text-[#474D57]">USDT (TRC20)</span>
              </div>
              <div className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 bg-primary/10 p-2 rounded-xl">
                  <span className="font-black text-primary text-xl px-1">₮</span>
                </div>
                <Input
                  id="usdt"
                  type="number"
                  value={usdtAmount.toFixed(2)}
                  className="pl-16 text-2xl h-20 rounded-3xl border-2 border-[#2B3139] bg-[#0B0E11]/50 text-primary focus:ring-0 transition-all font-black cursor-not-allowed"
                  readOnly
                />
              </div>
            </div>

            <div className="rounded-[2rem] bg-blue-500/5 border border-blue-500/10 p-6 flex gap-5 text-sm text-blue-400 font-medium">
              <div className="bg-blue-500/10 p-3 rounded-2xl h-fit">
                <Info className="h-6 w-6 shrink-0" />
              </div>
              <p className="leading-relaxed">
                Fees are automatically calculated and included in the market rate. The amount shown above is the <b>final amount</b> you will receive.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-6 px-8 md:px-12 pb-12">
            <Button
              className="w-full text-xl h-20 rounded-[1.5rem] bg-primary text-[#0B0E11] font-black shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
              size="lg"
              type="submit"
              disabled={createOrderMutation.isPending || !usdAmount || parseFloat(usdAmount) <= 0}
            >
              {createOrderMutation.isPending ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                "Exchange Now"
              )}
            </Button>
            <div className="flex items-center justify-center gap-3 text-[#474D57] font-bold text-xs uppercase tracking-tighter">
              <Wallet className="h-4 w-4" />
              Secure TRC20/ERC20 Transactions
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
