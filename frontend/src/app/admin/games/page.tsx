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
import { Plus, Image as ImageIcon, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getAllGamesAction, createGameAction, updateGameAction, deleteGameAction } from "@/actions/admin.actions";

export default function GamesPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const { data: games, isLoading } = useQuery({
    queryKey: ["games"],
    queryFn: async () => {
      const result = await getAllGamesAction();
      if (!result.success) throw new Error(result.error);
      return result.games || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newGame: any) => {
      const result = await createGameAction(newGame);
      if (!result.success) throw new Error(result.error);
      return result.game;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["games"] });
      setIsOpen(false);
      toast.success("Game created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const result = await updateGameAction(id, data);
      if (!result.success) throw new Error(result.error);
      return result.game;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["games"] });
      toast.success("Game updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteGameAction(id);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["games"] });
      toast.success("Game deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary" />
    </div>
  );

  return (
    <div className="space-y-6 bg-[#0B0E11] min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Game Management</h1>
          <p className="text-[#848E9C] font-medium text-lg">Create and manage your gaming store catalog.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-black rounded-2xl px-8 h-14 text-lg shadow-xl shadow-primary/20">
              <Plus className="mr-2 h-6 w-6" /> Add New Game
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1E2329] border-2 border-[#2B3139] text-white rounded-[2.5rem] max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-3xl font-black">Add New Game</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                createMutation.mutate({
                  name: formData.get("name"),
                  logo: formData.get("logo"),
                  buyRate: parseFloat(formData.get("buyRate") as string),
                  sellRate: parseFloat(formData.get("sellRate") as string),
                });
              }}
              className="space-y-6 pt-6"
            >
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[#848E9C] font-black uppercase tracking-widest text-xs ml-1">Game Name</Label>
                <Input id="name" name="name" placeholder="e.g. Juwa Online" className="h-14 rounded-2xl border-2 border-[#2B3139] bg-[#0B0E11] text-white focus:border-primary transition-all font-bold" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logo" className="text-[#848E9C] font-black uppercase tracking-widest text-xs ml-1">Poster Image URL</Label>
                <Input id="logo" name="logo" placeholder="https://example.com/poster.jpg" className="h-14 rounded-2xl border-2 border-[#2B3139] bg-[#0B0E11] text-white focus:border-primary transition-all font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="buyRate" className="text-[#848E9C] font-black uppercase tracking-widest text-xs ml-1">Buy Rate</Label>
                  <Input id="buyRate" name="buyRate" type="number" step="0.01" defaultValue="1.00" className="h-14 rounded-2xl border-2 border-[#2B3139] bg-[#0B0E11] text-white focus:border-primary transition-all font-black text-xl" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sellRate" className="text-[#848E9C] font-black uppercase tracking-widest text-xs ml-1">Sell Rate</Label>
                  <Input id="sellRate" name="sellRate" type="number" step="0.01" defaultValue="1.00" className="h-14 rounded-2xl border-2 border-[#2B3139] bg-[#0B0E11] text-white focus:border-primary transition-all font-black text-xl" required />
                </div>
              </div>
              <Button type="submit" className="w-full h-16 rounded-[1.5rem] bg-primary text-primary-foreground font-black text-xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Game"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 pt-4">
        {Array.isArray(games) && games.map((game: any) => (
          <Card key={game.id} className="border-2 border-[#2B3139] bg-[#1E2329] shadow-xl hover:border-primary/50 transition-all duration-500 rounded-[2.5rem] overflow-hidden group">
            {/* Poster Preview */}
            <div className="relative aspect-[3/2] bg-[#0B0E11] overflow-hidden border-b-2 border-[#2B3139]">
              {game.logo ? (
                <Image src={game.logo} alt={game.name} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-[#474D57]">
                  <ImageIcon className="h-16 w-16 opacity-20" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#1E2329] via-transparent to-transparent opacity-60" />
              <div className="absolute top-4 right-4">
                <Button 
                  variant="destructive" 
                  size="icon" 
                  className="rounded-xl h-10 w-10 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this game?")) {
                      deleteMutation.mutate(game.id);
                    }
                  }}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <CardContent className="p-8 space-y-8">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-white tracking-tight">{game.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#0ECB81]" />
                  <span className="text-xs font-bold text-[#848E9C] uppercase tracking-widest">Live in Store</span>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-[#848E9C] font-black uppercase tracking-widest text-[10px] ml-1">Poster URL</Label>
                  <Input
                    defaultValue={game.logo}
                    placeholder="Enter image URL"
                    className="h-12 rounded-xl border-2 border-[#2B3139] bg-[#0B0E11] text-white focus:border-primary font-medium text-sm"
                    onBlur={(e) =>
                      updateMutation.mutate({
                        id: game.id,
                        logo: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-3">
                    <Label className="text-[#848E9C] font-black uppercase tracking-widest text-[10px] ml-1">Buy Rate</Label>
                    <Input
                      defaultValue={game.buyRate}
                      type="number"
                      step="0.01"
                      className="h-14 rounded-2xl border-2 border-[#2B3139] bg-[#0B0E11] text-primary focus:border-primary font-black text-xl"
                      onBlur={(e) =>
                        updateMutation.mutate({
                          id: game.id,
                          buyRate: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[#848E9C] font-black uppercase tracking-widest text-[10px] ml-1">Sell Rate</Label>
                    <Input
                      defaultValue={game.sellRate}
                      type="number"
                      step="0.01"
                      className="h-14 rounded-2xl border-2 border-[#2B3139] bg-[#0B0E11] text-[#848E9C] focus:border-primary font-black text-xl"
                      onBlur={(e) =>
                        updateMutation.mutate({
                          id: game.id,
                          sellRate: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between bg-[#0B0E11] p-5 rounded-[1.5rem] border-2 border-[#2B3139] mt-2 group-hover:border-primary/20 transition-all">
                  <div className="space-y-0.5">
                    <Label className="text-white font-black">Active Product</Label>
                    <p className="text-[10px] text-[#848E9C] font-bold uppercase tracking-tighter">Visible to customers</p>
                  </div>
                  <Switch
                    checked={game.active}
                    onCheckedChange={(checked) =>
                      updateMutation.mutate({ id: game.id, active: checked })
                    }
                    className="data-[state=checked]:bg-[#0ECB81]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
