"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

export default function RatesPage() {
  const queryClient = useQueryClient();
  const { data: rates, isLoading } = useQuery({
    queryKey: ["rates"],
    queryFn: async () => {
      const res = await fetch("/api/admin/rates");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, rate }: { id: string; rate: number }) => {
      const res = await fetch(`/api/admin/rates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rate }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rates"] });
      toast.success("Rate updated successfully");
    },
  });

  const handleUpdate = (id: string, rate: string) => {
    const numRate = parseFloat(rate);
    if (isNaN(numRate)) return;
    updateMutation.mutate({ id, rate: numRate });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Exchange Rates</h1>
        <p className="text-muted-foreground">Manage global exchange rates</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {Array.isArray(rates) && rates.map((rate: any) => (
          <Card key={rate.id}>
            <CardHeader>
              <CardTitle>{rate.type.replace(/_/g, " ")}</CardTitle>
              <CardDescription>
                Current Rate: 1 {rate.type.split("_")[0]} = {rate.rate}{" "}
                {rate.type.split("_")[2]}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`rate-${rate.id}`}>New Rate</Label>
                  <Input
                    id={`rate-${rate.id}`}
                    defaultValue={rate.rate}
                    type="number"
                    step="0.01"
                  />
                </div>
                <Button
                  onClick={() => {
                    const input = document.getElementById(
                      `rate-${rate.id}`
                    ) as HTMLInputElement;
                    handleUpdate(rate.id, input.value);
                  }}
                  disabled={updateMutation.isPending}
                >
                  Update
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
