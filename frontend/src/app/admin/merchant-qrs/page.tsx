"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, Search, Ban, CheckCircle2, Plus, Activity, QrCode, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";
import {
  getAllMerchantQRCodesAction,
  getAllMerchantsAction,
  assignMerchantQRCodeAction,
  bulkAssignMerchantQRCodesAction,
  disableMerchantQRCodeAction,
  enableMerchantQRCodeAction,
} from "@/actions/admin.actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminMerchantQRsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [replaceQrId, setReplaceQrId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [label, setLabel] = useState("");
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [bulkLabels, setBulkLabels] = useState<string[]>([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [replaceDialogOpen, setReplaceDialogOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-merchant-qrs", statusFilter],
    queryFn: async () => {
      const filters = statusFilter !== "all" ? { active: statusFilter === "active" } : undefined;
      const result = await getAllMerchantQRCodesAction(filters);
      if (!result.success) throw new Error(result.error);
      return { qrs: result.qrs || [], stats: result.stats };
    },
  });

  const { data: merchants } = useQuery({
    queryKey: ["admin-merchants-approved"],
    queryFn: async () => {
      const result = await getAllMerchantsAction();
      if (!result.success) return [];
      return (result.merchants || []).filter((m: any) => m.approvedAt);
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
      resetAssignForm();
    },
    onError: (error: any) => toast.error(error.message),
  });

  const bulkAssignMutation = useMutation({
    mutationFn: async ({ userId, formData }: { userId: string; formData: FormData }) => {
      const result = await bulkAssignMerchantQRCodesAction(userId, formData);
      if (!result.success) throw new Error(result.error);
      return result.qrCodes;
    },
    onSuccess: (qrs) => {
      queryClient.invalidateQueries({ queryKey: ["admin-merchant-qrs"] });
      toast.success(`${qrs?.length || 0} QR codes assigned`);
      resetAssignForm();
    },
    onError: (error: any) => toast.error(error.message),
  });

  const disableMutation = useMutation({
    mutationFn: async (qrId: string) => {
      const result = await disableMerchantQRCodeAction(qrId);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-merchant-qrs"] });
      toast.success("QR code disabled");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const enableMutation = useMutation({
    mutationFn: async (qrId: string) => {
      const result = await enableMerchantQRCodeAction(qrId);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-merchant-qrs"] });
      toast.success("QR code enabled");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const resetAssignForm = () => {
    setSelectedUserId("");
    setReplaceQrId(null);
    setFile(null);
    setLabel("");
    setBulkFiles([]);
    setBulkLabels([]);
    setAssignDialogOpen(false);
    setReplaceDialogOpen(false);
  };

  const handleSingleAssign = () => {
    if (!selectedUserId || !file) return;
    const formData = new FormData();
    formData.append("image", file);
    if (label) formData.append("label", label);
    if (replaceQrId) formData.append("replaceQrId", replaceQrId);
    assignMutation.mutate({ userId: selectedUserId, formData });
  };

  const handleBulkAssign = () => {
    if (!selectedUserId || bulkFiles.length === 0) return;
    const formData = new FormData();
    bulkFiles.forEach((f) => formData.append("images", f));
    formData.append("labels", JSON.stringify(bulkLabels));
    bulkAssignMutation.mutate({ userId: selectedUserId, formData });
  };

  const handleBulkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setBulkFiles(files);
    setBulkLabels(files.map((_, i) => bulkLabels[i] || ""));
  };

  const filteredQRs = Array.isArray(data?.qrs)
    ? data.qrs.filter(
        (qr: any) =>
          qr.user?.username?.toLowerCase().includes(search.toLowerCase()) ||
          qr.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
          qr.label?.toLowerCase().includes(search.toLowerCase()) ||
          qr.paymentMethod?.name?.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const stats = data?.stats || { total: 0, active: 0, inactive: 0, totalUsage: 0 };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Merchant QR Codes</h1>
          <p className="text-muted-foreground mt-1">Assign, monitor, and manage merchant QR codes</p>
        </div>
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full">
              <Plus className="mr-2 h-4 w-4" />
              Assign QR
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Assign QR Code to Merchant</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="single">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="single">Single QR</TabsTrigger>
                <TabsTrigger value="bulk">Multiple QRs</TabsTrigger>
              </TabsList>
              <TabsContent value="single" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Merchant</Label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select approved merchant" />
                    </SelectTrigger>
                    <SelectContent>
                      {merchants?.map((m: any) => (
                        <SelectItem key={m.userId} value={m.userId}>
                          {m.businessName} ({m.user?.username})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Label (optional)</Label>
                  <Input
                    placeholder="e.g. GPay, PhonePe"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>QR Image</Label>
                  <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </div>
                <Button
                  className="w-full"
                  onClick={handleSingleAssign}
                  disabled={!selectedUserId || !file || assignMutation.isPending}
                >
                  {assignMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Assign QR
                </Button>
              </TabsContent>
              <TabsContent value="bulk" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Merchant</Label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select approved merchant" />
                    </SelectTrigger>
                    <SelectContent>
                      {merchants?.map((m: any) => (
                        <SelectItem key={m.userId} value={m.userId}>
                          {m.businessName} ({m.user?.username})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Multiple QR Images</Label>
                  <Input type="file" accept="image/*" multiple onChange={handleBulkFileChange} />
                  {bulkFiles.length > 0 && (
                    <p className="text-sm text-muted-foreground">{bulkFiles.length} file(s) selected</p>
                  )}
                </div>
                {bulkFiles.map((_, i) => (
                  <div key={i} className="space-y-1">
                    <Label className="text-xs">Label for QR {i + 1}</Label>
                    <Input
                      placeholder={`Label for ${bulkFiles[i]?.name}`}
                      value={bulkLabels[i] || ""}
                      onChange={(e) => {
                        const next = [...bulkLabels];
                        next[i] = e.target.value;
                        setBulkLabels(next);
                      }}
                    />
                  </div>
                ))}
                <Button
                  className="w-full"
                  onClick={handleBulkAssign}
                  disabled={!selectedUserId || bulkFiles.length === 0 || bulkAssignMutation.isPending}
                >
                  {bulkAssignMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Assign {bulkFiles.length} QR{bulkFiles.length !== 1 ? "s" : ""}
                </Button>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <QrCode className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total QRs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Ban className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{stats.inactive}</p>
                <p className="text-xs text-muted-foreground">Disabled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalUsage}</p>
                <p className="text-xs text-muted-foreground">Total Usage</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="border-b bg-muted/20 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-lg">All Merchant QRs</CardTitle>
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Disabled</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search merchant, label..."
                  className="pl-10 h-10 rounded-xl border-2"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading QR codes...</p>
            </div>
          ) : filteredQRs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Users className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">No QR codes found. Assign one to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 border-b">
                    <TableHead className="font-bold">Merchant</TableHead>
                    <TableHead className="font-bold">Label / Method</TableHead>
                    <TableHead className="font-bold">QR Code</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="font-bold">Monitoring</TableHead>
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
                        <p className="font-medium">{qr.label || "—"}</p>
                        {qr.paymentMethod && (
                          <p className="text-sm text-muted-foreground">{qr.paymentMethod.name}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        {qr.imageUrl && (
                          <img src={qr.imageUrl} alt="QR Code" className="h-16 w-16 object-contain rounded" />
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
                      <TableCell>
                        <div className="text-sm">
                          <p>Usage: <span className="font-medium">{qr.usageCount || 0}</span></p>
                          {qr.lastUsedAt && (
                            <p className="text-muted-foreground text-xs">
                              Last: {new Date(qr.lastUsedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(qr.assignedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Dialog
                            open={replaceDialogOpen && replaceQrId === qr.id}
                            onOpenChange={(open) => {
                              setReplaceDialogOpen(open);
                              if (!open) setReplaceQrId(null);
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-full"
                                onClick={() => {
                                  setSelectedUserId(qr.userId);
                                  setReplaceQrId(qr.id);
                                  setReplaceDialogOpen(true);
                                }}
                              >
                                <Upload className="mr-2 h-4 w-4" />
                                Replace
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Replace QR Code</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                                <Button onClick={handleSingleAssign} disabled={!file || assignMutation.isPending}>
                                  Replace
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          {qr.active ? (
                            <Button
                              size="sm"
                              variant="destructive"
                              className="rounded-full"
                              onClick={() => disableMutation.mutate(qr.id)}
                              disabled={disableMutation.isPending}
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              Disable
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="rounded-full"
                              onClick={() => enableMutation.mutate(qr.id)}
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
