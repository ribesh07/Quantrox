import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import axios from "axios";

export const dynamic = "force-dynamic";

const resolveServerApiUrl = () => {
  const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl?.trim()) {
    return apiUrl.replace(/\/+$/, "");
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Missing INTERNAL_API_URL or NEXT_PUBLIC_API_URL for authentication.");
  }

  return "http://localhost:3001/api";
};

const SERVER_API_URL = resolveServerApiUrl();
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
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
          const response = await axios.post(`${SERVER_API_URL}/auth/login`, {
            email: credentials.email,
            password: credentials.password,
          });

          const data = response.data;

          if (data.success && data.user) {
            return {
              ...data.user,
              accessToken: data.token,
            };
          }
          return null;
        } catch (error: any) {
          if (error.response?.status === 401) {
            return null;
          }
          throw new Error(
            error.response?.data?.message || "Authentication service is unavailable. Please try again."
          );
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.username = (user as any).username;
        token.id = user.id;
        token.accessToken = (user as any).accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).username = token.username;
        (session.user as any).id = token.id;
        (session.user as any).accessToken = token.accessToken;
      }
      return session;
    },
  },
};
