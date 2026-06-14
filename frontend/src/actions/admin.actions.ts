"use server";

import api from "@/lib/api";
import { Role, OrderStatus } from "@/lib/prisma-types";
import { revalidatePath } from "next/cache";
import { getAuthenticatedRequestConfig } from "./_auth";

// Order Actions
export async function getAllOrdersAction() {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.get("/admin/orders", config);
    return { success: true, orders: response.data.orders };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function reviewOrderAction(id: string, status: OrderStatus, adminNote?: string) {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.patch(`/admin/orders/${id}/review`, { status, adminNote }, config);
    revalidatePath("/admin/orders");
    revalidatePath("/dashboard");
    return { success: true, order: response.data.order };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

// User Actions
export async function getAllUsersAction() {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.get("/admin/users", config);
    return { success: true, users: response.data.users };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function updateUserRoleAction(userId: string, role: Role) {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.patch(`/admin/users/${userId}/role`, { role }, config);
    revalidatePath("/admin/users");
    return { success: true, user: response.data.user };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function deleteUserAction(userId: string) {
  try {
    const config = await getAuthenticatedRequestConfig();
    await api.delete(`/admin/users/${userId}`, config);
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

// Payment Actions
export async function getAllPaymentMethodsAction() {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.get("/admin/payment-methods", config);
    return { success: true, methods: response.data.methods };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function updatePaymentMethodAction(id: string, data: any) {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.patch(`/admin/payment-methods/${id}`, data, config);
    revalidatePath("/admin/payment-settings");
    return { success: true, method: response.data.method };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

// Game Actions
export async function getAllGamesAction() {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.get("/admin/games", config);
    return { success: true, games: response.data.games };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function createGameAction(data: any) {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.post("/admin/games", data, config);
    revalidatePath("/admin/games");
    return { success: true, game: response.data.game };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function updateGameAction(id: string, data: any) {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.patch(`/admin/games/${id}`, data, config);
    revalidatePath("/admin/games");
    return { success: true, game: response.data.game };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function uploadGameLogoAction(id: string, formData: FormData) {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.patch(`/admin/games/${id}`, formData, config);
    revalidatePath("/admin/games");
    return { success: true, game: response.data.game };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function deleteGameAction(id: string) {
  try {
    const config = await getAuthenticatedRequestConfig();
    await api.delete(`/admin/games/${id}`, config);
    revalidatePath("/admin/games");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function createUserAction(data: { username: string; email: string; password: string; role: string }) {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.post("/admin/users", data, config);
    revalidatePath("/admin/users");
    return { success: true, user: response.data.user };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

// QR Code Actions
export async function getAllQRCodesAction() {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.get("/admin/qr-codes", config);
    return { success: true, qrCodes: response.data.qrCodes };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function createQRCodeAction(formData: FormData) {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.post("/admin/qr-codes", formData, config);
    revalidatePath("/admin/qr-codes");
    return { success: true, qrCode: response.data.qrCode };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function updateQRCodeAction(id: string, active: boolean) {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.patch(`/admin/qr-codes/${id}`, { active }, config);
    revalidatePath("/admin/qr-codes");
    return { success: true, qrCode: response.data.qrCode };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function deleteQRCodeAction(id: string) {
  try {
    const config = await getAuthenticatedRequestConfig();
    await api.delete(`/admin/qr-codes/${id}`, config);
    revalidatePath("/admin/qr-codes");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function uploadPaymentMethodQRAction(id: string, formData: FormData) {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.patch(`/admin/payment-methods/${id}`, formData, config);
    revalidatePath("/admin/payment-settings");
    return { success: true, method: response.data.method };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

// System Settings Actions
export async function getSystemSettingsAction() {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.get("/admin/system-settings", config);
    return { success: true, settings: response.data.settings };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function updateSystemSettingsAction(data: any) {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.patch("/admin/system-settings", data, config);
    revalidatePath("/admin/settings");
    return { success: true, settings: response.data.settings };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}
