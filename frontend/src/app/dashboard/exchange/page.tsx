"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowUpDown, Copy, Loader2, UploadCloud, QrCode, Info } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { createOrderAction, uploadOrderProofAction } from "@/actions/order.actions";
import { getUserWalletsAction } from "@/actions/wallet.actions";
import { getPaymentMethodsAction } from "@/actions/payment.actions";
import { getPaymentAccountAction } from "@/actions/payment-account.actions";

export default function WalletExchangePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const [fromWalletId, setFromWalletId] = useState("");
  const [toWalletId, setToWalletId] = useState("");
  const [amount, setAmount] = useState("");
  const [receiveUsername, setReceiveUsername] = useState("");
  const [receiveWalletNumber, setReceiveWalletNumber] = useState("");
  const [receiveEmail, setReceiveEmail] = useState("");
  const [receivePhone, setReceivePhone] = useState("");
  const [transactionReference, setTransactionReference] = useState("");
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentPreview, setPaymentPreview] = useState<string | null>(null);
  const [receiveQr, setReceiveQr] = useState<File | null>(null);
  const [receiveQrPreview, setReceiveQrPreview] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  const { data: wallets, isLoading: walletsLoading } = useQuery({
    queryKey: ["user-wallets"],
    queryFn: async () => {
      const result = await getUserWalletsAction();
      if (!result.success) throw new Error(result.error);
      return result.wallets;
    },
  });

  const { data: methods } = useQuery({
    queryKey: ["exchange-methods"],
    queryFn: async () => {
      const result = await getPaymentMethodsAction("EXCHANGE");
      if (!result.success) throw new Error(result.error);
      return result.methods;
    },
  });

  const fromWallet = wallets?.find((wallet: any) => wallet.id === fromWalletId);
  const toWallet = methods?.find((m: any) => m.id === toWalletId);

  const { data: adminWallet } = useQuery({
    queryKey: ["admin-wallet", fromWalletId],
    queryFn: async () => {
      const result = await getPaymentAccountAction(fromWalletId);
      if (!result.success) throw new Error(result.error);
      return result.account;
    },
    enabled: !!fromWalletId,
  });

  const exchangeRate = toWallet?.rate ?? 1;
  const feePercentage = toWallet?.feePercentage ?? 0;

  const summary = useMemo(() => {
    const amountNum = Number(amount || 0);
    const fee = (amountNum * feePercentage) / 100;
    const receive = amountNum * exchangeRate - fee;
    return { fee, receive };
  }, [amount, exchangeRate, feePercentage]);

  const handleSwap = () => {
    const from = fromWalletId;
    setFromWalletId(toWalletId);
    setToWalletId(from);
  };

  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPaymentProof(file);
    setPaymentPreview(URL.createObjectURL(file));
  };

  const handleReceiveQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiveQr(file);
    setReceiveQrPreview(URL.createObjectURL(file));
  };

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        type: "EXCHANGE",
        paymentMethodId: toWalletId,
        fromWalletId,
        toWalletId,
        amount: Number(amount),
        exchangeRate,
        fee: summary.fee,
        receiveAmount: summary.receive,
        adminWalletId: adminWallet?.id,
        receiveUsername,
        receiveWalletNumber,
        receiveEmail,
        receivePhone,
        transactionReference,
        total: Number(amount) + summary.fee,
        rate: exchangeRate,
      };

      const result = await createOrderAction(payload);
      if (!result.success) throw new Error(result.error);
      return result.order;
    },
    onSuccess: (order) => {
      setOrderId(order.id);
      setStep(2);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!orderId || !paymentProof) throw new Error("Payment screenshot required");

      const formData = new FormData();
      formData.append("file", paymentProof);
      if (receiveQr) formData.append("receiveQrCode", receiveQr);

      const result = await uploadOrderProofAction(orderId, formData);
      if (!result.success) throw new Error(result.error);

      return result.order;
    },
    onSuccess: () => {
      toast.success("Exchange request submitted successfully");
      router.push("/dashboard/orders");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      createOrderMutation.mutate();
      return;
    }

    if (!paymentProof) {
      toast.error("Please upload payment proof");
      return;
    }

    uploadMutation.mutate();
  };

  if (walletsLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-black text-white">Wallet Exchange</h1>
        <p className="text-[#848E9C]">Exchange funds between supported wallets</p>
      </div>

      <div className="grid gap-8 md:grid-cols-5">
        <div className="md:col-span-3 space-y-6">
          <Card className="border-[#2B3139] bg-[#1E2329] rounded-3xl overflow-hidden">
            <CardHeader>
              <CardTitle className="text-white">Exchange Details</CardTitle>
              <CardDescription>Select wallets and enter amount</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                {step === 1 ? (
                  <>
                    <div className="space-y-2">
                      <Label className="text-[#848E9C] uppercase text-xs font-black tracking-widest">Send From</Label>
                      <Select value={fromWalletId} onValueChange={setFromWalletId}>
                        <SelectTrigger className="h-14 bg-[#0B0E11] border-[#2B3139] text-white rounded-xl">
                          <SelectValue placeholder="Select wallet" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1E2329] border-[#2B3139] text-white">
                          {wallets?.map((wallet: any) => (
                            <SelectItem key={wallet.id} value={wallet.id}>
                              {wallet.paymentMethod.name} (Balance: {wallet.balance})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex justify-center">
                      <Button type="button" size="icon" onClick={handleSwap} className="rounded-full h-12 w-12">
                        <ArrowUpDown className="h-5 w-5" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#848E9C] uppercase text-xs font-black tracking-widest">Receive In</Label>
                      <Select value={toWalletId} onValueChange={setToWalletId}>
                        <SelectTrigger className="h-14 bg-[#0B0E11] border-[#2B3139] text-white rounded-xl">
                          <SelectValue placeholder="Select destination wallet" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1E2329] border-[#2B3139] text-white">
                          {methods?.map((method: any) => (
                            <SelectItem key={method.id} value={method.id}>
                              {method.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#848E9C] uppercase text-xs font-black tracking-widest">Amount To Exchange</Label>
                      <Input
                        type="number"
                        placeholder="1000"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="h-14 bg-[#0B0E11] border-[#2B3139] text-white text-xl font-bold rounded-xl"
                        required
                        min="1"
                      />
                    </div>

                    {fromWallet && toWallet && amount && (
                      <div className="p-4 rounded-2xl bg-[#0B0E11] border border-[#2B3139] space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#848E9C]">Exchange Amount</span>
                          <span className="text-white font-bold">{amount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#848E9C]">Exchange Rate</span>
                          <span className="text-white font-bold">1 : {exchangeRate}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#848E9C]">Processing Fee ({feePercentage}%)</span>
                          <span className="text-orange-500 font-bold">{summary.fee.toFixed(2)}</span>
                        </div>
                        <div className="pt-2 border-t border-[#2B3139] flex justify-between">
                          <span className="text-white font-black">You Receive</span>
                          <span className="text-primary font-black text-lg">{summary.receive.toFixed(2)}</span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      <Label className="text-[#848E9C] uppercase text-xs font-black tracking-widest">Your Receiving Wallet Details</Label>
                      <Input
                        placeholder="Username / Account Name"
                        value={receiveUsername}
                        onChange={(e) => setReceiveUsername(e.target.value)}
                        className="h-12 bg-[#0B0E11] border-[#2B3139] text-white rounded-xl"
                        required
                      />
                      <Input
                        placeholder="Wallet Number / Account ID"
                        value={receiveWalletNumber}
                        onChange={(e) => setReceiveWalletNumber(e.target.value)}
                        className="h-12 bg-[#0B0E11] border-[#2B3139] text-white rounded-xl"
                        required
                      />
                      <Input
                        placeholder="Email (optional)"
                        value={receiveEmail}
                        onChange={(e) => setReceiveEmail(e.target.value)}
                        className="h-12 bg-[#0B0E11] border-[#2B3139] text-white rounded-xl"
                      />
                      <Input
                        placeholder="Phone (optional)"
                        value={receivePhone}
                        onChange={(e) => setReceivePhone(e.target.value)}
                        className="h-12 bg-[#0B0E11] border-[#2B3139] text-white rounded-xl"
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-6">
                    <div className="p-6 rounded-3xl bg-[#0B0E11] border-2 border-primary/20 flex flex-col items-center text-center space-y-4">
                      {adminWallet?.qrCodeUrl ? (
                        <Image src={adminWallet.qrCodeUrl} alt="QR Code" width={200} height={200} className="rounded-xl" />
                      ) : (
                        <div className="p-8 bg-white rounded-xl">
                          <QrCode className="h-32 w-32 text-black" />
                        </div>
                      )}
                      <div>
                        <p className="text-[#848E9C] text-sm uppercase font-black tracking-widest">Send Payment To</p>
                        {fromWallet && (
                          <p className="text-white font-bold text-lg mt-1">{fromWallet.paymentMethod.name}</p>
                        )}
                      </div>
                      {adminWallet && (
                        <div className="w-full space-y-2">
                          <div className="flex items-center gap-2">
                            <Input
                              readOnly
                              value={adminWallet.accountName || ""}
                              className="h-10 bg-[#1E2329] border-[#2B3139] text-white text-center rounded-lg"
                            />
                            <Button
                              type="button"
                              size="icon"
                              variant="secondary"
                              onClick={() => {
                                navigator.clipboard.writeText(adminWallet.accountName || "");
                                toast.success("Copied");
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              readOnly
                              value={adminWallet.accountNumber || ""}
                              className="h-10 bg-[#1E2329] border-[#2B3139] text-white text-center rounded-lg"
                            />
                            <Button
                              type="button"
                              size="icon"
                              variant="secondary"
                              onClick={() => {
                                navigator.clipboard.writeText(adminWallet.accountNumber || "");
                                toast.success("Copied");
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                      <div className="w-full pt-4 border-t border-[#2B3139]">
                        <p className="text-primary font-black text-2xl">{amount}</p>
                        <p className="text-[#848E9C] text-xs">Exact amount to send</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[#848E9C] uppercase text-xs font-black tracking-widest">Your Receiving QR Code</Label>
                      <div
                        className={cn(
                          "relative border-2 border-dashed border-[#2B3139] rounded-2xl p-8 flex flex-col items-center justify-center transition-all hover:border-primary/50 cursor-pointer overflow-hidden",
                          receiveQrPreview ? "aspect-video" : "h-40"
                        )}
                        onClick={() => document.getElementById("receive-qr")?.click()}
                      >
                        {receiveQrPreview ? (
                          <Image src={receiveQrPreview} alt="Preview" fill className="object-contain" />
                        ) : (
                          <>
                            <UploadCloud className="h-10 w-10 text-[#848E9C] mb-2" />
                            <p className="text-[#848E9C] text-sm font-medium">Click to upload your receiving QR code</p>
                          </>
                        )}
                        <input
                          type="file"
                          id="receive-qr"
                          className="hidden"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          onChange={handleReceiveQrUpload}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[#848E9C] uppercase text-xs font-black tracking-widest">Upload Payment Proof</Label>
                      <div
                        className={cn(
                          "relative border-2 border-dashed border-[#2B3139] rounded-2xl p-8 flex flex-col items-center justify-center transition-all hover:border-primary/50 cursor-pointer overflow-hidden",
                          paymentPreview ? "aspect-video" : "h-40"
                        )}
                        onClick={() => document.getElementById("payment-proof")?.click()}
                      >
                        {paymentPreview ? (
                          <Image src={paymentPreview} alt="Preview" fill className="object-contain" />
                        ) : (
                          <>
                            <UploadCloud className="h-10 w-10 text-[#848E9C] mb-2" />
                            <p className="text-[#848E9C] text-sm font-medium">Click to upload screenshot</p>
                          </>
                        )}
                        <input
                          type="file"
                          id="payment-proof"
                          className="hidden"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          onChange={handleProofUpload}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#848E9C] uppercase text-xs font-black tracking-widest">
                        Transaction Reference ID (optional)
                      </Label>
                      <Input
                        placeholder="TRX123456789"
                        value={transactionReference}
                        onChange={(e) => setTransactionReference(e.target.value)}
                        className="h-12 bg-[#0B0E11] border-[#2B3139] text-white rounded-xl"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="pb-8 px-8 flex flex-col gap-3">
                <Button
                  className="w-full h-14 rounded-2xl font-black text-lg bg-primary text-[#0B0E11] hover:bg-primary/90"
                  disabled={
                    (step === 1 &&
                      (createOrderMutation.isPending ||
                        !fromWalletId ||
                        !toWalletId ||
                        !amount ||
                        !receiveUsername ||
                        !receiveWalletNumber)) ||
                    (step === 2 && uploadMutation.isPending)
                  }
                  type="submit"
                >
                  {createOrderMutation.isPending || uploadMutation.isPending ? (
                    <>
                      <Loader2 className="animate-spin mr-2" />
                      {step === 1 ? "Creating Order..." : "Submitting..."}
                    </>
                  ) : step === 1 ? (
                    "Next Step"
                  ) : (
                    "Submit Exchange Request"
                  )}
                </Button>
                {step === 2 && (
                  <Button
                    variant="ghost"
                    className="w-full text-[#848E9C] hover:text-white"
                    type="button"
                    onClick={() => setStep(1)}
                  >
                    Go Back
                  </Button>
                )}
              </CardFooter>
            </form>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card className="border-[#2B3139] bg-[#1E2329] rounded-3xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Exchange Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-2">
                <p className="text-white font-bold">1. Select Wallets</p>
                <p className="text-[#848E9C]">Choose the wallet to send from and receive in.</p>
              </div>
              <div className="space-y-2">
                <p className="text-white font-bold">2. Enter Amount</p>
                <p className="text-[#848E9C]">Enter the amount you want to exchange.</p>
              </div>
              <div className="space-y-2">
                <p className="text-white font-bold">3. Make Payment</p>
                <p className="text-[#848E9C]">Scan the QR code or use the provided details to send the exact amount.</p>
              </div>
              <div className="space-y-2">
                <p className="text-white font-bold">4. Upload Proof</p>
                <p className="text-[#848E9C]">Upload a clear screenshot of your payment confirmation.</p>
              </div>
              <div className="mt-6 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                <p className="text-primary text-xs font-bold leading-relaxed">
                  Note: Exchange requests are usually processed within 5–30 minutes after approval by our team.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
