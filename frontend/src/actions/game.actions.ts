"use server";

import api from "@/lib/api";

export async function getActiveGamesAction() {
  try {
    const response = await api.get("/games");
    return { success: true, games: response.data.games };
  } catch (error: any) {
    console.error("Get Games Error:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || "Error fetching games",
    };
  }
}
