"use server";

import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export async function getAuthenticatedRequestConfig() {
  const session = await getServerSession(authOptions);

  if (session?.error === "RefreshAccessTokenError") {
    throw new Error("Session expired. Please log in again.");
  }

  const accessToken = session?.user?.accessToken;

  if (!accessToken) {
    throw new Error("Please log in to continue.");
  }

  return {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };
}
