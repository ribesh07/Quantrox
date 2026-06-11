"use server";

import api from "@/lib/api";
import { getAuthenticatedRequestConfig } from "./_auth";

export async function getUserWalletsAction() {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.get("/wallets", config);
    return { success: true, wallets: response.data.wallets };
  } catch (error: any) {
    console.error("Get Wallets Error:", error.response?.data || error.message);
    return { success: false, error: "Error fetching wallets" };
  }
}
