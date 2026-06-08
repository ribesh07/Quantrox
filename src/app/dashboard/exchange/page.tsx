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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowDown, Info, Loader2, DollarSign, Wallet as WalletIcon, ArrowRightLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ExchangePage() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [selectedWalletId, setSelectedWalletId] = useState("");
  const [usdtAddress, setUsdtAddress] = useState("");

  const { data: wallets, isLoading: walletsLoading } = useQuery({
    queryKey: ["user-wallets"],
    queryFn: async () => {
      const res = await fetch("/api/wallets");
      return res.json();
    },
  });

  const selectedWallet = wallets?.find((w: any) => w.id === selectedWalletId);
  const paymentMethod = selectedWallet?.paymentMethod;

  const calculateUSDT = () => {
    if (!amount || !paymentMethod) return 0;
    const inputAmount = parseFloat(amount);
    const grossUSDT = inputAmount * paymentMethod.rate;
    const fee = (grossUSDT * paymentMethod.feePercentage) / 100;
    return grossUSDT - fee;
  };

  const createOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create request");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Exchange request submitted!");
      router.push("/dashboard/orders");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (val > (selectedWallet?.balance || 0)) {
      toast.error("Insufficient balance");
      return;
    }
    if (!usdtAddress) {
      toast.error("Please enter your USDT address");
      return;
    }

    createOrderMutation.mutate({
      type: "EXCHANGE",
      paymentMethodId: paymentMethod.id,
      amount: val,
      walletAddress: usdtAddress,
    });
  };

  if (walletsLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-20">
      <div className="text-center md:text-left">
        <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
          <ArrowRightLeft className="text-primary h-10 w-10" />
          Wallet Exchange
        </h1>
        <p className="text-[#848E9C] mt-2 font-medium text-lg">Convert your wallet balances into USDT instantly.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-5">
        <div className="md:col-span-3">
          <Card className="border border-[#2B3139] bg-[#1E2329] shadow-2xl rounded-[2.5rem] overflow-hidden">
            <div className="h-2 bg-primary" />
            <CardHeader className="pt-10 px-8">
              <CardTitle className="text-2xl font-black text-white">Exchange Details</CardTitle>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-8 px-8 py-6">
                <div className="space-y-4">
                  <Label className="text-sm font-black text-[#848E9C] uppercase tracking-widest">Select Source Wallet</Label>
                  <Select value={selectedWalletId} onValueChange={setSelectedWalletId}>
                    <SelectTrigger className="h-16 bg-[#0B0E11] border-2 border-[#2B3139] text-white rounded-2xl">
                      <SelectValue placeholder="Choose a wallet" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1E2329] border-[#2B3139] text-white">
                      {wallets?.map((wallet: any) => (
                        <SelectItem key={wallet.id} value={wallet.id}>
                          {wallet.paymentMethod.name} (Balance: ${wallet.balance.toFixed(2)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedWallet && (
                    <p className="text-xs text-primary font-bold">
                      Available: ${selectedWallet.balance.toFixed(2)}
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <Label className="text-sm font-black text-[#848E9C] uppercase tracking-widest">Amount to Convert</Label>
                  </div>
                  <div className="relative group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 bg-[#0B0E11] p-2 rounded-xl">
                      <DollarSign className="h-6 w-6 text-primary" />
                    </div>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="pl-16 text-2xl h-20 rounded-3xl border-2 border-[#2B3139] bg-[#0B0E11] text-white focus:border-primary transition-all font-black"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-center py-2">
                  <ArrowDown className="h-8 w-8 text-primary animate-bounce" />
                </div>

                <div className="space-y-4">
                  <Label className="text-sm font-black text-[#848E9C] uppercase tracking-widest">You Receive (Estimated)</Label>
                  <div className="relative">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 bg-primary/10 p-2 rounded-xl">
                      <span className="font-black text-primary text-xl px-1">₮</span>
                    </div>
                    <Input
                      type="text"
                      value={`${calculateUSDT().toFixed(2)} USDT`}
                      className="pl-16 text-2xl h-20 rounded-3xl border-2 border-[#2B3139] bg-[#0B0E11]/50 text-primary font-black cursor-not-allowed"
                      readOnly
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-sm font-black text-[#848E9C] uppercase tracking-widest">Your USDT Address (TRC20)</Label>
                  <Input
                    placeholder="Enter your USDT wallet address"
                    value={usdtAddress}
                    onChange={(e) => setUsdtAddress(e.target.value)}
                    className="h-16 rounded-2xl border-2 border-[#2B3139] bg-[#0B0E11] text-white focus:border-primary font-mono text-sm"
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-6 px-8 pb-12">
                <Button
                  className="w-full text-xl h-20 rounded-[1.5rem] bg-primary text-[#0B0E11] font-black shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
                  size="lg"
                  type="submit"
                  disabled={createOrderMutation.isPending || !amount || !selectedWalletId}
                >
                  {createOrderMutation.isPending ? <Loader2 className="animate-spin h-8 w-8" /> : "Request Exchange"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card className="border-[#2B3139] bg-[#1E2329] rounded-[2rem]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Exchange Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-sm">
              {paymentMethod ? (
                <div className="space-y-4 p-4 bg-[#0B0E11] rounded-2xl border border-[#2B3139]">
                  <div className="flex justify-between">
                    <span className="text-[#848E9C]">Market Rate</span>
                    <span className="text-white font-bold">1 USD = {paymentMethod.rate} USDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#848E9C]">Exchange Fee</span>
                    <span className="text-orange-500 font-bold">{paymentMethod.feePercentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#848E9C]">Min. Exchange</span>
                    <span className="text-white font-bold">${paymentMethod.minAmount}</span>
                  </div>
                </div>
              ) : (
                <p className="text-[#848E9C] italic">Select a wallet to see specific rates and fees.</p>
              )}

              <div className="space-y-3">
                <p className="text-white font-bold">Important Notes:</p>
                <ul className="list-disc list-inside text-[#848E9C] space-y-2">
                  <li>Ensure your USDT address is correct.</li>
                  <li>We currently support <b>TRC20</b> network only.</li>
                  <li>Processing time: 5-30 minutes.</li>
                  <li>Balance is deducted immediately upon request.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
