"use server";

import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export async function getAuthenticatedRequestConfig() {
  const session = await getServerSession(authOptions);
  const accessToken = (session?.user as any)?.accessToken as string | undefined;

  if (!accessToken) {
    throw new Error("Please log in to continue.");
  }

  return {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };
}
