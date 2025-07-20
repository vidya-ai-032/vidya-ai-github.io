"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export function useAuth() {
  const { data: session, status } = useSession();
  // Remove: const router = useRouter();

  const login = async (provider?: string) => {
    try {
      await signIn(provider || "google", { callbackUrl: "/dashboard" });
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const logout = async () => {
    try {
      await signOut({ callbackUrl: "/" });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";

  return {
    session,
    status,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };
}
