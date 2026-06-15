import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import axios from "axios";
import type { JWT } from "next-auth/jwt";
import { resolveServerApiBaseUrl } from "@/lib/api-url";

export const dynamic = "force-dynamic";

const ACCESS_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

async function refreshAccessToken(token: JWT): Promise<JWT> {
  if (!token.refreshToken) {
    return { ...token, error: "RefreshAccessTokenError" };
  }

  try {
    const response = await axios.post(`${resolveServerApiBaseUrl()}/auth/refresh`, {
      refreshToken: token.refreshToken,
    });

    return {
      ...token,
      accessToken: response.data.token,
      refreshToken: response.data.refreshToken ?? token.refreshToken,
      accessTokenExpires: Date.now() + ACCESS_TOKEN_TTL_MS,
      error: undefined,
    };
  } catch {
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        try {
          const response = await axios.post(`${resolveServerApiBaseUrl()}/auth/login`, {
            email: credentials.email,
            password: credentials.password,
          });

          const data = response.data;

          if (data.success && data.user) {
            return {
              ...data.user,
              accessToken: data.token,
              refreshToken: data.refreshToken,
            };
          }
          return null;
        } catch (error: unknown) {
          if (axios.isAxiosError(error) && error.response?.status === 401) {
            return null;
          }
          const message = axios.isAxiosError(error)
            ? error.response?.data?.message
            : undefined;
          throw new Error(message || "Authentication service is unavailable. Please try again.");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.username = (user as { username?: string }).username;
        token.id = user.id;
        token.accessToken = (user as { accessToken?: string }).accessToken;
        token.refreshToken = (user as { refreshToken?: string }).refreshToken;
        token.accessTokenExpires = Date.now() + ACCESS_TOKEN_TTL_MS;
        return token;
      }

      if (token.error === "RefreshAccessTokenError") {
        return token;
      }

      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
        return token;
      }

      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.username = token.username;
        session.user.id = token.id;
        session.user.accessToken = token.accessToken;
      }
      if (token.error) {
        session.error = token.error;
      }
      return session;
    },
  },
};
