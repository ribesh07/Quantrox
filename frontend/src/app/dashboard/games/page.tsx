"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Gamepad2, Search, Loader2, DollarSign, User, TrendingUp, Info } from "lucide-react";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Image from "next/image";

export default function GamesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [gameUsername, setGameUsername] = useState("");

  const { data: games, isLoading: gamesLoading } = useQuery({
    queryKey: ["games"],
    queryFn: async () => {
      const res = await fetch("/api/admin/games");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const filteredGames = useMemo(() => {
    const active = Array.isArray(games) ? games.filter((g: any) => g.active) : [];
    if (!search) return active;
    return active.filter((g: any) => 
      g.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [games, search]);

  const createOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create order");
      return res.json();
    },
    onSuccess: (data) => {
      toast.success("Order created! Redirecting to payment...");
      router.push(`/dashboard/orders/${data.id}/payment`);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create order");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGame || !amount || !gameUsername) {
      toast.error("Please fill in all fields");
      return;
    }
    
    createOrderMutation.mutate({
      type: "GAME_TOPUP",
      gameId: selectedGame.id,
      gameUsername,
      amount: parseFloat(amount),
      rate: selectedGame.buyRate,
      total: parseFloat(amount) * selectedGame.buyRate,
    });
  };

  const closeDialog = () => {
    setSelectedGame(null);
    setAmount("");
    setGameUsername("");
  };

  return (
    <div className="space-y-8 pb-20 bg-[#0B0E11] min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4 md:px-0">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight flex items-center gap-3">
            <Gamepad2 className="h-8 w-8 md:h-12 md:w-12 text-primary" />
            Gaming Store
          </h1>
          <p className="text-[#848E9C] font-medium text-base md:text-xl">Instant top-ups for trending games.</p>
        </div>
        
        <div className="relative w-full md:w-[450px] group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#848E9C] group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search your favorite game..." 
            className="pl-14 h-16 rounded-2xl border-2 border-[#2B3139] bg-[#1E2329] text-white focus:border-primary transition-all text-lg placeholder:text-[#474D57] shadow-2xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {gamesLoading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <div className="relative">
            <div className="h-20 w-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <Gamepad2 className="h-10 w-10 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-[#848E9C] font-bold text-lg animate-pulse tracking-widest uppercase">Loading Store...</p>
        </div>
      ) : filteredGames.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-40 text-center space-y-8">
          <div className="bg-[#1E2329] p-10 rounded-[3.5rem] border-2 border-[#2B3139] shadow-2xl">
            <Search className="h-24 w-24 text-[#474D57]" />
          </div>
          <div className="space-y-3">
            <h3 className="text-3xl font-black text-white tracking-tight">No games found</h3>
            <p className="text-[#848E9C] max-w-sm mx-auto font-medium text-lg">We couldn&apos;t find any games matching &quot;{search}&quot;</p>
          </div>
          <Button 
            variant="outline" 
            className="h-14 px-8 rounded-2xl border-2 border-[#2B3139] text-white hover:bg-[#1E2329] font-bold text-lg"
            onClick={() => setSearch("")}
          >
            Clear Search
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-5 px-4 md:px-0">
          {filteredGames.map((game: any) => (
            <div 
              key={game.id}
              onClick={() => setSelectedGame(game)}
              className="group relative cursor-pointer"
            >
              <div className="aspect-[2/3] md:aspect-[3/4] rounded-[1rem] md:rounded-[1.5rem] overflow-hidden border-2 border-[#2B3139] bg-[#1E2329] group-hover:border-primary transition-all duration-500 shadow-xl hover:shadow-primary/20 hover:-translate-y-2 relative">
                {/* Poster Image */}
                {game.logo ? (
                  <Image 
                    src={game.logo} 
                    alt={game.name} 
                    fill 
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#1E2329] to-[#0B0E11]">
                    <Gamepad2 className="h-16 w-16 text-[#2B3139] group-hover:scale-110 transition-transform duration-500" />
                  </div>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />
                
                {/* Hover Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-30">
                  <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center shadow-2xl scale-50 group-hover:scale-100 transition-transform duration-300">
                    <TrendingUp className="h-7 w-7 text-primary-foreground" />
                  </div>
                </div>

                {/* Content Overlay */}
                <div className="absolute inset-x-0 bottom-0 p-3 md:p-5 z-20 space-y-1 md:space-y-2">
                  <h3 className="text-white font-black text-sm md:text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                    {game.name}
                  </h3>
                  
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/10 backdrop-blur-sm px-2 py-0.5 md:px-3 md:py-1 rounded-lg border border-primary/20">
                      <span className="text-primary font-black text-[10px] md:text-sm whitespace-nowrap">
                        ${game.buyRate.toFixed(2)}
                      </span>
                    </div>
                    <span className="text-[#848E9C] font-bold text-[8px] md:text-[10px] uppercase tracking-tighter">Rate</span>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="absolute top-3 left-3 z-20 flex flex-col gap-2">
                  {game.active && (
                    <div className="bg-[#0ECB81] text-[#0B0E11] text-[8px] md:text-[10px] font-black px-2 py-0.5 md:px-3 md:py-1 rounded-lg uppercase tracking-tighter shadow-xl flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#0B0E11] animate-pulse" />
                      Popular
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Topup Dialog */}
      <Dialog open={!!selectedGame} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="bg-[#1E2329] border-2 border-[#2B3139] text-white rounded-[2rem] md:rounded-[3rem] max-w-lg p-0 overflow-hidden shadow-2xl">
          {selectedGame && (
            <form onSubmit={handleSubmit} className="relative">
              {/* Header with Background */}
              <div className="h-40 bg-gradient-to-br from-primary to-primary/40 relative flex items-end px-6 md:px-10 pb-6 overflow-hidden">
                <div className="absolute -right-10 -top-10 opacity-20">
                  <Gamepad2 className="h-40 w-40 text-[#0B0E11]" />
                </div>
                
                <div className="absolute top-6 right-6">
                  <div className="bg-black/20 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest text-white border border-white/10 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                    Secure Top-up
                  </div>
                </div>
                
                <div className="space-y-1">
                  <h2 className="text-3xl md:text-4xl font-black text-[#0B0E11] tracking-tighter line-clamp-1 leading-none">
                    {selectedGame.name}
                  </h2>
                  <p className="text-[#0B0E11]/70 font-bold text-sm md:text-base">1 USD = {selectedGame.buyRate} Credits</p>
                </div>
              </div>

              <div className="p-6 md:p-10 space-y-8">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-[#848E9C] font-black text-xs uppercase tracking-widest ml-1">Game Username / ID</Label>
                    <div className="relative group">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-[#474D57] group-focus-within:text-primary transition-colors z-10">
                        <User className="h-full w-full" />
                      </div>
                      <Input
                        placeholder="Enter your unique ID"
                        className="pl-14 h-16 rounded-2xl border-2 border-[#2B3139] bg-[#0B0E11] text-white focus:border-primary transition-all font-bold text-lg placeholder:text-[#474D57]"
                        value={gameUsername}
                        onChange={(e) => setGameUsername(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[#848E9C] font-black text-xs uppercase tracking-widest ml-1">Amount to Buy (USD)</Label>
                    <div className="relative group">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-[#474D57] group-focus-within:text-primary transition-colors z-10">
                        <DollarSign className="h-full w-full" />
                      </div>
                      <Input
                        type="number"
                        placeholder="0.00"
                        className="pl-14 h-16 rounded-2xl border-2 border-[#2B3139] bg-[#0B0E11] text-white focus:border-primary transition-all font-black text-2xl placeholder:text-[#474D57]"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        min="1"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-[#0B0E11] rounded-[2.5rem] p-8 border-2 border-[#2B3139] space-y-6 relative overflow-hidden group/card">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/card:opacity-20 transition-opacity">
                    <TrendingUp className="h-20 w-20 text-primary" />
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#848E9C] font-bold uppercase tracking-wider">Exchange Value</span>
                    <span className="text-white font-black px-3 py-1 bg-[#1E2329] rounded-lg border border-[#2B3139]">
                      Rate: {selectedGame.buyRate}
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-1 border-t-2 border-dashed border-[#2B3139] pt-6">
                    <span className="text-sm font-bold text-[#848E9C] uppercase tracking-widest">You will receive</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl md:text-5xl font-black text-primary tracking-tighter">
                        {(parseFloat(amount || "0") * selectedGame.buyRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-sm md:text-lg font-black text-primary/70 uppercase">Credits</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 p-5 rounded-2xl bg-primary/5 border border-primary/10 text-[10px] md:text-xs text-primary/80 font-bold leading-relaxed">
                  <Info className="h-5 w-5 shrink-0" />
                  <p>Double check your ID. Credits will be instantly delivered to <span className="text-white">{gameUsername || "the specified account"}</span> once your payment is confirmed.</p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-20 rounded-[1.5rem] md:rounded-[2rem] bg-primary text-[#0B0E11] font-black text-2xl shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
                  disabled={createOrderMutation.isPending || !amount || !gameUsername}
                >
                  {createOrderMutation.isPending ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-7 w-7 animate-spin" />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    "Confirm & Top-up"
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
