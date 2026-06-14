"use server";

import api from "@/lib/api";
import { z } from "zod";
import { getAuthenticatedRequestConfig } from "./_auth";

const registerSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function registerUserAction(data: z.infer<typeof registerSchema>) {
  try {
    const response = await api.post("/auth/register", data);
    return { success: true, user: response.data.user };
  } catch (error: any) {
    console.error("[REGISTER_ERROR]", error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.message || "An error occurred during registration." 
    };
  }
}

export async function getCurrentUserAction() {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.get("/auth/me", config);
    return { success: true, user: response.data.user };
  } catch (error: any) {
    console.error("[GET_CURRENT_USER_ERROR]", error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.message || "An error occurred while fetching user." 
    };
  }
}

