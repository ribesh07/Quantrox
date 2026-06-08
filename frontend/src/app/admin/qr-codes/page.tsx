"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Image from "next/image";
import { getAllQRCodesAction, updateQRCodeAction, deleteQRCodeAction, createQRCodeAction } from "@/actions/admin.actions";

export default function QRCodesPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data: qrCodes, isLoading } = useQuery({
    queryKey: ["qr-codes"],
    queryFn: async () => {
      const result = await getAllQRCodesAction();
      if (!result.success) throw new Error(result.error);
      return result.qrCodes || [];
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const result = await createQRCodeAction(formData);
      if (!result.success) throw new Error(result.error);
      return result.qrCode;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qr-codes"] });
      setIsOpen(false);
      toast.success("QR Code uploaded successfully");
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string, active: boolean }) => {
      const result = await updateQRCodeAction(id, active);
      if (!result.success) throw new Error(result.error);
      return result.qrCode;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qr-codes"] });
      toast.success("QR Code updated");
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteQRCodeAction(id);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qr-codes"] });
      toast.success("QR Code deleted");
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const handleFileUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploading(true);
    const formData = new FormData(e.currentTarget);
    uploadMutation.mutate(formData);
    setUploading(false);
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">QR Codes</h1>
          <p className="text-muted-foreground">Manage payment QR codes for users</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add QR Code
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload New QR Code</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image">QR Code Image</Label>
                <Input id="image" name="image" type="file" accept="image/*" required />
              </div>
              <Button type="submit" className="w-full" disabled={uploading}>
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {qrCodes?.map((qr: any) => (
          <Card key={qr.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">QR Code</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive"
                onClick={() => deleteMutation.mutate(qr.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative aspect-square w-full overflow-hidden rounded-md border">
                <Image
                  src={qr.image}
                  alt="QR Code"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Active Status</Label>
                <Switch
                  checked={qr.active}
                  onCheckedChange={(checked) =>
                    updateMutation.mutate({ id: qr.id, active: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
