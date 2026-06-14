'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Copy, Loader2, UploadCloud, QrCode, Info, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { createOrderAction, uploadOrderProofAction } from '@/actions/order.actions';
import { getPaymentMethodsAction } from '@/actions/payment.actions';

export default function WalletExchangePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [amount, setAmount] = useState('');
  const [receiveUsername, setReceiveUsername] = useState('');
  const [receiveWalletNumber, setReceiveWalletNumber] = useState('');
  const [receiveEmail, setReceiveEmail] = useState('');
  const [receivePhone, setReceivePhone] = useState('');
  const [transactionReference, setTransactionReference] = useState('');
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentPreview, setPaymentPreview] = useState<string | null>(null);
  const [receiveQr, setReceiveQr] = useState<File | null>(null);
  const [receiveQrPreview, setReceiveQrPreview] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  const { data: methods, isLoading: methodsLoading } = useQuery({
    queryKey: ['exchange-methods'],
    queryFn: async () => {
      const result = await getPaymentMethodsAction('EXCHANGE');
      if (!result.success) throw new Error(result.error);
      return result.methods;
    },
  });

  const selectedMethod = methods?.find((m: any) => m.id === paymentMethodId);

  const calculateFee = () => {
    if (!selectedMethod || !amount) return 0;
    return (parseFloat(amount) * selectedMethod.feePercentage) / 100;
  };

  const calculateTotal = () => {
    if (!amount) return 0;
    return parseFloat(amount) + calculateFee();
  };

  const calculateReceive = () => {
    if (!selectedMethod || !amount) return 0;
    return parseFloat(amount) * (selectedMethod.rate ?? 1);
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
    mutationFn: async (data: any) => {
      const res = await createOrderAction(data);
      if (!res.success) throw new Error(res.error);
      return res.order;
    },
    onSuccess: (order) => {
      setOrderId(order.id);
      setStep(2);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create order');
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!orderId || !paymentProof) throw new Error('Payment proof required');

      const formData = new FormData();
      formData.append('file', paymentProof);
      if (receiveQr) formData.append('receiveQrCode', receiveQr);

      const result = await uploadOrderProofAction(orderId, formData);
      if (!result.success) throw new Error(result.error);

      return result.order;
    },
    onSuccess: () => {
      toast.success('Exchange request submitted successfully!');
      router.push('/dashboard/orders');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to upload proof');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      createOrderMutation.mutate({
        type: 'EXCHANGE',
        paymentMethodId,
        amount: parseFloat(amount),
        fee: calculateFee(),
        receiveAmount: calculateReceive(),
        receiveUsername,
        receiveWalletNumber,
        receiveEmail,
        receivePhone,
        transactionReference,
        total: calculateTotal(),
        rate: selectedMethod?.rate ?? 1,
      });
      return;
    }
    uploadMutation.mutate();
  };

  if (methodsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <div className="relative">
          <div className="h-20 w-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <Loader2 className="h-10 w-10 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-[#848E9C] font-bold text-lg animate-pulse tracking-widest uppercase">Loading...</p>
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
              <CardDescription>Select payment method and enter amount</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                {step === 1 ? (
                  <>
                    <div className="space-y-2">
                      <Label className="text-[#848E9C] uppercase text-xs font-black tracking-widest">Select Payment Method</Label>
                      <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
                        <SelectTrigger className="h-14 bg-[#0B0E11] border-[#2B3139] text-white rounded-xl">
                          <SelectValue placeholder="Choose a payment method" />
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
                      <Label className="text-[#848E9C] uppercase text-xs font-black tracking-widest">Amount To Exchange</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#848E9C]" />
                        <Input
                          type="number"
                          placeholder="1000"
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
                          <span className="text-[#848E9C]">Exchange Amount</span>
                          <span className="text-white font-bold">{amount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#848E9C]">Exchange Rate</span>
                          <span className="text-white font-bold">1 : {selectedMethod.rate ?? 1}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#848E9C]">Processing Fee ({selectedMethod.feePercentage}%)</span>
                          <span className="text-orange-500 font-bold">{calculateFee().toFixed(2)}</span>
                        </div>
                        <div className="pt-2 border-t border-[#2B3139] flex justify-between">
                          <span className="text-white font-black">You Receive</span>
                          <span className="text-primary font-black text-lg">{calculateReceive().toFixed(2)}</span>
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
                      {selectedMethod?.qrCode ? (
                        <Image src={selectedMethod.qrCode} alt="QR Code" width={200} height={200} className="rounded-xl" />
                      ) : (
                        <div className="p-8 bg-white rounded-xl">
                          <QrCode className="h-40 w-40 text-black" />
                        </div>
                      )}
                      <div>
                        <p className="text-[#848E9C] text-sm uppercase font-black tracking-widest">Send Payment To</p>
                        {selectedMethod && (
                          <p className="text-white font-bold text-lg mt-1">{selectedMethod.name}</p>
                        )}
                      </div>
                      {selectedMethod?.details && (
                        <div className="w-full space-y-2">
                          <div className="flex items-center gap-2">
                            <Input
                              readOnly
                              value={selectedMethod.details}
                              className="h-10 bg-[#1E2329] border-[#2B3139] text-white text-center rounded-lg"
                            />
                            <Button
                              type="button"
                              size="icon"
                              variant="secondary"
                              onClick={() => {
                                navigator.clipboard.writeText(selectedMethod.details);
                                toast.success('Copied');
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                      <div className="w-full pt-4 border-t border-[#2B3139]">
                        <p className="text-primary font-black text-2xl">{calculateTotal().toFixed(2)}</p>
                        <p className="text-[#848E9C] text-xs">Exact amount to be paid</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[#848E9C] uppercase text-xs font-black tracking-widest">Your Receiving QR Code</Label>
                      <div
                        className={cn(
                          "relative border-2 border-dashed border-[#2B3139] rounded-3xl p-8 flex flex-col items-center justify-center transition-all hover:border-primary/50 cursor-pointer overflow-hidden",
                          receiveQrPreview ? "aspect-video" : "h-40"
                        )}
                        onClick={() => document.getElementById('receive-qr')?.click()}
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
                          accept="image/*"
                          onChange={handleReceiveQrUpload}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[#848E9C] uppercase text-xs font-black tracking-widest">Upload Payment Proof</Label>
                      <div
                        className={cn(
                          "relative border-2 border-dashed border-[#2B3139] rounded-3xl p-8 flex flex-col items-center justify-center transition-all hover:border-primary/50 cursor-pointer overflow-hidden",
                          paymentPreview ? "aspect-video" : "h-40"
                        )}
                        onClick={() => document.getElementById('payment-proof')?.click()}
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
                          accept="image/*"
                          onChange={handleProofUpload}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#848E9C] uppercase text-xs font-black tracking-widest">
                        Transaction Reference (optional)
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
                        !paymentMethodId ||
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
                <p className="text-white font-bold">1. Select Payment Method</p>
                <p className="text-[#848E9C]">Choose the payment method you want to use.</p>
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
