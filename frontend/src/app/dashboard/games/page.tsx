"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Gamepad2, Search, Loader2, DollarSign, User, TrendingUp, Info, QrCode, UploadCloud } from "lucide-react";
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
import { getActiveGamesAction } from "@/actions/game.actions";
import { createOrderAction, uploadOrderProofAction } from "@/actions/order.actions";
import { getPaymentMethodsAction } from "@/actions/payment.actions";

export default function GamesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [gameUsername, setGameUsername] = useState("");
  const [selectedMethodId, setSelectedMethodId] = useState("");
  const [step, setStep] = useState(1);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentPreview, setPaymentPreview] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  const { data: games, isLoading: gamesLoading } = useQuery({
    queryKey: ["games"],
    queryFn: async () => {
      const res = await getActiveGamesAction();
      if (!res.success) {
        throw new Error(res.error);
      }
      return Array.isArray(res.games) ? res.games : [];
    },
  });

  const { data: methods, isLoading: methodsLoading } = useQuery({
    queryKey: ["payment-methods", "DEPOSIT"],
    queryFn: async () => {
      const result = await getPaymentMethodsAction("DEPOSIT");
      if (!result.success) throw new Error(result.error);
      return result.methods;
    },
  });

  const filteredGames = useMemo(() => {
    const active = Array.isArray(games) ? games.filter((g: any) => g.active) : [];
    if (!search) return active;
    return active.filter((g: any) => 
      g.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [games, search]);

  const selectedMethod = methods?.find((m: any) => m.id === selectedMethodId);

  const calculateFee = () => {
    if (!selectedMethod || !amount) return 0;
    return (parseFloat(amount) * selectedMethod.feePercentage) / 100;
  };

  const calculateTotal = () => {
    if (!amount) return 0;
    return parseFloat(amount) + calculateFee();
  };

  const calculateCredits = () => {
    if (!amount || !selectedGame) return 0;
    return parseFloat(amount) * selectedGame.buyRate;
  };

  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPaymentProof(file);
    setPaymentPreview(URL.createObjectURL(file));
  };

  const createOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await createOrderAction(data);
      if (!res.success) throw new Error(res.error);
      return res.order;
    },
    onSuccess: (order) => {
      setOrderId(order.id);
      setStep(2);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create order");
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!orderId || !paymentProof) throw new Error("Payment proof required");
      const formData = new FormData();
      formData.append("file", paymentProof);
      const res = await uploadOrderProofAction(orderId, formData);
      if (!res.success) throw new Error(res.error);
      return res.order;
    },
    onSuccess: () => {
      toast.success("Top-up request submitted successfully!");
      router.push("/dashboard/orders");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to upload proof");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      createOrderMutation.mutate({
        type: "GAME_TOPUP",
        gameId: selectedGame.id,
        gameUsername,
        paymentMethodId: selectedMethodId,
        amount: parseFloat(amount),
        rate: selectedGame.buyRate,
        total: calculateTotal(),
      });
      return;
    }
    uploadMutation.mutate();
  };

  const closeDialog = () => {
    setSelectedGame(null);
    setAmount("");
    setGameUsername("");
    setSelectedMethodId("");
    setStep(1);
    setPaymentProof(null);
    setPaymentPreview(null);
    setOrderId(null);
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
            <p className="text-[#848E9C] max-w-sm mx-auto font-medium text-lg">We couldn't find any games matching "{search}"</p>
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

                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />
                
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-30">
                  <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center shadow-2xl scale-50 group-hover:scale-100 transition-transform duration-300">
                    <TrendingUp className="h-7 w-7 text-primary-foreground" />
                  </div>
                </div>

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

      <Dialog open={!!selectedGame} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="bg-[#1E2329] border-2 border-[#2B3139] text-white rounded-[2rem] md:rounded-[3rem] max-w-3xl p-0 overflow-hidden shadow-2xl">
          {selectedGame && (
            <form onSubmit={handleSubmit} className="relative">
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
                {step === 1 ? (
                  <>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-[#848E9C] uppercase text-xs font-black tracking-widest">Select Payment Method</Label>
                        <Select value={selectedMethodId} onValueChange={setSelectedMethodId}>
                          <SelectTrigger className="h-14 bg-[#0B0E11] border-[#2B3139] text-white rounded-xl">
                            <SelectValue placeholder="Choose a payment method" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1E2329] border-[#2B3139] text-white">
                            {methods?.map((method: any) => (
                              <SelectItem key={method.id} value={method.id}>
                                {method.name} {method.feePercentage === 0 ? "(No Fee)" : `(${method.feePercentage}% fee)`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

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

                    {selectedMethod && amount && (
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
                        
                        <div className="space-y-3 border-t-2 border-dashed border-[#2B3139] pt-6">
                          <div className="flex justify-between text-sm">
                            <span className="text-[#848E9C]">Top-up Amount</span>
                            <span className="text-white font-bold">${parseFloat(amount).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-[#848E9C]">Processing Fee ({selectedMethod.feePercentage}%)</span>
                            <span className="text-orange-500 font-bold">${calculateFee().toFixed(2)}</span>
                          </div>
                          <div className="pt-2 border-t border-[#2B3139] flex justify-between">
                            <span className="text-white font-black">Total Payable</span>
                            <span className="text-primary font-black text-lg">${calculateTotal().toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="pt-4 flex justify-between items-center bg-primary/5 p-3 rounded-lg">
                          <span className="text-primary text-xs font-black uppercase">You will receive</span>
                          <span className="text-primary font-black text-xl">
                            {calculateCredits().toFixed(2)} Credits
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-4 p-5 rounded-2xl bg-primary/5 border border-primary/10 text-[10px] md:text-xs text-primary/80 font-bold leading-relaxed">
                      <Info className="h-5 w-5 shrink-0" />
                      <p>Double check your ID. Credits will be delivered to <span className="text-white">{gameUsername || "the specified account"}</span> once your payment is confirmed.</p>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-20 rounded-[1.5rem] md:rounded-[2rem] bg-primary text-[#0B0E11] font-black text-2xl shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                      disabled={createOrderMutation.isPending || !amount || !gameUsername || !selectedMethodId}
                    >
                      {createOrderMutation.isPending ? (
                        <div className="flex items-center gap-3">
                          <Loader2 className="h-7 w-7 animate-spin" />
                          <span>Creating Order...</span>
                        </div>
                      ) : (
                        "Next Step"
                      )}
                    </Button>
                  </>
                ) : (
                  <div className="space-y-6">
                    <div className="p-6 rounded-3xl bg-[#0B0E11] border-2 border-primary/20 flex flex-col items-center text-center space-y-4">
                      {selectedMethod?.qrCode ? (
                        <Image src={selectedMethod.qrCode} alt="QR Code" width={200} height={200} className="rounded-xl" />
                      ) : (
                        <div className="p-8 bg-white rounded-xl">
                          <QrCode className="h-40 w-40 text-black" />
                        </div>
                      )}
                      <div>
                        <p className="text-[#848E9C] text-sm uppercase font-black tracking-widest">Pay to this account</p>
                        <p className="text-white font-bold text-lg mt-1">{selectedMethod?.details || "Contact Admin for Details"}</p>
                      </div>
                      <div className="w-full pt-4 border-t border-[#2B3139]">
                        <p className="text-primary font-black text-2xl">${calculateTotal().toFixed(2)}</p>
                        <p className="text-[#848E9C] text-xs">Exact amount to be paid</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[#848E9C] uppercase text-xs font-black tracking-widest">Upload Payment Proof</Label>
                      <div 
                        className={cn(
                          "relative border-2 border-dashed border-[#2B3139] rounded-3xl p-8 flex flex-col items-center justify-center transition-all hover:border-primary/50 cursor-pointer overflow-hidden",
                          paymentPreview ? "aspect-video" : "h-40"
                        )}
                        onClick={() => document.getElementById('payment-proof-game')?.click()}
                      >
                        {paymentPreview ? (
                          <Image src={paymentPreview} alt="Preview" fill className="object-contain" unoptimized />
                        ) : (
                          <>
                            <UploadCloud className="h-10 w-10 text-[#848E9C] mb-2" />
                            <p className="text-[#848E9C] text-sm font-medium">Click to upload screenshot</p>
                          </>
                        )}
                        <input 
                          type="file" 
                          id="payment-proof-game" 
                          className="hidden" 
                          accept="image/*"
                          onChange={handleProofUpload}
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-20 rounded-[1.5rem] md:rounded-[2rem] bg-primary text-[#0B0E11] font-black text-2xl shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                      disabled={uploadMutation.isPending || !paymentProof}
                    >
                      {uploadMutation.isPending ? (
                        <div className="flex items-center gap-3">
                          <Loader2 className="h-7 w-7 animate-spin" />
                          <span>Submitting...</span>
                        </div>
                      ) : (
                        "Submit Top-up Request"
                      )}
                    </Button>

                    <Button 
                      variant="ghost" 
                      className="w-full text-[#848E9C] hover:text-white"
                      type="button"
                      onClick={() => setStep(1)}
                    >
                      Go Back
                    </Button>
                  </div>
                )}
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
