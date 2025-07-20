"use client";
import { useEffect } from "react";

export default function ThemeClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
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
    applyTheme();
    window.addEventListener("storage", applyTheme);
    window.addEventListener("theme-change", applyTheme);
    return () => {
      window.removeEventListener("storage", applyTheme);
      window.removeEventListener("theme-change", applyTheme);
    };
  }, []);
  return <>{children}</>;
}
