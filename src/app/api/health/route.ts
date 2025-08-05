import { NextResponse } from "next/server";
import { getEnvironmentInfo } from "@/lib/env";

export async function GET() {
  const envInfo = getEnvironmentInfo();

  // Test Gemini API connectivity
  let geminiTest = { success: false, error: null };
  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Test with a simple prompt
    const result = await model.generateContent("Hello");
    const response = await result.response;
    const text = response.text();

    geminiTest = { success: true, error: null };
  } catch (error) {
    geminiTest = {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  const healthStatus = {
    timestamp: new Date().toISOString(),
    environment: envInfo,
    geminiApi: geminiTest,
    nodeEnv: process.env.NODE_ENV,
    nextAuthUrl: process.env.NEXTAUTH_URL,
    // Add more diagnostic info
    userAgent: "Health Check",
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime(),
  };

  const isHealthy =
    envInfo.hasGoogleClientId &&
    envInfo.hasGoogleClientSecret &&
    envInfo.hasNextAuthSecret &&
    envInfo.hasGeminiApiKey &&
    geminiTest.success;

  return NextResponse.json(healthStatus, {
    status: isHealthy ? 200 : 503,
  });
}
