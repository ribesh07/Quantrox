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

// Function to fetch user data including permissions
async function fetchUserWithPermissions(token: string) {
  try {
    const response = await axios.get(`${SERVER_API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.data.success) {
      return response.data.user;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user permissions:", error);
    return null;
  }
}

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
        temporaryToken: { label: "Temporary Token", type: "text" },
        code: { label: "Code", type: "text" },
      },
      async authorize(credentials) {
        // Case 1: 2FA verification step
        if (credentials?.temporaryToken && credentials?.code) {
          try {
            const response = await axios.post(`${SERVER_API_URL}/auth/2fa/verify`, {
              temporaryToken: credentials.temporaryToken,
              code: credentials.code,
            });

            const data = response.data;

            if (data.success && data.user) {
              // Fetch full user with permissions
              const userWithPermissions = await fetchUserWithPermissions(data.token);
              if (userWithPermissions) {
                return {
                  ...userWithPermissions,
                  accessToken: data.token,
                };
              }
              return {
                ...data.user,
                accessToken: data.token,
              };
            }
            return null;
          } catch (error: any) {
            if (error.response?.status === 401 || error.response?.status === 400) {
              return null;
            }
            throw new Error(
              error.response?.data?.message || "Authentication service is unavailable. Please try again."
            );
          }
        }

        // Case 2: Regular password login step
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        try {
          const response = await axios.post(`${SERVER_API_URL}/auth/login`, {
            email: credentials.email,
            password: credentials.password,
          });

          const data = response.data;

          // If 2FA is required, return a special user object with requiresTwoFactor
          if (data.success && data.requiresTwoFactor) {
            return {
              id: "temp", // Dummy ID for NextAuth
              requiresTwoFactor: true,
              temporaryToken: data.temporaryToken,
              email: credentials.email,
            } as any;
          }

          // If no 2FA, return regular user with permissions
          if (data.success && data.user) {
            const userWithPermissions = await fetchUserWithPermissions(data.token);
            if (userWithPermissions) {
              return {
                ...userWithPermissions,
                accessToken: data.token,
              };
            }
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
        const userAny = user as any;
        if (userAny.requiresTwoFactor) {
          token.requiresTwoFactor = true;
          token.temporaryToken = userAny.temporaryToken;
          token.email = userAny.email;
        } else {
          token.role = userAny.role;
          token.username = userAny.username;
          token.id = userAny.id;
          token.accessToken = userAny.accessToken;
          token.permissions = userAny.permissions || [];
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).username = token.username;
        (session.user as any).id = token.id;
        (session.user as any).accessToken = token.accessToken;
        (session.user as any).requiresTwoFactor = token.requiresTwoFactor;
        (session.user as any).temporaryToken = token.temporaryToken;
        (session.user as any).permissions = token.permissions || [];
      }
      return session;
    },
  },
};
