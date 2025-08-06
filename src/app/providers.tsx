"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider 
      // Ensure session is refetched when window regains focus
      refetchOnWindowFocus={true}
      // Refetch session every 0 seconds (disable auto refetch)
      refetchInterval={0}
      // Ensure session is available on first load
      refetchWhenOffline={false}
    >
      {children}
    </SessionProvider>
  );
}
