"use server";

import api from "@/lib/api";
import { revalidatePath } from "next/cache";
import { getAuthenticatedRequestConfig } from "./_auth";

export async function createOrderAction(data: any) {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.post("/orders", data, config);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/orders");
    return { success: true, order: response.data.order };
  } catch (error: any) {
    console.error("Create Order Error:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Error creating order",
    };
  }
}

export async function getUserOrdersAction() {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.get("/orders", config);
    return { success: true, orders: response.data.orders };
  } catch (error: any) {
    console.error("Get Orders Error:", error.response?.data || error.message);
    return { success: false, error: "Error fetching orders" };
  }
}
export async function getOrderByIdAction(orderId: string) {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.get(`/orders/${orderId}`, config);
    return { success: true, order: response.data.order };
  } catch (error: any) {
    console.error("Get Order Error:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || "Error fetching order details",
    };
  }
}

export async function uploadOrderProofAction(orderId: string, formData: FormData) {
  try {
    const config = await getAuthenticatedRequestConfig();
    const response = await api.post(`/orders/${orderId}/proof`, formData, config);

    revalidatePath("/dashboard/orders");
    revalidatePath("/admin/orders");
    
    return { success: true, order: response.data.order };
  } catch (error: any) {
    console.error("Upload Proof Error:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Error uploading proof",
    };
  }
}
