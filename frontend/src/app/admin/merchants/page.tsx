"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { getAllMerchantsAction, approveMerchantAction, rejectMerchantAction } from "@/actions/admin.actions";

export default function AdminMerchantsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

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
          <p className="text-muted-foreground mt-1">Approve and manage merchant applications</p>
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
