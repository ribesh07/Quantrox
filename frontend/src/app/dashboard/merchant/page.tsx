"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CheckCircle2, AlertCircle, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  getMyMerchantInfoAction,
  createMerchantInfoAction,
  updateMyMerchantInfoAction,
  type MerchantWalletInput,
} from "@/actions/merchant.actions";
import { getUserWalletsAction } from "@/actions/wallet.actions";

type WalletConfig = {
  walletId: string;
  selected: boolean;
  minLimit: string;
  maxLimit: string;
  dailyLimit: string;
  isPrimary: boolean;
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
      if (result.success && result.info) {
        setBusinessName(result.info.businessName);
        setBusinessDescription(result.info.businessDescription || "");
        setExpectedDailyVolume(result.info.expectedDailyVolume.toString());
        return result.info;
      }
      return null;
    },
  });

  const { data: wallets } = useQuery({
    queryKey: ["my-wallets"],
    queryFn: async () => {
      const result = await getUserWalletsAction();
      return result.success ? result.wallets : [];
    },
  });

  useEffect(() => {
    if (!wallets?.length) return;

    const existingConfigs = merchantInfo?.merchantWallets || [];
    setWalletConfigs(
      wallets.map((wallet: any) => {
        const existing = existingConfigs.find((mw: any) => mw.walletId === wallet.id);
        return {
          walletId: wallet.id,
          selected: !!existing || wallet.id === merchantInfo?.preferredWalletId,
          minLimit: existing?.minLimit?.toString() || wallet.paymentMethod?.minAmount?.toString() || "0",
          maxLimit: existing?.maxLimit?.toString() || wallet.paymentMethod?.maxAmount?.toString() || "1000000",
          dailyLimit: existing?.dailyLimit?.toString() || "",
          isPrimary: existing?.isPrimary || wallet.id === merchantInfo?.preferredWalletId,
        };
      })
    );
  }, [wallets, merchantInfo]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const selected = walletConfigs.filter((w) => w.selected);
      if (selected.length === 0) throw new Error("Select at least one wallet");

      const merchantWallets: MerchantWalletInput[] = selected.map((w) => ({
        walletId: w.walletId,
        minLimit: parseFloat(w.minLimit) || 0,
        maxLimit: parseFloat(w.maxLimit) || 1000000,
        dailyLimit: w.dailyLimit ? parseFloat(w.dailyLimit) : undefined,
        isPrimary: w.isPrimary,
      }));

      const primary = selected.find((w) => w.isPrimary) || selected[0];

      const result = await createMerchantInfoAction({
        businessName,
        businessDescription,
        preferredWalletId: primary.walletId,
        expectedDailyVolume: parseFloat(expectedDailyVolume),
        merchantWallets,
      });
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
      const selected = walletConfigs.filter((w) => w.selected);
      if (selected.length === 0) throw new Error("Select at least one wallet");

      const merchantWallets: MerchantWalletInput[] = selected.map((w) => ({
        walletId: w.walletId,
        minLimit: parseFloat(w.minLimit) || 0,
        maxLimit: parseFloat(w.maxLimit) || 1000000,
        dailyLimit: w.dailyLimit ? parseFloat(w.dailyLimit) : undefined,
        isPrimary: w.isPrimary,
      }));

      const primary = selected.find((w) => w.isPrimary) || selected[0];

      const result = await updateMyMerchantInfoAction({
        businessName,
        businessDescription,
        preferredWalletId: primary.walletId,
        expectedDailyVolume: parseFloat(expectedDailyVolume),
        merchantWallets,
      });
      if (!result.success) throw new Error(result.error);
      return result.info;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-merchant-info"] });
      toast.success("Merchant info updated!");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const toggleWallet = (walletId: string, selected: boolean) => {
    setWalletConfigs((prev) =>
      prev.map((w) => (w.walletId === walletId ? { ...w, selected } : w))
    );
  };

  const updateWalletField = (walletId: string, field: keyof WalletConfig, value: string | boolean) => {
    setWalletConfigs((prev) =>
      prev.map((w) => (w.walletId === walletId ? { ...w, [field]: value } : w))
    );
  };

  const setPrimaryWallet = (walletId: string) => {
    setWalletConfigs((prev) =>
      prev.map((w) => ({
        ...w,
        isPrimary: w.walletId === walletId,
        selected: w.walletId === walletId ? true : w.selected,
      }))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (merchantInfo) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const getWalletName = (walletId: string) => {
    const wallet = wallets?.find((w: any) => w.id === walletId);
    return wallet?.paymentMethod?.name || "Wallet";
  };

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
        <p className="text-muted-foreground mt-1">Complete your merchant profile to get started</p>
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
              <Input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Your business name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Business Description</Label>
              <Input
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                placeholder="Brief description of your business"
              />
            </div>

            <div className="space-y-2">
              <Label>Expected Daily Transaction Volume (USD)</Label>
              <Input
                type="number"
                value={expectedDailyVolume}
                onChange={(e) => setExpectedDailyVolume(e.target.value)}
                placeholder="10000"
                required
              />
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-base">Payment Wallets</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Select multiple wallets and set limits for each
                </p>
              </div>

              {walletConfigs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No wallets available. Create wallets first.</p>
              ) : (
                walletConfigs.map((config) => (
                  <Card
                    key={config.walletId}
                    className={`border-2 transition-colors ${config.selected ? "border-primary/40 bg-primary/5" : ""}`}
                  >
                    <CardContent className="pt-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={config.selected}
                            onCheckedChange={(checked) =>
                              toggleWallet(config.walletId, checked === true)
                            }
                          />
                          <div>
                            <p className="font-medium">{getWalletName(config.walletId)}</p>
                            {config.isPrimary && (
                              <span className="text-xs text-primary flex items-center gap-1">
                                <Star className="h-3 w-3 fill-primary" /> Primary payout wallet
                              </span>
                            )}
                          </div>
                        </div>
                        {config.selected && !config.isPrimary && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setPrimaryWallet(config.walletId)}
                          >
                            Set as Primary
                          </Button>
                        )}
                      </div>

                      {config.selected && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pl-7">
                          <div className="space-y-1">
                            <Label className="text-xs">Min Limit ($)</Label>
                            <Input
                              type="number"
                              value={config.minLimit}
                              onChange={(e) =>
                                updateWalletField(config.walletId, "minLimit", e.target.value)
                              }
                              placeholder="0"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Max Limit ($)</Label>
                            <Input
                              type="number"
                              value={config.maxLimit}
                              onChange={(e) =>
                                updateWalletField(config.walletId, "maxLimit", e.target.value)
                              }
                              placeholder="1000000"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Daily Limit ($)</Label>
                            <Input
                              type="number"
                              value={config.dailyLimit}
                              onChange={(e) =>
                                updateWalletField(config.walletId, "dailyLimit", e.target.value)
                              }
                              placeholder="Optional"
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {merchantInfo ? "Update Info" : "Submit Application"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
