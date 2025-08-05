export function validateEnvironmentVariables() {
  const requiredVars = {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    GOOGLE_GEMINI_API_KEY: process.env.GOOGLE_GEMINI_API_KEY,
  };

  const missingVars = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    console.error("Missing required environment variables:", missingVars);
    console.error(
      "Environment check failed. This will cause authentication and API issues."
    );
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );
  }

  console.log("✅ All required environment variables are set");
  return true;
}

export function getEnvironmentInfo() {
  return {
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    hasGeminiApiKey: !!process.env.GOOGLE_GEMINI_API_KEY,
    // Add more detailed info for debugging
    googleClientIdLength: process.env.GOOGLE_CLIENT_ID?.length || 0,
    googleClientSecretLength: process.env.GOOGLE_CLIENT_SECRET?.length || 0,
    nextAuthSecretLength: process.env.NEXTAUTH_SECRET?.length || 0,
    geminiApiKeyLength: process.env.GOOGLE_GEMINI_API_KEY?.length || 0,
  };
}

// Function to check if we're in production and provide helpful error messages
export function checkProductionEnvironment() {
  if (process.env.NODE_ENV === "production") {
    const envInfo = getEnvironmentInfo();
    const missingVars = [];

    if (!envInfo.hasGoogleClientId) missingVars.push("GOOGLE_CLIENT_ID");
    if (!envInfo.hasGoogleClientSecret)
      missingVars.push("GOOGLE_CLIENT_SECRET");
    if (!envInfo.hasNextAuthSecret) missingVars.push("NEXTAUTH_SECRET");
    if (!envInfo.hasGeminiApiKey) missingVars.push("GOOGLE_GEMINI_API_KEY");

    if (missingVars.length > 0) {
      console.error("🚨 PRODUCTION ENVIRONMENT ISSUE:");
      console.error("Missing environment variables:", missingVars);
      console.error(
        "Please configure these in your Google Cloud Run service environment variables."
      );
      console.error(
        "Go to: Google Cloud Console > Cloud Run > Your Service > Edit > Variables & Secrets"
      );
    }
  }
}
