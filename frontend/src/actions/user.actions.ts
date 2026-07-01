"use server";

import api from "@/lib/api";
import { revalidatePath } from "next/cache";
import { getAuthenticatedRequestConfig } from "./_auth";

export async function createUserPayoutRequestAction(formData: FormData) {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.post("/user/payouts", formData, config);
    revalidatePath("/dashboard/payouts");
    return { success: true, payout: response.data.payout };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function getMyUserPayoutRequestsAction() {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.get("/user/payouts", config);
    return { success: true, payouts: response.data.payouts, count: response.data.count };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function createGameIdRequestAction(data: {
  gameId: string;
  requestType: string;
  gameUsername?: string;
  email?: string;
  password?: string;
}) {
  try {
    const config = await getAuthenticatedRequestConfig();
    console.log("createGameIdRequestAction sending data:", data);
    const response = await api.post("/user/game-id-requests", data, config);
    console.log("createGameIdRequestAction response:", response.data);
    revalidatePath("/dashboard/games");
    return { success: true, request: response.data.request };
  } catch (error: any) {
    console.error("createGameIdRequestAction error:", error);
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function getMyGameIdRequestsAction() {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.get("/user/game-id-requests", config);
    return { success: true, requests: response.data.requests, count: response.data.count };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}
