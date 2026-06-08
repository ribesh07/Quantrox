"use server";

import api from "@/lib/api";
import { PaymentMethodCategory } from "@prisma/client";

export async function getPaymentMethodsAction(category?: PaymentMethodCategory) {
  try {
    const response = await api.get("/payment-methods", {
      params: { category }
    });
    return { success: true, methods: response.data.methods };
  } catch (error: any) {
    console.error("Get Payment Methods Error:", error.response?.data || error.message);
    return { success: false, error: "Error fetching payment methods" };
  }
}
