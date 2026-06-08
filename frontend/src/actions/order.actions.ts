"use server";

import api from "@/lib/api";
import { revalidatePath } from "next/cache";

export async function createOrderAction(data: any) {
  try {
    const response = await api.post("/orders", data);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/orders");
    return { success: true, order: response.data.order };
  } catch (error: any) {
    console.error("Create Order Error:", error.response?.data || error.message);
    return { success: false, error: error.response?.data?.message || "Error creating order" };
  }
}

export async function getUserOrdersAction() {
  try {
    const response = await api.get("/orders");
    return { success: true, orders: response.data.orders };
  } catch (error: any) {
    console.error("Get Orders Error:", error.response?.data || error.message);
    return { success: false, error: "Error fetching orders" };
  }
}

export async function uploadOrderProofAction(orderId: string, formData: FormData) {
  try {
    const response = await api.post(`/orders/${orderId}/proof`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    revalidatePath("/dashboard/orders");
    revalidatePath("/admin/orders");
    
    return { success: true, order: response.data.order };
  } catch (error: any) {
    console.error("Upload Proof Error:", error.response?.data || error.message);
    return { success: false, error: error.response?.data?.message || "Error uploading proof" };
  }
}
