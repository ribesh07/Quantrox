"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, Search, Ban, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { getAllMerchantQRCodesAction, assignMerchantQRCodeAction, disableMerchantQRCodeAction, enableMerchantQRCodeAction } from "@/actions/admin.actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function AdminMerchantQRsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-merchant-qrs"],
    queryFn: async () => {
      const result = await getAllMerchantQRCodesAction();
      if (!result.success) throw new Error(result.error);
      return result.qrs || [];
    },
  });

  const assignMutation = useMutation({
    mutationFn: async ({ userId, formData }: { userId: string; formData: FormData }) => {
      const result = await assignMerchantQRCodeAction(userId, formData);
      if (!result.success) throw new Error(result.error);
      return result.qrCode;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-merchant-qrs"] });
      toast.success("QR code assigned");
      setSelectedUser(null);
      setFile(null);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const disableMutation = useMutation({
    mutationFn: async (userId: string) => {
      const result = await disableMerchantQRCodeAction(userId);
      if (!result.success) throw new Error(result.error);
      return result.qrCode;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-merchant-qrs"] });
      toast.success("QR code disabled");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const enableMutation = useMutation({
    mutationFn: async (userId: string) => {
      const result = await enableMerchantQRCodeAction(userId);
      if (!result.success) throw new Error(result.error);
      return result.qrCode;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-merchant-qrs"] });
      toast.success("QR code enabled");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const filteredQRs = Array.isArray(data) ? data.filter((qr: any) => 
    qr.user?.username?.toLowerCase().includes(search.toLowerCase()) ||
    qr.user?.email?.toLowerCase().includes(search.toLowerCase())
  ) : [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleAssign = async () => {
    if (!selectedUser || !file) return;
    const formData = new FormData();
    formData.append("image", file);
    assignMutation.mutate({ userId: selectedUser, formData });
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Merchant QR Codes</h1>
          <p className="text-muted-foreground mt-1">Assign and manage merchant QR codes</p>
        </div>
      </div>

      <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="border-b bg-muted/20 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-lg">All Merchant QRs</CardTitle>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
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
              <p className="text-sm text-muted-foreground">Loading QR codes...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 border-b">
                    <TableHead className="font-bold">User</TableHead>
                    <TableHead className="font-bold">QR Code</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="font-bold">Assigned At</TableHead>
                    <TableHead className="text-right font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQRs.map((qr: any) => (
                    <TableRow key={qr.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell>
                        <div>
                          <p className="font-medium">{qr.user?.username}</p>
                          <p className="text-sm text-muted-foreground">{qr.user?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {qr.imageUrl && (
                          <img
                            src={qr.imageUrl}
                            alt="QR Code"
                            className="h-20 w-20 object-contain"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {qr.active ? (
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/20 rounded-full px-3">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="rounded-full px-3">
                            Disabled
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(qr.assignedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" className="rounded-full" onClick={() => setSelectedUser(qr.userId)}>
                                <Upload className="mr-2 h-4 w-4" />
                                Replace
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Assign New QR Code</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Input type="file" accept="image/*" onChange={handleFileChange} />
                                <div className="flex justify-end gap-2">
                                  <Button
                                    onClick={handleAssign} disabled={!file || assignMutation.isPending}>
                                    Assign
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          {qr.active ? (
                            <Button
                              size="sm" variant="destructive" className="rounded-full"
                              onClick={() => disableMutation.mutate(qr.userId)}
                              disabled={disableMutation.isPending}
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              Disable
                            </Button>
                          ) : (
                            <Button
                              size="sm" className="rounded-full"
                              onClick={() => enableMutation.mutate(qr.userId)}
                              disabled={enableMutation.isPending}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Enable
                            </Button>
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
