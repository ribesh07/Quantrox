"use server";

import api from "@/lib/api";

export async function getPaymentAccountAction(
  paymentMethodId: string
) {
  try {
    const response = await api.get(
      `/payment-accounts/${paymentMethodId}`
    );

    return {
      success: true,
      account: response.data.account,
    };
  } catch (error: any) {
    console.error(
      "Get Payment Account Error:",
      error.response?.data || error.message
    );

    return {
      success: false,
      error:
        error.response?.data?.message ||
        "Error fetching payment account",
    };
  }
}