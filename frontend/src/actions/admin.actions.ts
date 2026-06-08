"use server";

import api from "@/lib/api";
import { Role, OrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

// Order Actions
export async function getAllOrdersAction() {
  try {
    const response = await api.get("/admin/orders");
    return { success: true, orders: response.data.orders };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function reviewOrderAction(id: string, status: OrderStatus, adminNote?: string) {
  try {
    const response = await api.patch(`/admin/orders/${id}/review`, { status, adminNote });
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
    const response = await api.get("/admin/users");
    return { success: true, users: response.data.users };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function updateUserRoleAction(userId: string, role: Role) {
  try {
    const response = await api.patch(`/admin/users/${userId}/role`, { role });
    revalidatePath("/admin/users");
    return { success: true, user: response.data.user };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function deleteUserAction(userId: string) {
  try {
    await api.delete(`/admin/users/${userId}`);
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

// Payment Actions
export async function getAllPaymentMethodsAction() {
  try {
    const response = await api.get("/admin/payment-methods");
    return { success: true, methods: response.data.methods };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function updatePaymentMethodAction(id: string, data: any) {
  try {
    const response = await api.patch(`/admin/payment-methods/${id}`, data);
    revalidatePath("/admin/payment-settings");
    return { success: true, method: response.data.method };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

// Game Actions
export async function getAllGamesAction() {
  try {
    const response = await api.get("/admin/games");
    return { success: true, games: response.data.games };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function createGameAction(data: any) {
  try {
    const response = await api.post("/admin/games", data);
    revalidatePath("/admin/games");
    return { success: true, game: response.data.game };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function updateGameAction(id: string, data: any) {
  try {
    const response = await api.patch(`/admin/games/${id}`, data);
    revalidatePath("/admin/games");
    return { success: true, game: response.data.game };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function deleteGameAction(id: string) {
  try {
    await api.delete(`/admin/games/${id}`);
    revalidatePath("/admin/games");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

// QR Code Actions
export async function getAllQRCodesAction() {
  try {
    const response = await api.get("/admin/qr-codes");
    return { success: true, qrCodes: response.data.qrCodes };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function createQRCodeAction(formData: FormData) {
  try {
    const response = await api.post("/admin/qr-codes", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    revalidatePath("/admin/qr-codes");
    return { success: true, qrCode: response.data.qrCode };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function updateQRCodeAction(id: string, active: boolean) {
  try {
    const response = await api.patch(`/admin/qr-codes/${id}`, { active });
    revalidatePath("/admin/qr-codes");
    return { success: true, qrCode: response.data.qrCode };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function deleteQRCodeAction(id: string) {
  try {
    await api.delete(`/admin/qr-codes/${id}`);
    revalidatePath("/admin/qr-codes");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}
