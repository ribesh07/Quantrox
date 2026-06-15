"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  getAllMerchantsAction,
  approveMerchantAction,
  rejectMerchantAction,
  createMerchantAction,
  getAllUsersAction,
} from "@/actions/admin.actions";
import { getPaymentMethodsAction } from "@/actions/payment.actions";

export default function AdminMerchantsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [newMerchant, setNewMerchant] = useState({
    userId: "",
    businessName: "",
    businessDescription: "",
    preferredPaymentMethodId: "",
    expectedDailyVolume: "",
    autoApprove: true,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-merchants"],
    queryFn: async () => {
      const result = await getAllMerchantsAction();
      if (!result.success) throw new Error(result.error);
      return result.merchants || [];
    },
  });

  const { data: users } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const result = await getAllUsersAction();
      if (!result.success) throw new Error(result.error);
      return result.users || [];
    },
  });

  const { data: paymentMethods } = useQuery({
    queryKey: ["admin-merchant-payment-methods"],
    queryFn: async () => {
      const result = await getPaymentMethodsAction("BOTH");
      return result.success ? result.methods : [];
    },
  });

  const availableUsers = useMemo(() => {
    const merchantUserIds = new Set((data || []).map((merchant: any) => merchant.userId));
    return (users || []).filter((user: any) => !merchantUserIds.has(user.id));
  }, [data, users]);

  const approveMutation = useMutation({
    mutationFn: async (userId: string) => {
      const result = await approveMerchantAction(userId);
      if (!result.success) throw new Error(result.error);
      return result.merchant;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-merchants"] });
      toast.success("Merchant approved");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (userId: string) => {
      const result = await rejectMerchantAction(userId);
      if (!result.success) throw new Error(result.error);
      return result.merchant;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-merchants"] });
      toast.success("Merchant rejected");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const createMerchantMutation = useMutation({
    mutationFn: async () => {
      const result = await createMerchantAction({
        userId: newMerchant.userId,
        businessName: newMerchant.businessName,
        businessDescription: newMerchant.businessDescription || undefined,
        preferredPaymentMethodId: newMerchant.preferredPaymentMethodId,
        expectedDailyVolume: parseFloat(newMerchant.expectedDailyVolume),
        autoApprove: newMerchant.autoApprove,
      });
      if (!result.success) throw new Error(result.error);
      return result.merchant;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-merchants"] });
      toast.success("Merchant created successfully");
      setOpen(false);
      setNewMerchant({
        userId: "",
        businessName: "",
        businessDescription: "",
        preferredPaymentMethodId: "",
        expectedDailyVolume: "",
        autoApprove: true,
      });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const filteredMerchants = Array.isArray(data) ? data.filter((m: any) => 
    m.businessName?.toLowerCase().includes(search.toLowerCase()) ||
    m.user?.username?.toLowerCase().includes(search.toLowerCase()) ||
    m.user?.email?.toLowerCase().includes(search.toLowerCase())
  ) : [];

  const handleCreateMerchant = (e: React.FormEvent) => {
    e.preventDefault();
    createMerchantMutation.mutate();
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Merchant Management</h1>
          <p className="text-muted-foreground mt-1">Approve and manage merchant applications</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl font-bold">
              <Plus className="mr-2 h-4 w-4" />
              Add Merchant
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Merchant</DialogTitle>
              <DialogDescription>Create a merchant profile for an existing user.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateMerchant} className="space-y-4">
              <div className="space-y-2">
                <Label>User</Label>
                <Select
                  value={newMerchant.userId}
                  onValueChange={(value) => setNewMerchant({ ...newMerchant, userId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((user: any) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.username} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Business Name</Label>
                <Input
                  value={newMerchant.businessName}
                  onChange={(e) => setNewMerchant({ ...newMerchant, businessName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Business Description</Label>
                <Input
                  value={newMerchant.businessDescription}
                  onChange={(e) => setNewMerchant({ ...newMerchant, businessDescription: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Preferred Payout Payment Method</Label>
                <Select
                  value={newMerchant.preferredPaymentMethodId}
                  onValueChange={(value) => setNewMerchant({ ...newMerchant, preferredPaymentMethodId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods?.map((method: any) => (
                      <SelectItem key={method.id} value={method.id}>
                        {method.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Expected Daily Volume (USD)</Label>
                <Input
                  type="number"
                  value={newMerchant.expectedDailyVolume}
                  onChange={(e) => setNewMerchant({ ...newMerchant, expectedDailyVolume: e.target.value })}
                  required
                  min="0"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="autoApprove"
                  type="checkbox"
                  checked={newMerchant.autoApprove}
                  onChange={(e) => setNewMerchant({ ...newMerchant, autoApprove: e.target.checked })}
                  className="h-4 w-4 rounded border"
                />
                <Label htmlFor="autoApprove">Approve merchant immediately</Label>
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createMerchantMutation.isPending ||
                    !newMerchant.userId ||
                    !newMerchant.preferredPaymentMethodId
                  }
                >
                  {createMerchantMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Create Merchant
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="border-b bg-muted/20 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-lg">All Merchants</CardTitle>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search merchants..."
                className="pl-10 h-10 rounded-xl border-2"
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
              <p className="text-sm text-muted-foreground">Loading merchants...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 border-b">
                    <TableHead className="font-bold">Business</TableHead>
                    <TableHead className="font-bold">User</TableHead>
                    <TableHead className="font-bold">Expected Volume</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="text-right font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMerchants.map((merchant: any) => (
                    <TableRow key={merchant.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell>
                        <div>
                          <p className="font-medium">{merchant.businessName}</p>
                          <p className="text-sm text-muted-foreground">{merchant.businessDescription}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{merchant.user?.username}</p>
                          <p className="text-sm text-muted-foreground">{merchant.user?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        ${merchant.expectedDailyVolume?.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {merchant.approvedAt ? (
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/20 rounded-full px-3">
                            Approved
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="rounded-full px-3">
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {!merchant.approvedAt && (
                            <>
                              <Button
                                size="sm"
                                className="rounded-full"
                                onClick={() => approveMutation.mutate(merchant.userId)}
                                disabled={approveMutation.isPending || rejectMutation.isPending}
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="rounded-full"
                                onClick={() => rejectMutation.mutate(merchant.userId)}
                                disabled={approveMutation.isPending || rejectMutation.isPending}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
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
