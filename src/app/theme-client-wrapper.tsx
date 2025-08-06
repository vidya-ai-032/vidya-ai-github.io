"use client";
import { useEffect, useState } from "react";

export default function ThemeClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    function applyTheme() {
      if (typeof window !== "undefined") {
        const theme = window.localStorage.getItem("vidyaai_theme");
        if (theme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    }
    
    // Apply theme immediately on client
    applyTheme();
    
    // Listen for theme changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "vidyaai_theme") {
        applyTheme();
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("theme-change", applyTheme);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("theme-change", applyTheme);
    };
  }, []);

  // Prevent hydration mismatch by only rendering children after client-side hydration
  if (!isClient) {
    return <>{children}</>;
  }
  
  return <>{children}</>;
}
