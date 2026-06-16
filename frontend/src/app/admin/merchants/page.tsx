"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, Search, Eye, QrCode, MoreHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import {
  getAllMerchantsAction,
  getMerchantDetailsAction,
  approveMerchantAction,
  rejectMerchantAction,
} from "@/actions/admin.actions";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export default function AdminMerchantsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [viewUserId, setViewUserId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-merchants"],
    queryFn: async () => {
      const result = await getAllMerchantsAction();
      if (!result.success) throw new Error(result.error);
      return result.merchants || [];
    },
  });

  const { data: merchantDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ["admin-merchant-details", viewUserId],
    queryFn: async () => {
      if (!viewUserId) return null;
      const result = await getMerchantDetailsAction(viewUserId);
      if (!result.success) throw new Error(result.error);
      return result.merchant;
    },
    enabled: !!viewUserId && sheetOpen,
  });

  const approveMutation = useMutation({
    mutationFn: async (userId: string) => {
      const result = await approveMerchantAction(userId);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-merchants"] });
      queryClient.invalidateQueries({ queryKey: ["admin-merchant-details"] });
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
      queryClient.invalidateQueries({ queryKey: ["admin-merchant-details"] });
      toast.success("Merchant rejected");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const openView = (userId: string) => {
    setViewUserId(userId);
    setSheetOpen(true);
  };

  const filteredMerchants = Array.isArray(data)
    ? data.filter(
        (m: any) =>
          m.businessName?.toLowerCase().includes(search.toLowerCase()) ||
          m.user?.username?.toLowerCase().includes(search.toLowerCase()) ||
          m.user?.email?.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const details = merchantDetails as any;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Merchant Management</h1>
          <p className="text-muted-foreground mt-1">Approve, view, and manage merchant applications</p>
        </div>
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
                    <TableHead className="font-bold">Total Deposits</TableHead>
                    <TableHead className="font-bold">Report Amount</TableHead>
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
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {merchant.businessDescription}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{merchant.user?.username}</p>
                          <p className="text-sm text-muted-foreground">{merchant.user?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>${merchant.expectedDailyVolume?.toLocaleString()}</TableCell>
                      <TableCell className="font-medium">
                        ${(merchant.totalDeposit || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>${(merchant.totalReportAmount || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="rounded-full">
                          {merchant.qrCount || 0} QR{(merchant.qrCount || 0) !== 1 ? "s" : ""}
                        </Badge>
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
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full"
                            onClick={() => openView(merchant.userId)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline" className="rounded-full">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {!merchant.approvedAt && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => approveMutation.mutate(merchant.userId)}
                                  >
                                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => rejectMutation.mutate(merchant.userId)}
                                  >
                                    <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                    Reject
                                  </DropdownMenuItem>
                                </>
                              )}
                              {merchant.approvedAt && (
                                <DropdownMenuItem
                                  onClick={() => rejectMutation.mutate(merchant.userId)}
                                >
                                  <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                  Revoke Approval
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/merchant-qrs?userId=${merchant.userId}`}>
                                  <QrCode className="mr-2 h-4 w-4" />
                                  Manage QRs
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Merchant Details</SheetTitle>
            <SheetDescription>Full merchant profile, wallets, and payment methods</SheetDescription>
          </SheetHeader>
          {detailsLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : details ? (
            <div className="space-y-6 mt-6">
              <div>
                <h3 className="font-semibold text-lg">{details.businessName}</h3>
                <p className="text-sm text-muted-foreground">{details.businessDescription}</p>
                <div className="mt-2 flex gap-2">
                  {details.approvedAt ? (
                    <Badge className="bg-green-500/10 text-green-600">Approved</Badge>
                  ) : (
                    <Badge variant="secondary">Pending</Badge>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">User Info</h4>
                <p className="text-sm">{details.user?.username}</p>
                <p className="text-sm text-muted-foreground">{details.user?.email}</p>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-3">Financial Summary</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Total Deposits</p>
                    <p className="text-lg font-bold">${details.stats?.totalDeposit?.toLocaleString() || 0}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Report Amount</p>
                    <p className="text-lg font-bold">
                      ${details.stats?.totalReportAmount?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Expected Daily Vol.</p>
                    <p className="text-lg font-bold">${details.expectedDailyVolume?.toLocaleString()}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Wallet Balance</p>
                    <p className="text-lg font-bold">
                      ${details.stats?.totalWalletBalance?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-3">Payment Methods & Limits</h4>
                {details.merchantWallets?.length > 0 ? (
                  <div className="space-y-3">
                    {details.merchantWallets.map((mw: any) => (
                      <div key={mw.id} className="rounded-lg border p-3">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{mw.wallet?.paymentMethod?.name}</p>
                          {mw.isPrimary && (
                            <Badge variant="outline" className="text-xs">Primary</Badge>
                          )}
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                          <div>
                            <p>Min</p>
                            <p className="font-medium text-foreground">${mw.minLimit?.toLocaleString()}</p>
                          </div>
                          <div>
                            <p>Max</p>
                            <p className="font-medium text-foreground">${mw.maxLimit?.toLocaleString()}</p>
                          </div>
                          <div>
                            <p>Daily</p>
                            <p className="font-medium text-foreground">
                              {mw.dailyLimit ? `$${mw.dailyLimit.toLocaleString()}` : "—"}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Balance: ${mw.wallet?.balance?.toLocaleString() || 0}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : details.preferredWallet ? (
                  <div className="rounded-lg border p-3">
                    <p className="font-medium">{details.preferredWallet.paymentMethod?.name}</p>
                    <p className="text-sm text-muted-foreground">Primary wallet (no custom limits set)</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No wallets configured</p>
                )}
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-3">Assigned QR Codes ({details.qrCodes?.length || 0})</h4>
                {details.qrCodes?.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {details.qrCodes.map((qr: any) => (
                      <div key={qr.id} className="text-center">
                        <img src={qr.imageUrl} alt="QR" className="h-16 w-16 object-contain mx-auto rounded border" />
                        <p className="text-xs mt-1 truncate">{qr.label || "QR"}</p>
                        <Badge
                          variant={qr.active ? "default" : "destructive"}
                          className="text-xs mt-1"
                        >
                          {qr.active ? "Active" : "Off"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No QR codes assigned</p>
                )}
              </div>

              {details.adminNote && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-1">Admin Note</h4>
                    <p className="text-sm text-muted-foreground">{details.adminNote}</p>
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-2">
                {!details.approvedAt ? (
                  <>
                    <Button
                      className="flex-1 rounded-full"
                      onClick={() => approveMutation.mutate(details.userId)}
                      disabled={approveMutation.isPending}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1 rounded-full"
                      onClick={() => rejectMutation.mutate(details.userId)}
                      disabled={rejectMutation.isPending}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" className="w-full rounded-full" asChild>
                    <Link href={`/admin/merchant-qrs?userId=${details.userId}`}>
                      <QrCode className="mr-2 h-4 w-4" />
                      Manage QR Codes
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
