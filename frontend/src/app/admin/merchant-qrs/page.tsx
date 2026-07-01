"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, Search, Ban, CheckCircle2, Plus, QrCode, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  getAllMerchantQRCodesAction,
  assignMerchantQRCodeAction,
  assignMultipleMerchantQRCodesAction,
  replaceMerchantQRCodeAction,
  disableMerchantQRCodeAction,
  enableMerchantQRCodeAction,
  getAllMerchantsAction,
} from "@/actions/admin.actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function AdminMerchantQRsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [assignOpen, setAssignOpen] = useState(false);
  const [replaceQrId, setReplaceQrId] = useState<string | null>(null);
  const [selectedMerchantId, setSelectedMerchantId] = useState("");
  const [singleFile, setSingleFile] = useState<File | null>(null);
  const [singleLabel, setSingleLabel] = useState("");
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [bulkLabels, setBulkLabels] = useState<string[]>([]);
  const [replaceFile, setReplaceFile] = useState<File | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-merchant-qrs", statusFilter],
    queryFn: async () => {
      const filters: { active?: boolean } = {};
      if (statusFilter === "active") filters.active = true;
      if (statusFilter === "disabled") filters.active = false;
      const result = await getAllMerchantQRCodesAction(filters);
      if (!result.success) throw new Error(result.error);
      return { qrs: result.qrs || [], stats: result.stats };
    },
  });

  const { data: merchants } = useQuery({
    queryKey: ["admin-merchants-for-qr"],
    queryFn: async () => {
      const result = await getAllMerchantsAction();
      if (!result.success) throw new Error(result.error);
      return (result.merchants || []).filter((m: any) => m.approvedAt);
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-merchant-qrs"] });

  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!selectedMerchantId || !singleFile) throw new Error("Select merchant and file");
      const formData = new FormData();
      formData.append("image", singleFile);
      if (singleLabel) formData.append("label", singleLabel);
      const result = await assignMerchantQRCodeAction(selectedMerchantId, formData);
      if (!result.success) throw new Error(result.error);
      return result.qrCode;
    },
    onSuccess: () => {
      invalidate();
      toast.success("QR code assigned");
      setAssignOpen(false);
      setSingleFile(null);
      setSingleLabel("");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const bulkAssignMutation = useMutation({
    mutationFn: async () => {
      if (!selectedMerchantId || bulkFiles.length === 0) throw new Error("Select merchant and files");
      const formData = new FormData();
      bulkFiles.forEach((f) => formData.append("images", f));
      bulkLabels.forEach((l) => formData.append("labels", l));
      const result = await assignMultipleMerchantQRCodesAction(selectedMerchantId, formData);
      if (!result.success) throw new Error(result.error);
      return result.qrs;
    },
    onSuccess: (qrs) => {
      invalidate();
      toast.success(`${qrs?.length || bulkFiles.length} QR codes assigned`);
      setAssignOpen(false);
      setBulkFiles([]);
      setBulkLabels([]);
    },
    onError: (error: any) => toast.error(error.message),
  });

  const replaceMutation = useMutation({
    mutationFn: async () => {
      if (!replaceQrId || !replaceFile) throw new Error("Select file");
      const formData = new FormData();
      formData.append("image", replaceFile);
      const result = await replaceMerchantQRCodeAction(replaceQrId, formData);
      if (!result.success) throw new Error(result.error);
      return result.qrCode;
    },
    onSuccess: () => {
      invalidate();
      toast.success("QR code replaced");
      setReplaceQrId(null);
      setReplaceFile(null);
    },
    onError: (error: any) => toast.error(error.message),
  });

  const disableMutation = useMutation({
    mutationFn: async (qrId: string) => {
      const result = await disableMerchantQRCodeAction(qrId);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => { invalidate(); toast.success("QR code disabled"); },
    onError: (error: any) => toast.error(error.message),
  });

  const enableMutation = useMutation({
    mutationFn: async (qrId: string) => {
      const result = await enableMerchantQRCodeAction(qrId);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => { invalidate(); toast.success("QR code enabled"); },
    onError: (error: any) => toast.error(error.message),
  });

  const filteredQRs = useMemo(() => {
    const qrs = data?.qrs || [];
    if (!search) return qrs;
    const q = search.toLowerCase();
    return qrs.filter((qr: any) =>
      qr.user?.username?.toLowerCase().includes(q) ||
      qr.user?.email?.toLowerCase().includes(q) ||
      qr.user?.merchantInfo?.businessName?.toLowerCase().includes(q) ||
      qr.label?.toLowerCase().includes(q)
    );
  }, [data?.qrs, search]);

  const merchantGroups = useMemo(() => {
    const groups: Record<string, { user: any; qrs: any[] }> = {};
    for (const qr of filteredQRs) {
      if (!groups[qr.userId]) {
        groups[qr.userId] = { user: qr.user, qrs: [] };
      }
      groups[qr.userId].qrs.push(qr);
    }
    return Object.values(groups);
  }, [filteredQRs]);

  const stats = data?.stats;

  const handleBulkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setBulkFiles(files);
      setBulkLabels(files.map((_, i) => bulkLabels[i] || `QR ${i + 1}`));
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Merchant QR Codes</h1>
          <p className="text-muted-foreground mt-1">Assign, monitor, and manage merchant QR codes</p>
        </div>
        <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl font-bold">
              <Plus className="mr-2 h-4 w-4" />
              Assign QR to Merchant
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Assign QR Code(s) to Merchant</DialogTitle>
              <DialogDescription>
                Assign one or multiple QR codes to a merchant at the same time.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Merchant</Label>
                <Select value={selectedMerchantId} onValueChange={setSelectedMerchantId}>
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

              <Tabs defaultValue="single">
                <TabsList className="w-full">
                  <TabsTrigger value="single" className="flex-1">Single QR</TabsTrigger>
                  <TabsTrigger value="bulk" className="flex-1">Multiple QRs</TabsTrigger>
                </TabsList>
                <TabsContent value="single" className="space-y-3 mt-4">
                  <div className="space-y-2">
                    <Label>Label (optional)</Label>
                    <Input
                      placeholder="e.g. Main Store QR"
                      value={singleLabel}
                      onChange={(e) => setSingleLabel(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>QR Image</Label>
                    <Input type="file" accept="image/*" onChange={(e) => setSingleFile(e.target.files?.[0] || null)} />
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => assignMutation.mutate()}
                    disabled={!selectedMerchantId || !singleFile || assignMutation.isPending}
                  >
                    {assignMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Assign QR
                  </Button>
                </TabsContent>
                <TabsContent value="bulk" className="space-y-3 mt-4">
                  <div className="space-y-2">
                    <Label>QR Images (multiple)</Label>
                    <Input type="file" accept="image/*" multiple onChange={handleBulkFileChange} />
                  </div>
                  {bulkFiles.length > 0 && (
                    <div className="space-y-2">
                      <Label>Labels for each QR</Label>
                      {bulkFiles.map((_, i) => (
                        <Input
                          key={i}
                          placeholder={`QR ${i + 1} label`}
                          value={bulkLabels[i] || ""}
                          onChange={(e) => {
                            const next = [...bulkLabels];
                            next[i] = e.target.value;
                            setBulkLabels(next);
                          }}
                        />
                      ))}
                    </div>
                  )}
                  <Button
                    className="w-full"
                    onClick={() => bulkAssignMutation.mutate()}
                    disabled={!selectedMerchantId || bulkFiles.length === 0 || bulkAssignMutation.isPending}
                  >
                    {bulkAssignMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Assign {bulkFiles.length || ""} QR{bulkFiles.length !== 1 ? "s" : ""}
                  </Button>
                </TabsContent>
              </Tabs>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <QrCode className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total QRs</p>
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
                  <p className="text-sm text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Ban className="h-8 w-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.disabled}</p>
                  <p className="text-sm text-muted-foreground">Disabled</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.merchantsWithQR}</p>
                  <p className="text-sm text-muted-foreground">Merchants with QRs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search merchant or label..."
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
              <QrCode className="h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No QR codes found. Assign one to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 border-b">
                    <TableHead className="font-bold">Merchant</TableHead>
                    <TableHead className="font-bold">Label</TableHead>
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
                          <p className="font-medium">{qr.user?.merchantInfo?.businessName || qr.user?.username}</p>
                          <p className="text-sm text-muted-foreground">{qr.user?.email}</p>
                          {(merchantGroups.find((g) => g.user?.id === qr.userId)?.qrs.length ?? 0) > 1 && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              {merchantGroups.find((g) => g.user?.id === qr.userId)?.qrs.length} QRs total
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{qr.label || "—"}</span>
                      </TableCell>
                      <TableCell>
                        {qr.imageUrl && (
                          <img src={qr.imageUrl} alt="QR Code" className="h-16 w-16 object-contain rounded border" />
                        )}
                      </TableCell>
                      <TableCell>
                        {qr.active ? (
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/20 rounded-full px-3">Active</Badge>
                        ) : (
                          <Badge variant="destructive" className="rounded-full px-3">Disabled</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(qr.assignedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Dialog open={replaceQrId === qr.id} onOpenChange={(open) => !open && setReplaceQrId(null)}>
                            <DialogTrigger asChild>
                              <Button size="sm" className="rounded-full" onClick={() => setReplaceQrId(qr.id)}>
                                <Upload className="mr-2 h-4 w-4" />
                                Replace
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Replace QR Code</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Input type="file" accept="image/*" onChange={(e) => setReplaceFile(e.target.files?.[0] || null)} />
                                <Button
                                  onClick={() => replaceMutation.mutate()}
                                  disabled={!replaceFile || replaceMutation.isPending}
                                >
                                  Replace
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          {qr.active ? (
                            <Button
                              size="sm" variant="destructive" className="rounded-full"
                              onClick={() => disableMutation.mutate(qr.id)}
                              disabled={disableMutation.isPending}
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              Disable
                            </Button>
                          ) : (
                            <Button
                              size="sm" className="rounded-full"
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
