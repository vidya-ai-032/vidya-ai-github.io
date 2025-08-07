import { NextResponse } from "next/server";

export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 }
    );
  }

  const envInfo = {
    NODE_ENV: process.env.NODE_ENV,
    hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    hasGeminiApiKey: !!process.env.GOOGLE_GEMINI_API_KEY,
    geminiApiKeyLength: process.env.GOOGLE_GEMINI_API_KEY?.length || 0,
    cwd: process.cwd(),
    platform: process.platform,
    nodeVersion: process.version,
  };

  return NextResponse.json(envInfo);
}

