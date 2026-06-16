"use server";

import api from "@/lib/api";
import { revalidatePath } from "next/cache";
import { getAuthenticatedRequestConfig } from "./_auth";

export type MerchantWalletInput = {
  walletId: string;
  minLimit?: number;
  maxLimit?: number;
  dailyLimit?: number;
  isPrimary?: boolean;
};

export async function getMyMerchantInfoAction() {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.get("/merchant/info", config);
    return { success: true, info: response.data.info };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function createMerchantInfoAction(data: {
  businessName: string;
  businessDescription?: string;
  preferredWalletId: string;
  expectedDailyVolume: number;
  merchantWallets?: MerchantWalletInput[];
}) {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.post("/merchant/info", data, config);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/merchant");
    return { success: true, info: response.data.info };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function updateMyMerchantInfoAction(data: Partial<{
  businessName: string;
  businessDescription?: string;
  preferredWalletId: string;
  expectedDailyVolume: number;
  merchantWallets?: MerchantWalletInput[];
}>) {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.put("/merchant/info", data, config);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/merchant");
    return { success: true, info: response.data.info };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function getMyQRCodesAction() {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.get("/merchant/qr", config);
    return { success: true, qrCodes: response.data.qrCodes || [] };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

/** @deprecated Use getMyQRCodesAction instead */
export async function getMyQRCodeAction() {
  const result = await getMyQRCodesAction();
  if (!result.success) return result;
  return { success: true, qrCode: result.qrCodes?.[0] || null };
}

export async function createTransactionReportAction(formData: FormData) {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.post("/merchant/reports", formData, config);
    revalidatePath("/dashboard/reports");
    return { success: true, report: response.data.report };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function getMyTransactionReportsAction() {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.get("/merchant/reports", config);
    return { success: true, reports: response.data.reports, count: response.data.count };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function getMyDepositsAction() {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.get("/merchant/deposits", config);
    return { success: true, deposits: response.data.deposits, count: response.data.count };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function getMyTotalDepositAction() {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.get("/merchant/deposits/total", config);
    return { success: true, total: response.data.total };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function createPayoutRequestAction(formData: FormData) {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.post("/merchant/payouts", formData, config);
    revalidatePath("/dashboard/payouts");
    return { success: true, payout: response.data.payout };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function getMyPayoutRequestsAction() {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.get("/merchant/payouts", config);
    return { success: true, payouts: response.data.payouts, count: response.data.count };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}
