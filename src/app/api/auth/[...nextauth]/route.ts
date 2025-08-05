import NextAuth from "next-auth";
import { authOptions } from "../authOptions";
import {
  validateEnvironmentVariables,
  getEnvironmentInfo,
  checkProductionEnvironment,
} from "@/lib/env";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
    };
  }
}

// Validate environment variables on startup
try {
  validateEnvironmentVariables();
  console.log("Environment info:", getEnvironmentInfo());
  // Check for production-specific issues
  checkProductionEnvironment();
} catch (error) {
  console.error("Environment validation failed:", error);
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
