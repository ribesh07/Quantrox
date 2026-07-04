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

// 2FA Actions
export async function setup2FAAction() {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.post("/auth/2fa/setup", {}, config);
    return { 
      success: true, 
      secret: response.data.secret, 
      qrCode: response.data.qrCode 
    };
  } catch (error: any) {
    console.error("[SETUP_2FA_ERROR]", error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.message || "Failed to setup 2FA" 
    };
  }
}

export async function enable2FAAction({ secret, code, password }: { secret: string; code: string; password: string }) {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.post("/auth/2fa/enable", { secret, code, password }, config);
    return { 
      success: true, 
      backupCodes: response.data.backupCodes 
    };
  } catch (error: any) {
    console.error("[ENABLE_2FA_ERROR]", error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.message || "Failed to enable 2FA" 
    };
  }
}

export async function disable2FAAction({ code, password }: { code: string; password: string }) {
  try {
    const config = await getAuthenticatedRequestConfig();
    await api.post("/auth/2fa/disable", { code, password }, config);
    return { success: true };
  } catch (error: any) {
    console.error("[DISABLE_2FA_ERROR]", error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.message || "Failed to disable 2FA" 
    };
  }
}

