"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  getMyMerchantInfoAction,
  createMerchantInfoAction,
  updateMyMerchantInfoAction,
} from "@/actions/merchant.actions";
import { getUserWalletsAction } from "@/actions/wallet.actions";
import { getPaymentMethodsAction } from "@/actions/payment.actions";

export default function MerchantPage() {
  const queryClient = useQueryClient();

  const [businessName, setBusinessName] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [preferredWalletId, setPreferredWalletId] = useState("");
  const [expectedDailyVolume, setExpectedDailyVolume] = useState("");

  const { data: merchantInfo, isLoading: infoLoading } = useQuery({
    queryKey: ["my-merchant-info"],
    queryFn: async () => {
      const result = await getMyMerchantInfoAction();
      if (result.success) {
        if (result.info) {
          setBusinessName(result.info.businessName);
          setBusinessDescription(result.info.businessDescription || "");
          setPreferredWalletId(result.info.preferredWalletId);
          setExpectedDailyVolume(result.info.expectedDailyVolume.toString());
        }
        return result.info;
      }
      return null;
    },
  });

  // const { data: wallets } = useQuery({
  //   queryKey: ["my-wallets"],
  //   queryFn: async () => {
  //     const result = await getUserWalletsAction();
  //     return result.success ? result.wallets : [];
  //   },
  // });

    const { data: wallets } = useQuery({
      queryKey: ["my-wallets"],
      queryFn: async () => {
        const result = await getUserWalletsAction();
        return result.success ? result.wallets : [];
      },
    });

  const createMutation = useMutation({
    mutationFn: async () => {
      const result = await createMerchantInfoAction({
        businessName,
        businessDescription,
        preferredWalletId,
        expectedDailyVolume: parseFloat(expectedDailyVolume),
      });
      if (!result.success) throw new Error(result.error);
      return result.info;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-merchant-info"] });
      toast.success("Merchant application submitted!");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const result = await updateMyMerchantInfoAction({
        businessName,
        businessDescription,
        preferredWalletId,
        expectedDailyVolume: parseFloat(expectedDailyVolume),
      });
      if (!result.success) throw new Error(result.error);
      return result.info;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-merchant-info"] });
      toast.success("Merchant info updated!");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

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
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <Label>Preferred Payout Wallet</Label>
              <Select value={preferredWalletId} onValueChange={setPreferredWalletId} >
                <SelectTrigger>
                  <SelectValue placeholder="Select a wallet"/>
                </SelectTrigger>
                <SelectContent>
                  {wallets?.map((wallet: any) => (
                    <SelectItem key={wallet.id} value={wallet.id}>
                      {wallet.paymentMethod?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
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
