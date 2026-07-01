"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2, CheckCircle2, XCircle, Search, Plus, Eye, QrCode,
  DollarSign, Wallet, FileText, MoreHorizontal,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getAllMerchantsAction,
  approveMerchantAction,
  rejectMerchantAction,
  createMerchantAction,
  getAllUsersAction,
  getMerchantDetailAction,
} from "@/actions/admin.actions";
import { getPaymentMethodsAction } from "@/actions/payment.actions";

function MerchantDetailView({ userId }: { userId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["merchant-detail", userId],
    queryFn: async () => {
      const result = await getMerchantDetailAction(userId);
      if (!result.success) throw new Error(result.error);
      return result.detail;
    },
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return <p className="text-muted-foreground">Merchant not found</p>;

  const { merchantInfo, stats, qrs, reports, deposits } = data;

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Total Deposits</p>
            <p className="text-xl font-bold">${stats.totalDeposit?.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Reported Volume</p>
            <p className="text-xl font-bold">${stats.totalReportAmount?.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Wallet Balance</p>
            <p className="text-xl font-bold">${stats.totalWalletBalance?.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Active QRs</p>
            <p className="text-xl font-bold">{stats.activeQrCount} / {stats.qrCount}</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h4 className="font-semibold mb-2">Business Info</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><span className="text-muted-foreground">Business:</span> {merchantInfo.businessName}</div>
          <div><span className="text-muted-foreground">User:</span> {merchantInfo.user?.username}</div>
          <div><span className="text-muted-foreground">Email:</span> {merchantInfo.user?.email}</div>
          <div><span className="text-muted-foreground">Expected Volume:</span> ${merchantInfo.expectedDailyVolume?.toLocaleString()}/day</div>
          <div className="col-span-2"><span className="text-muted-foreground">Description:</span> {merchantInfo.businessDescription || "—"}</div>
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <Wallet className="h-4 w-4" /> Payment Methods & Limits
        </h4>
        {merchantInfo.merchantWallets?.length > 0 ? (
          <div className="space-y-2">
            {merchantInfo.merchantWallets.map((mw: any) => (
              <div key={mw.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                <div>
                  <p className="font-medium">{mw.paymentMethod?.name}</p>
                  <p className="text-sm text-muted-foreground">Daily limit: ${mw.dailyLimit?.toLocaleString()}</p>
                </div>
                <Badge variant={mw.active ? "default" : "secondary"}>
                  {mw.active ? "Active" : "Inactive"}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Preferred: {merchantInfo.preferredWallet?.paymentMethod?.name || "Not set"}
          </p>
        )}
      </div>

      <div>
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <QrCode className="h-4 w-4" /> QR Codes ({qrs?.length || 0})
        </h4>
        {qrs?.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {qrs.map((qr: any) => (
              <div key={qr.id} className="text-center">
                <img src={qr.imageUrl} alt={qr.label || "QR"} className="h-16 w-16 object-contain border rounded" />
                <p className="text-xs mt-1">{qr.label || "QR"}</p>
                <Badge variant={qr.active ? "default" : "secondary"} className="text-xs mt-1">
                  {qr.active ? "Active" : "Disabled"}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No QR codes assigned</p>
        )}
      </div>

      <div>
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <FileText className="h-4 w-4" /> Recent Reports
        </h4>
        {reports?.length > 0 ? (
          <div className="space-y-1 text-sm">
            {reports.slice(0, 5).map((r: any) => (
              <div key={r.id} className="flex justify-between p-2 rounded border">
                <span>{new Date(r.transactionDate).toLocaleDateString()}</span>
                <span>${r.totalAmount?.toLocaleString()} ({r.totalTransactions} txns)</span>
                <Badge variant="outline">{r.status}</Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No reports yet</p>
        )}
      </div>

      <div>
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <DollarSign className="h-4 w-4" /> Recent Deposits
        </h4>
        {deposits?.length > 0 ? (
          <div className="space-y-1 text-sm">
            {deposits.slice(0, 5).map((d: any) => (
              <div key={d.id} className="flex justify-between p-2 rounded border">
                <span>{new Date(d.createdAt).toLocaleDateString()}</span>
                <span>${d.amount?.toLocaleString()}</span>
                <Badge variant="outline">{d.status}</Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No deposits yet</p>
        )}
      </div>
    </div>
  );
}

export default function AdminMerchantsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [viewUserId, setViewUserId] = useState<string | null>(null);
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

  const approveMutation = useMutation({
    mutationFn: async (userId: string) => {
      const result = await approveMerchantAction(userId);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-merchants"] });
      toast.success("Merchant approved");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const rejectMutation = useMutation({
    mutationFn: async (userId: string) => {
      const result = await rejectMerchantAction(userId);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-merchants"] });
      toast.success("Merchant rejected");
    },
    onError: (error: any) => toast.error(error.message),
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-merchants"] });
      toast.success("Merchant created successfully");
      setOpen(false);
      setNewMerchant({
        userId: "", businessName: "", businessDescription: "",
        preferredPaymentMethodId: "", expectedDailyVolume: "", autoApprove: true,
      });
    },
    onError: (error: any) => toast.error(error.message),
  });

  const filteredMerchants = Array.isArray(data) ? data.filter((m: any) =>
    m.businessName?.toLowerCase().includes(search.toLowerCase()) ||
    m.user?.username?.toLowerCase().includes(search.toLowerCase()) ||
    m.user?.email?.toLowerCase().includes(search.toLowerCase())
  ) : [];

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Merchant Management</h1>
          <p className="text-muted-foreground mt-1">Approve, monitor, and manage merchants</p>
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
            <form onSubmit={(e) => { e.preventDefault(); createMerchantMutation.mutate(); }} className="space-y-4">
              <div className="space-y-2">
                <Label>User</Label>
                <Select value={newMerchant.userId} onValueChange={(v) => setNewMerchant({ ...newMerchant, userId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((user: any) => (
                      <SelectItem key={user.id} value={user.id}>{user.username} ({user.email})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Business Name</Label>
                <Input value={newMerchant.businessName} onChange={(e) => setNewMerchant({ ...newMerchant, businessName: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Business Description</Label>
                <Input value={newMerchant.businessDescription} onChange={(e) => setNewMerchant({ ...newMerchant, businessDescription: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Preferred Payout Payment Method</Label>
                <Select value={newMerchant.preferredPaymentMethodId} onValueChange={(v) => setNewMerchant({ ...newMerchant, preferredPaymentMethodId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select payment method" /></SelectTrigger>
                  <SelectContent>
                    {paymentMethods?.map((method: any) => (
                      <SelectItem key={method.id} value={method.id}>{method.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Expected Daily Volume (USD)</Label>
                <Input type="number" value={newMerchant.expectedDailyVolume} onChange={(e) => setNewMerchant({ ...newMerchant, expectedDailyVolume: e.target.value })} required min="0" />
              </div>
              <div className="flex items-center gap-2">
                <input id="autoApprove" type="checkbox" checked={newMerchant.autoApprove} onChange={(e) => setNewMerchant({ ...newMerchant, autoApprove: e.target.checked })} className="h-4 w-4 rounded border" />
                <Label htmlFor="autoApprove">Approve merchant immediately</Label>
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMerchantMutation.isPending || !newMerchant.userId || !newMerchant.preferredPaymentMethodId}>
                  {createMerchantMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
              <Input placeholder="Search merchants..." className="pl-10 h-10 rounded-xl border-2" value={search} onChange={(e) => setSearch(e.target.value)} />
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
                    <TableHead className="font-bold">Wallets</TableHead>
                    <TableHead className="font-bold">Total Deposits</TableHead>
                    <TableHead className="font-bold">Report Volume</TableHead>
                    <TableHead className="font-bold">QRs</TableHead>
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
                          <p className="text-sm text-muted-foreground line-clamp-1">{merchant.businessDescription}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{merchant.user?.username}</p>
                          <p className="text-sm text-muted-foreground">{merchant.user?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {merchant.merchantWallets?.length > 0 ? (
                          <div className="space-y-1">
                            {merchant.merchantWallets.slice(0, 2).map((mw: any) => (
                              <Badge key={mw.id} variant="outline" className="text-xs mr-1">
                                {mw.paymentMethod?.name}
                              </Badge>
                            ))}
                            {merchant.merchantWallets.length > 2 && (
                              <span className="text-xs text-muted-foreground">+{merchant.merchantWallets.length - 2} more</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {merchant.preferredWallet?.paymentMethod?.name || "—"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>${merchant.stats?.totalDeposit?.toLocaleString() || "0"}</TableCell>
                      <TableCell>${merchant.stats?.totalReportAmount?.toLocaleString() || "0"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{merchant.stats?.activeQrCount || 0} active</Badge>
                      </TableCell>
                      <TableCell>
                        {merchant.approvedAt ? (
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/20 rounded-full px-3">Approved</Badge>
                        ) : (
                          <Badge variant="secondary" className="rounded-full px-3">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Dialog open={viewUserId === merchant.userId} onOpenChange={(open) => !open && setViewUserId(null)}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" className="rounded-full" onClick={() => setViewUserId(merchant.userId)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>{merchant.businessName} — Full Details</DialogTitle>
                                <DialogDescription>Complete merchant information, wallets, QRs, and activity</DialogDescription>
                              </DialogHeader>
                              <MerchantDetailView userId={merchant.userId} />
                            </DialogContent>
                          </Dialog>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline" className="rounded-full">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {!merchant.approvedAt && (
                                <>
                                  <DropdownMenuItem onClick={() => approveMutation.mutate(merchant.userId)}>
                                    <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => rejectMutation.mutate(merchant.userId)} className="text-destructive">
                                    <XCircle className="mr-2 h-4 w-4" /> Reject
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/merchant-qrs?merchant=${merchant.userId}`}>
                                  <QrCode className="mr-2 h-4 w-4" /> Manage QRs
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href="/admin/deposits">
                                  <DollarSign className="mr-2 h-4 w-4" /> View Deposits
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href="/admin/transaction-reports">
                                  <FileText className="mr-2 h-4 w-4" /> View Reports
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>

                          {!merchant.approvedAt && (
                            <>
                              <Button size="sm" className="rounded-full hidden lg:flex" onClick={() => approveMutation.mutate(merchant.userId)} disabled={approveMutation.isPending}>
                                <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                              </Button>
                              <Button size="sm" variant="destructive" className="rounded-full hidden lg:flex" onClick={() => rejectMutation.mutate(merchant.userId)} disabled={rejectMutation.isPending}>
                                <XCircle className="mr-2 h-4 w-4" /> Reject
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
