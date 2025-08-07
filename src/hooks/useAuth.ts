"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const login = async (provider?: string) => {
    try {
      await signIn(provider || "google", {
        prompt: "select_account",
      });
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const logout = async () => {
    try {
      // Redirect to landing page after logout
      await signOut({
        callbackUrl: "/",
        redirect: true,
      });
    } catch (error) {
      console.error("Logout error:", error);
      // Emergency fallback: Direct navigation to landing page
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
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
