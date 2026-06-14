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
import { Loader2, Info, DollarSign, QrCode, UploadCloud } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { createOrderAction, uploadOrderProofAction } from "@/actions/order.actions";
import { getPaymentMethodsAction } from "@/actions/payment.actions";

export default function DepositPage() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [selectedMethodId, setSelectedMethodId] = useState("");
  const [step, setStep] = useState(1);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { data: methods, isLoading: methodsLoading } = useQuery({
    queryKey: ["payment-methods", "DEPOSIT"],
    queryFn: async () => {
      const result = await getPaymentMethodsAction("DEPOSIT");
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.methods;
    },
  });

  const selectedMethod = methods?.find((m: any) => m.id === selectedMethodId);

  const calculateFee = () => {
    if (!selectedMethod || !amount) return 0;
    return (parseFloat(amount) * selectedMethod.feePercentage) / 100;
  };

  const calculateTotal = () => {
    if (!amount) return 0;
    return parseFloat(amount) + calculateFee();
  };

  const calculatePoints = () => {
    if (!amount || !selectedMethod) return 0;
    return parseFloat(amount) * selectedMethod.rate;
  };

  const uploadMutation = useMutation({
    mutationFn: async ({ orderId, file }: { orderId: string; file: File }) => {
      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadOrderProofAction(orderId, formData);
      if (!result.success) throw new Error(result.error);
      return result.order;
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const result = await createOrderAction(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.order;
    },
    onSuccess: async (data) => {
      if (screenshot) {
        await uploadMutation.mutateAsync({ orderId: data.id, file: screenshot });
      }
      toast.success("Deposit request submitted successfully!");
      router.push("/dashboard/orders");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setScreenshot(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }

    if (!screenshot) {
      toast.error("Please upload payment proof");
      return;
    }

    createOrderMutation.mutate({
      type: "DEPOSIT",
      paymentMethodId: selectedMethodId,
      amount: parseFloat(amount),
    });
  };

  if (methodsLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-black text-white">Deposit Funds</h1>
        <p className="text-[#848E9C]">Add balance to your gaming wallet</p>
      </div>

      <div className="grid gap-8 md:grid-cols-5">
        <div className="md:col-span-3 space-y-6">
          <Card className="border-[#2B3139] bg-[#1E2329] rounded-3xl overflow-hidden">
            <CardHeader>
              <CardTitle className="text-white">Deposit Details</CardTitle>
              <CardDescription>Enter amount and select payment method</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                {step === 1 ? (
                  <>
                    <div className="space-y-2">
                      <Label className="text-[#848E9C] uppercase text-xs font-black tracking-widest">Select Payment Method</Label>
                      <Select value={selectedMethodId} onValueChange={setSelectedMethodId}>
                        <SelectTrigger className="h-14 bg-[#0B0E11] border-[#2B3139] text-white rounded-xl">
                          <SelectValue placeholder="Choose a method" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1E2329] border-[#2B3139] text-white">
                          {methods?.map((method: any) => (
                            <SelectItem key={method.id} value={method.id}>
                              {method.name} {method.feePercentage === 0 ? "(No Fee)" : `(${method.feePercentage}% fee)`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#848E9C] uppercase text-xs font-black tracking-widest">Amount to Deposit ($)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#848E9C]" />
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="h-14 pl-12 bg-[#0B0E11] border-[#2B3139] text-white text-xl font-bold rounded-xl"
                          required
                          min="1"
                        />
                      </div>
                    </div>

                    {selectedMethod && amount && (
                      <div className="p-4 rounded-2xl bg-[#0B0E11] border border-[#2B3139] space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#848E9C]">Deposit Amount</span>
                          <span className="text-white font-bold">${parseFloat(amount).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#848E9C]">Processing Fee ({selectedMethod.feePercentage}%)</span>
                          <span className="text-orange-500 font-bold">${calculateFee().toFixed(2)}</span>
                        </div>
                        <div className="pt-2 border-t border-[#2B3139] flex justify-between">
                          <span className="text-white font-black">Total Payable</span>
                          <span className="text-primary font-black text-lg">${calculateTotal().toFixed(2)}</span>
                        </div>
                        <div className="pt-2 flex justify-between items-center bg-primary/5 p-2 rounded-lg">
                          <span className="text-primary text-xs font-black uppercase">You will receive</span>
                          <span className="text-primary font-black">{calculatePoints().toFixed(2)} Points</span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-6">
                    <div className="p-6 rounded-3xl bg-[#0B0E11] border-2 border-primary/20 flex flex-col items-center text-center space-y-4">
                      <div className="p-4 bg-white rounded-2xl">
                        {selectedMethod?.qrCode ? (
                          <Image src={selectedMethod.qrCode} alt="QR Code" width={200} height={200} />
                        ) : (
                          <QrCode className="h-40 w-40 text-black" />
                        )}
                      </div>
                      <div>
                        <p className="text-[#848E9C] text-sm uppercase font-black tracking-widest">Pay to this account</p>
                        <p className="text-white font-bold text-lg mt-1">{selectedMethod?.details || "Contact Admin for Details"}</p>
                      </div>
                      <div className="w-full pt-4 border-t border-[#2B3139]">
                        <p className="text-primary font-black text-2xl">${calculateTotal().toFixed(2)}</p>
                        <p className="text-[#848E9C] text-xs">Exact amount to be paid</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[#848E9C] uppercase text-xs font-black tracking-widest">Upload Payment Proof</Label>
                      <div 
                        className={cn(
                          "relative border-2 border-dashed border-[#2B3139] rounded-3xl p-8 flex flex-col items-center justify-center transition-all hover:border-primary/50 cursor-pointer overflow-hidden",
                          previewUrl ? "aspect-video" : "h-40"
                        )}
                        onClick={() => document.getElementById('screenshot')?.click()}
                      >
                        {previewUrl ? (
                          <Image src={previewUrl} alt="Preview" fill className="object-contain" unoptimized />
                        ) : (
                          <>
                            <UploadCloud className="h-10 w-10 text-[#848E9C] mb-2" />
                            <p className="text-[#848E9C] text-sm font-medium">Click to upload screenshot</p>
                          </>
                        )}
                        <input 
                          type="file" 
                          id="screenshot" 
                          className="hidden" 
                          accept="image/*"
                          onChange={handleFileChange}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="pb-8 px-8">
                <Button 
                  className="w-full h-14 rounded-2xl font-black text-lg bg-primary text-[#0B0E11] hover:bg-primary/90"
                  disabled={!selectedMethodId || !amount || createOrderMutation.isPending}
                >
                  {createOrderMutation.isPending ? <Loader2 className="animate-spin" /> : (step === 1 ? "Next Step" : "Submit Deposit")}
                </Button>
                {step === 2 && (
                  <Button 
                    variant="ghost" 
                    className="w-full mt-2 text-[#848E9C] hover:text-white"
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
                Deposit Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-2">
                <p className="text-white font-bold">1. Select Method</p>
                <p className="text-[#848E9C]">Choose your preferred payment method from the list.</p>
              </div>
              <div className="space-y-2">
                <p className="text-white font-bold">2. Enter Amount</p>
                <p className="text-[#848E9C]">Enter the amount you wish to deposit. Fees are calculated automatically.</p>
              </div>
              <div className="space-y-2">
                <p className="text-white font-bold">3. Make Payment</p>
                <p className="text-[#848E9C]">Scan the QR code or use the provided details to send the EXACT total amount.</p>
              </div>
              <div className="space-y-2">
                <p className="text-white font-bold">4. Upload Proof</p>
                <p className="text-[#848E9C]">Upload a clear screenshot of your transaction confirmation.</p>
              </div>
              <div className="mt-6 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                <p className="text-primary text-xs font-bold leading-relaxed">
                  Note: Deposits are usually processed within 5-15 minutes after approval by our team.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
