"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  getAllGameIdRequestsAction,
  approveGameIdRequestAction,
  rejectGameIdRequestAction
} from "@/actions/admin.actions";

export default function GameRequestsPage() {
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [responseText, setResponseText] = useState("");
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);

  const { data: gameIdRequests, isLoading: requestsLoading, isError, error } = useQuery({
    queryKey: ["gameIdRequests"],
    queryFn: async () => {
      const result = await getAllGameIdRequestsAction();
      if (!result.success) throw new Error(result.error);
      return result.requests || [];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, response }: any) => {
      const result = await approveGameIdRequestAction(id, response);
      if (!result.success) throw new Error(result.error);
      return result.request;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gameIdRequests"] });
      setSelectedRequest(null);
      setResponseText("");
      setActionType(null);
      toast.success("Request approved successfully");
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, response }: any) => {
      const result = await rejectGameIdRequestAction(id, response);
      if (!result.success) throw new Error(result.error);
      return result.request;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gameIdRequests"] });
      setSelectedRequest(null);
      setResponseText("");
      setActionType(null);
      toast.success("Request rejected successfully");
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-red-500 font-bold">Failed to load game ID requests</p>
        <p className="text-[#848E9C]">{(error as Error).message}</p>
      </div>
    );
  }

  if (requestsLoading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary" />
    </div>
  );

  return (
    <div className="space-y-6 bg-[#0B0E11] min-h-screen">
      <div>
        <h1 className="text-4xl font-black text-white tracking-tight">Game ID Requests</h1>
        <p className="text-[#848E9C] font-medium text-lg">Review and respond to game ID requests from users.</p>
      </div>

      <div className="space-y-4">
        {gameIdRequests?.length === 0 ? (
          <div className="text-center py-12 text-[#848E9C]">
            No game ID requests yet.
          </div>
        ) : (
          gameIdRequests?.map((request: any) => (
            <Card key={request.id} className="border-2 border-[#2B3139] bg-[#1E2329] shadow-xl rounded-[2rem] overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-black text-white">{request.game?.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        request.status === "PENDING" ? "bg-yellow-500/20 text-yellow-500" :
                        request.status === "APPROVED" ? "bg-green-500/20 text-green-500" :
                        "bg-red-500/20 text-red-500"
                      }`}>
                        {request.status}
                      </span>
                    </div>
                    <p className="text-[#848E9C] text-sm">
                      Requested by: {request.user?.username} ({request.user?.email})
                    </p>
                    <p className="text-[#848E9C] text-sm">
                      Submitted: {new Date(request.createdAt).toLocaleString()}
                    </p>
                    <p className="text-[#848E9C] text-sm">
                      Type: {request.requestType === "GAME_ID" ? "Game ID" : "Email/Password"}
                    </p>
                    {request.requestType === "GAME_ID" && request.gameUsername && (
                      <p className="text-white">Game ID: {request.gameUsername}</p>
                    )}
                    {request.requestType === "EMAIL_PASSWORD" && (
                      <>
                        <p className="text-white">Email: {request.email}</p>
                        <p className="text-white">Password: {request.password}</p>
                      </>
                    )}
                    {request.response && (
                      <div className="mt-3 p-3 bg-[#0B0E11] rounded-lg border border-[#2B3139]">
                        <p className="text-[#848E9C] text-xs font-black uppercase tracking-wider mb-1">Response</p>
                        <p className="text-white">{request.response}</p>
                      </div>
                    )}
                  </div>

                  {request.status === "PENDING" && (
                    <div className="flex gap-2">
                      <Dialog open={selectedRequest?.id === request.id && actionType === "approve"} onOpenChange={(open) => {
                        if (!open) {
                          setSelectedRequest(null);
                          setResponseText("");
                          setActionType(null);
                        } else {
                          setSelectedRequest(request);
                          setActionType("approve");
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button className="bg-green-600 hover:bg-green-700 text-white">
                            <Check className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#1E2329] border-2 border-[#2B3139] text-white rounded-[2rem]">
                          <DialogHeader>
                            <DialogTitle className="text-2xl font-black">Approve Request</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label className="text-[#848E9C] font-black text-xs uppercase tracking-widest">Response</Label>
                              <Input
                                placeholder="Enter your response (e.g., Game ID: 12345)"
                                value={responseText}
                                onChange={(e) => setResponseText(e.target.value)}
                                className="h-14 rounded-2xl border-2 border-[#2B3139] bg-[#0B0E11] text-white focus:border-primary transition-all font-bold"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                onClick={() => {
                                  if (responseText.trim()) {
                                    approveMutation.mutate({ id: request.id, response: responseText });
                                  }
                                }}
                                disabled={!responseText.trim()}
                              >
                                Confirm Approve
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={selectedRequest?.id === request.id && actionType === "reject"} onOpenChange={(open) => {
                        if (!open) {
                          setSelectedRequest(null);
                          setResponseText("");
                          setActionType(null);
                        } else {
                          setSelectedRequest(request);
                          setActionType("reject");
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="destructive">
                            <X className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#1E2329] border-2 border-[#2B3139] text-white rounded-[2rem]">
                          <DialogHeader>
                            <DialogTitle className="text-2xl font-black">Reject Request</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label className="text-[#848E9C] font-black text-xs uppercase tracking-widest">Response</Label>
                              <Input
                                placeholder="Enter reason for rejection"
                                value={responseText}
                                onChange={(e) => setResponseText(e.target.value)}
                                className="h-14 rounded-2xl border-2 border-[#2B3139] bg-[#0B0E11] text-white focus:border-primary transition-all font-bold"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="destructive"
                                className="flex-1"
                                onClick={() => {
                                  if (responseText.trim()) {
                                    rejectMutation.mutate({ id: request.id, response: responseText });
                                  }
                                }}
                                disabled={!responseText.trim()}
                              >
                                Confirm Reject
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}