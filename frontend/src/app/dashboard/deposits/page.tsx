"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, DollarSign, PlusCircle, UploadCloud, ShieldCheck, QrCode, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { createDepositAction, uploadDepositProofAction, getMyDepositsAction, getMyTotalDepositAction } from "@/actions/merchant.actions";
import { getPaymentMethodsAction } from "@/actions/payment.actions";
import { DepositStatus, DepositType, PaymentMethodCategory } from "@/lib/prisma-types";
import { resolveMediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function MerchantDepositsPage() {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<1 | 2>(1);
  const [amount, setAmount] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [depositId, setDepositId] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);

  const { data: deposits, isLoading: depositsLoading } = useQuery({
    queryKey: ["my-deposits"],
    queryFn: async () => {
      const result = await getMyDepositsAction();
      return result.success ? result.deposits : [];
    },
  });

  const { data: totalData } = useQuery({
    queryKey: ["my-total-deposit"],
    queryFn: async () => {
      const result = await getMyTotalDepositAction();
      return result.success ? result.total : 0;
    },
  });

  const { data: paymentMethods } = useQuery({
    queryKey: ["deposit-payment-methods"],
    queryFn: async () => {
      const result = await getPaymentMethodsAction(PaymentMethodCategory.DEPOSIT);
      return result.success ? result.methods : [];
    },
  });

  const selectedMethod = paymentMethods?.find((method: any) => method.id === paymentMethodId);

  const createDepositMutation = useMutation({
    mutationFn: async () => {
      const parsedAmount = Number(amount);
      if (!parsedAmount || parsedAmount <= 0) throw new Error("Please enter a valid deposit amount");
      if (!paymentMethodId) throw new Error("Please select a payment method");

      const result = await createDepositAction({
        amount: parsedAmount,
        type: DepositType.INITIAL,
        requiredDeposit: parsedAmount,
        paymentMethodId,
        paymentMethodName: selectedMethod?.name,
        instant: false,
      });

      if (!result.success) throw new Error(result.error);
      return result.deposit;
    },
    onSuccess: (deposit) => {
      setDepositId(deposit.id);
      setStep(2);
      toast.success("Deposit request created. Please pay and submit proof.");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const uploadProofMutation = useMutation({
    mutationFn: async (event: React.FormEvent<HTMLFormElement>) => {
      if (!proofFile || !depositId) throw new Error("Please upload a payment proof screenshot");
      const formData = new FormData(event.currentTarget);
      formData.append("proofImage", proofFile);
      const result = await uploadDepositProofAction(depositId, formData);
      if (!result.success) throw new Error(result.error);
      return result.deposit;
    },
    onSuccess: () => {
      toast.success("Deposit proof submitted successfully");
      setStep(1);
      setAmount("");
      setPaymentMethodId("");
      setDepositId(null);
      setProofFile(null);
      setProofPreview(null);
      queryClient.invalidateQueries({ queryKey: ["my-deposits"] });
      queryClient.invalidateQueries({ queryKey: ["my-total-deposit"] });
    },
    onError: (error: any) => toast.error(error.message),
  });

  const handleProofChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  };

  const getStatusBadge = (status: DepositStatus) => {
    switch (status) {
      case DepositStatus.APPROVED:
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20 rounded-full px-3">Approved</Badge>;
      case DepositStatus.FROZEN:
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 rounded-full px-3">Frozen</Badge>;
      case DepositStatus.RELEASED:
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20 rounded-full px-3">Released</Badge>;
      case DepositStatus.REJECTED:
        return <Badge variant="destructive" className="rounded-full px-3">Rejected</Badge>;
      default:
        return <Badge variant="secondary" className="rounded-full px-3">Pending</Badge>;
    }
  };

  const getTypeBadge = (type: DepositType) => {
    switch (type) {
      case DepositType.INITIAL:
        return <Badge variant="outline" className="rounded-full px-3">Initial</Badge>;
      case DepositType.ADDITIONAL:
        return <Badge variant="outline" className="rounded-full px-3">Additional</Badge>;
      case DepositType.ADJUSTMENT:
        return <Badge variant="outline" className="rounded-full px-3">Adjustment</Badge>;
      case DepositType.WITHDRAWAL:
        return <Badge variant="outline" className="rounded-full px-3">Withdrawal</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Deposits</h1>
        <p className="text-muted-foreground mt-1">View your deposit history</p>
      </div>

      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-primary/20">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Available Deposit</p>
              <p className="text-3xl font-bold">
                ${totalData?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{step === 1 ? "Add Deposit Request" : "Pay and Submit Proof"}</CardTitle>
          <CardDescription>
            {step === 1
              ? "Choose the amount and payment method, then follow the payment instructions."
              : "Scan the QR code, complete the transfer, and upload the payment proof."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 ? (
            <div className="grid gap-4 md:grid-cols-[1.2fr_1fr_auto] items-end">
              <div className="space-y-2">
                <Label htmlFor="deposit-amount">Amount</Label>
                <Input
                  id="deposit-amount"
                  type="number"
                  min="1"
                  placeholder="100"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deposit-method">Payment Method</Label>
                <select
                  id="deposit-method"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={paymentMethodId}
                  onChange={(e) => setPaymentMethodId(e.target.value)}
                >
                  <option value="">Select payment method</option>
                  {paymentMethods?.map((method: any) => (
                    <option key={method.id} value={method.id}>{method.name}</option>
                  ))}
                </select>
              </div>
              <Button onClick={() => createDepositMutation.mutate()} disabled={createDepositMutation.isPending}>
                {createDepositMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                Next Step
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-2xl border bg-muted/20 p-6 space-y-6">
                <div className="flex items-center gap-2 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                  <span className="font-semibold">Payment Instructions</span>
                </div>

                <div className="flex flex-col items-center justify-center space-y-5">
                  {selectedMethod?.qrCode ? (
                    <div className="relative aspect-square w-64 overflow-hidden rounded-3xl border bg-white p-4 shadow-sm">
                      <Image src={resolveMediaUrl(selectedMethod.qrCode)} alt="Payment QR" fill className="object-contain" unoptimized />
                    </div>
                  ) : (
                    <div className="flex aspect-square w-64 flex-col items-center justify-center rounded-3xl border border-dashed bg-background">
                      <QrCode className="mb-3 h-10 w-10 text-muted-foreground" />
                      <p className="px-6 text-center text-sm text-muted-foreground">No QR code available for this method yet.</p>
                    </div>
                  )}

                  <div className="w-full max-w-md space-y-2 text-center">
                    <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Pay to this account</p>
                    <p className="text-xl font-bold">{selectedMethod?.details || "Contact support for payment details"}</p>
                    <p className="text-lg font-semibold text-primary">Amount to pay: ${Number(amount).toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <form onSubmit={(event) => uploadProofMutation.mutate(event)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="deposit-proof">Upload Payment Proof</Label>
                  <div
                    className={cn(
                      "relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed p-8 transition-all hover:border-primary/50",
                      proofPreview ? "aspect-video" : "h-40"
                    )}
                    onClick={() => document.getElementById("deposit-proof")?.click()}
                  >
                    {proofPreview ? (
                      <Image src={proofPreview} alt="Proof preview" fill className="object-contain" unoptimized />
                    ) : (
                      <>
                        <UploadCloud className="mb-2 h-10 w-10 text-muted-foreground" />
                        <p className="text-sm font-medium text-muted-foreground">Click to upload screenshot</p>
                      </>
                    )}
                    <input id="deposit-proof" name="proofImage" type="file" accept="image/*" className="hidden" onChange={handleProofChange} />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button type="submit" disabled={uploadProofMutation.isPending || !proofFile}>
                    {uploadProofMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                    Submit Proof
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                </div>
              </form>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Deposit History</CardTitle>
        </CardHeader>
        <CardContent>
          {depositsLoading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading deposits...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Required</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deposits?.map((deposit: any) => (
                  <TableRow key={deposit.id}>
                    <TableCell>{new Date(deposit.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>${deposit.amount.toLocaleString()}</TableCell>
                    <TableCell>{getTypeBadge(deposit.type)}</TableCell>
                    <TableCell>{deposit.notes?.includes("Payment method:") ? deposit.notes.replace("Payment method:", "") : "—"}</TableCell>
                    <TableCell>${deposit.requiredDeposit?.toLocaleString() || 0}</TableCell>
                    <TableCell>{getStatusBadge(deposit.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
