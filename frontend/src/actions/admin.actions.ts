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

export async function getUserByIdAction(userId: string) {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.get(`/admin/getuser/${userId}`, config);
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

export async function createPaymentMethodAction(formData: FormData) {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.post("/admin/payment-methods", formData, config);
    revalidatePath("/admin/payment-settings");
    return { success: true, method: response.data.method };
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

export async function deletePaymentMethodAction(id: string) {
  try {
    const config = await getAuthenticatedRequestConfig();
    await api.delete(`/admin/payment-methods/${id}`, config);
    revalidatePath("/admin/payment-settings");
    return { success: true };
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

// Merchant Management Actions
export async function getAllMerchantsAction() {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.get("/admin/merchants", config);
    return { success: true, merchants: response.data.merchants, count: response.data.count };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function approveMerchantAction(userId: string, adminNote?: string) {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.patch(`/admin/merchants/${userId}/approve`, { adminNote }, config);
    revalidatePath("/admin/merchants");
    return { success: true, merchant: response.data.merchant };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function rejectMerchantAction(userId: string, adminNote?: string) {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.patch(`/admin/merchants/${userId}/reject`, { adminNote }, config);
    revalidatePath("/admin/merchants");
    return { success: true, merchant: response.data.merchant };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function createMerchantAction(data: {
  userId: string;
  businessName: string;
  businessDescription?: string;
  preferredPaymentMethodId: string;
  expectedDailyVolume: number;
  autoApprove?: boolean;
}) {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.post("/admin/merchants", data, config);
    revalidatePath("/admin/merchants");
    return { success: true, merchant: response.data.merchant };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

// Merchant QR Code Actions
export async function getAllMerchantQRCodesAction() {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.get("/admin/merchant-qrs", config);
    return { success: true, qrs: response.data.qrs, count: response.data.count };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function assignMerchantQRCodeAction(userId: string, formData: FormData) {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.post(`/admin/merchant-qrs/${userId}`, formData, config);
    revalidatePath("/admin/merchant-qrs");
    return { success: true, qrCode: response.data.qrCode };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function disableMerchantQRCodeAction(userId: string) {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.patch(`/admin/merchant-qrs/${userId}/disable`, {}, config);
    revalidatePath("/admin/merchant-qrs");
    return { success: true, qrCode: response.data.qrCode };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function enableMerchantQRCodeAction(userId: string) {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.patch(`/admin/merchant-qrs/${userId}/enable`, {}, config);
    revalidatePath("/admin/merchant-qrs");
    return { success: true, qrCode: response.data.qrCode };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

// Transaction Report Actions
export async function getAllTransactionReportsAction() {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.get("/admin/transaction-reports", config);
    return { success: true, reports: response.data.reports, count: response.data.count };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function approveTransactionReportAction(id: string) {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.patch(`/admin/transaction-reports/${id}/approve`, {}, config);
    revalidatePath("/admin/transaction-reports");
    return { success: true, report: response.data.report };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function rejectTransactionReportAction(id: string) {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.patch(`/admin/transaction-reports/${id}/reject`, {}, config);
    revalidatePath("/admin/transaction-reports");
    return { success: true, report: response.data.report };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

// Deposit Actions
export async function getAllDepositsAction() {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.get("/admin/deposits", config);
    return { success: true, deposits: response.data.deposits, count: response.data.count };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function approveDepositAction(id: string) {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.patch(`/admin/deposits/${id}/approve`, {}, config);
    revalidatePath("/admin/deposits");
    return { success: true, deposit: response.data.deposit };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function rejectDepositAction(id: string) {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.patch(`/admin/deposits/${id}/reject`, {}, config);
    revalidatePath("/admin/deposits");
    return { success: true, deposit: response.data.deposit };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function freezeDepositAction(id: string) {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.patch(`/admin/deposits/${id}/freeze`, {}, config);
    revalidatePath("/admin/deposits");
    return { success: true, deposit: response.data.deposit };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function releaseDepositAction(id: string) {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.patch(`/admin/deposits/${id}/release`, {}, config);
    revalidatePath("/admin/deposits");
    return { success: true, deposit: response.data.deposit };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function adjustDepositAction(id: string, amount: number, notes?: string) {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.patch(`/admin/deposits/${id}/adjust`, { amount, notes }, config);
    revalidatePath("/admin/deposits");
    return { success: true, deposit: response.data.deposit };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

// Payout Request Actions
export async function getAllPayoutRequestsAction(status?: string, type?: string) {
  try {
    const config = await getAuthenticatedRequestConfig();
    const params: Record<string, string> = {};
    if (status && status !== "ALL") params.status = status;
    if (type) params.type = type;
    const response = await api.get("/admin/payout-requests", {
      ...config,
      params: Object.keys(params).length ? params : undefined,
    });
    return { success: true, payouts: response.data.payouts, count: response.data.count };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function getPayoutStatusCountsAction(type?: string) {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.get("/admin/payout-requests/stats", {
      ...config,
      params: type ? { type } : undefined,
    });
    return { success: true, counts: response.data.counts };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function approvePayoutRequestAction(id: string, revalidatePaths?: string[]) {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.patch(`/admin/payout-requests/${id}/approve`, {}, config);
    for (const path of revalidatePaths ?? ["/admin/payout-requests"]) {
      revalidatePath(path);
    }
    return { success: true, payout: response.data.payout };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function rejectPayoutRequestAction(id: string, rejectionReason: string, revalidatePaths?: string[]) {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.patch(`/admin/payout-requests/${id}/reject`, { rejectionReason }, config);
    for (const path of revalidatePaths ?? ["/admin/payout-requests"]) {
      revalidatePath(path);
    }
    return { success: true, payout: response.data.payout };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function markPayoutPaidAction(id: string, formData: FormData, revalidatePaths?: string[]) {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.patch(`/admin/payout-requests/${id}/mark-paid`, formData, {
      ...config,
      headers: {
        ...config.headers,
        "Content-Type": "multipart/form-data",
      },
    });
    for (const path of revalidatePaths ?? ["/admin/payout-requests"]) {
      revalidatePath(path);
    }
    return { success: true, payout: response.data.payout };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

// Game ID Request Actions
export async function getAllGameIdRequestsAction(status?: string) {
  try {
    const config = await getAuthenticatedRequestConfig();
    const params: Record<string, string> = {};
    if (status && status !== "ALL") params.status = status;
    const response = await api.get("/admin/game-id-requests", {
      ...config,
      params: Object.keys(params).length ? params : undefined,
    });
    return { success: true, requests: response.data.requests, count: response.data.count };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function approveGameIdRequestAction(id: string, response: string) {
  try {
    const config = await getAuthenticatedRequestConfig();
    const res = await api.patch(`/admin/game-id-requests/${id}/approve`, { response }, config);
    revalidatePath("/admin/games");
    return { success: true, request: res.data.request };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function rejectGameIdRequestAction(id: string, response: string) {
  try {
    const config = await getAuthenticatedRequestConfig();
    const res = await api.patch(`/admin/game-id-requests/${id}/reject`, { response }, config);
    revalidatePath("/admin/games");
    return { success: true, request: res.data.request };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}
