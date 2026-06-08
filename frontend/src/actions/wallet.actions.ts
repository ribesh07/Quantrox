"use server";

import api from "@/lib/api";

export async function getUserWalletsAction() {
  try {
    const response = await api.get("/wallets");
    return { success: true, wallets: response.data.wallets };
  } catch (error: any) {
    console.error("Get Wallets Error:", error.response?.data || error.message);
    return { success: false, error: "Error fetching wallets" };
  }
}
