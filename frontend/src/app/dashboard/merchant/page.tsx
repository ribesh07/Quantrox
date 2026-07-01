"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CheckCircle2, AlertCircle, Wallet, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getMyMerchantInfoAction,
  createMerchantInfoAction,
  updateMyMerchantInfoAction,
} from "@/actions/merchant.actions";
import { getUserWalletsAction } from "@/actions/wallet.actions";
import { getPaymentMethodsAction } from "@/actions/payment.actions";

type WalletConfig = {
  paymentMethodId: string;
  dailyLimit: string;
  active: boolean;
};

export default function MerchantPage() {
  const queryClient = useQueryClient();

  const [businessName, setBusinessName] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [expectedDailyVolume, setExpectedDailyVolume] = useState("");
  const [walletConfigs, setWalletConfigs] = useState<WalletConfig[]>([]);

  const { data: merchantInfo, isLoading: infoLoading } = useQuery({
    queryKey: ["my-merchant-info"],
    queryFn: async () => {
      const result = await getMyMerchantInfoAction();
      if (result.success) return result.info;
      return null;
    },
  });

  useEffect(() => {
    if (merchantInfo) {
      setBusinessName(merchantInfo.businessName);
      setBusinessDescription(merchantInfo.businessDescription || "");
      setExpectedDailyVolume(merchantInfo.expectedDailyVolume.toString());
      if (merchantInfo.merchantWallets?.length > 0) {
        setWalletConfigs(
          merchantInfo.merchantWallets.map((mw: any) => ({
            paymentMethodId: mw.paymentMethodId,
            dailyLimit: mw.dailyLimit.toString(),
            active: mw.active,
          }))
        );
      } else if (merchantInfo.preferredWallet?.paymentMethodId) {
        setWalletConfigs([{
          paymentMethodId: merchantInfo.preferredWallet.paymentMethodId,
          dailyLimit: merchantInfo.expectedDailyVolume.toString(),
          active: true,
        }]);
      }
    }
  }, [merchantInfo]);

  const { data: paymentMethods } = useQuery({
    queryKey: ["merchant-payment-methods"],
    queryFn: async () => {
      const result = await getPaymentMethodsAction("BOTH");
      return result.success ? result.methods : [];
    },
  });

  const buildPayload = () => ({
    businessName,
    businessDescription,
    expectedDailyVolume: parseFloat(expectedDailyVolume),
    wallets: walletConfigs
      .filter((w) => w.paymentMethodId)
      .map((w) => ({
        paymentMethodId: w.paymentMethodId,
        dailyLimit: parseFloat(w.dailyLimit) || 0,
        active: w.active,
      })),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = buildPayload();
      if (payload.wallets.length === 0) throw new Error("Select at least one payment method");
      const result = await createMerchantInfoAction(payload);
      if (!result.success) throw new Error(result.error);
      return result.info;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-merchant-info"] });
      toast.success("Merchant application submitted!");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const payload = buildPayload();
      if (payload.wallets.length === 0) throw new Error("Select at least one payment method");
      const result = await updateMyMerchantInfoAction(payload);
      if (!result.success) throw new Error(result.error);
      return result.info;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-merchant-info"] });
      toast.success("Merchant info updated!");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const addWallet = () => {
    setWalletConfigs([...walletConfigs, { paymentMethodId: "", dailyLimit: "", active: true }]);
  };

  const removeWallet = (index: number) => {
    setWalletConfigs(walletConfigs.filter((_, i) => i !== index));
  };

  const updateWallet = (index: number, field: keyof WalletConfig, value: string | boolean) => {
    const next = [...walletConfigs];
    next[index] = { ...next[index], [field]: value };
    setWalletConfigs(next);
  };

  const usedMethodIds = walletConfigs.map((w) => w.paymentMethodId).filter(Boolean);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (merchantInfo) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };
console.log(wallets);
  if (infoLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Merchant Setup</h1>
        <p className="text-muted-foreground mt-1">Configure your merchant profile and wallet preferences</p>
      </div>

      {merchantInfo?.approvedAt && (
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="flex items-center gap-3 pt-6">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            <div>
              <p className="font-bold text-green-700">Merchant Account Approved!</p>
              <p className="text-sm text-green-600">You can now use all merchant features</p>
            </div>
          </CardContent>
        </Card>
      )}

      {merchantInfo && !merchantInfo.approvedAt && (
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="font-bold text-yellow-700">Pending Approval</p>
              <p className="text-sm text-yellow-600">Your merchant application is being reviewed</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>Enter your business details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Business Name</Label>
              <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Your business name" required />
            </div>

            <div className="space-y-2">
              <Label>Business Description</Label>
              <Input value={businessDescription} onChange={(e) => setBusinessDescription(e.target.value)} placeholder="Brief description of your business" />
            </div>

            <div className="space-y-2">
              <Label>Expected Daily Transaction Volume (USD)</Label>
              <Input type="number" value={expectedDailyVolume} onChange={(e) => setExpectedDailyVolume(e.target.value)} placeholder="10000" required />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Payment Wallets
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Select multiple payment methods and set a daily limit for each
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addWallet}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Wallet
                </Button>
              </div>

              {walletConfigs.length === 0 && (
                <div className="text-center py-6 border rounded-lg border-dashed">
                  <p className="text-sm text-muted-foreground mb-3">No wallets configured yet</p>
                  <Button type="button" variant="outline" size="sm" onClick={addWallet}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Wallet
                  </Button>
                </div>
              )}

              {walletConfigs.map((config, index) => (
                <div key={index} className="p-4 rounded-lg border bg-muted/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Wallet {index + 1}</span>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`active-${index}`}
                          checked={config.active}
                          onCheckedChange={(checked) => updateWallet(index, "active", !!checked)}
                        />
                        <Label htmlFor={`active-${index}`} className="text-sm">Active</Label>
                      </div>
                      {walletConfigs.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeWallet(index)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Payment Method</Label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={config.paymentMethodId}
                        onChange={(e) => updateWallet(index, "paymentMethodId", e.target.value)}
                        required
                      >
                        <option value="">Select payment method</option>
                        {paymentMethods?.map((method: any) => (
                          <option
                            key={method.id}
                            value={method.id}
                            disabled={usedMethodIds.includes(method.id) && config.paymentMethodId !== method.id}
                          >
                            {method.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Daily Limit (USD)</Label>
                      <Input
                        type="number"
                        value={config.dailyLimit}
                        onChange={(e) => updateWallet(index, "dailyLimit", e.target.value)}
                        placeholder="5000"
                        required
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending || walletConfigs.length === 0}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {merchantInfo ? "Update Info" : "Submit Application"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
