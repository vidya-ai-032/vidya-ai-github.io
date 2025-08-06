"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const login = async (provider?: string) => {
    try {
      await signIn(provider || "google", {
        callbackUrl: "/dashboard",
        prompt: "select_account",
      });
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const logout = async () => {
    try {
      // First attempt: Use NextAuth signOut with callback
      await signOut({
        callbackUrl: "https://vidya-ai-640566924297.us-central1.run.app",
        redirect: true,
      });
      
      // Fallback: If the above doesn't work, use router navigation
      // This ensures redirect works even if NextAuth redirect fails
      setTimeout(() => {
        if (typeof window !== "undefined") {
          window.location.href =
            "https://vidya-ai-640566924297.us-central1.run.app";
        }
      }, 100);
    } catch (error) {
      console.error("Logout error:", error);
      // Emergency fallback: Direct navigation
      if (typeof window !== "undefined") {
          window.location.href =
          "https://vidya-ai-640566924297.us-central1.run.app";
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
