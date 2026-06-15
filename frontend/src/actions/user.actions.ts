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
