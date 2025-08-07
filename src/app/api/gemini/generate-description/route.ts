import { NextRequest, NextResponse } from "next/server";
import { GeminiService } from "@/lib/gemini";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";

export async function POST(request: NextRequest) {
  console.log("🔍 Generate Description API called");

  const session = await getServerSession(authOptions);
  if (!session) {
    console.error("❌ Unauthorized access to generate-description API");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("✅ User authenticated:", session.user.email);

  try {
    const { content, userContext } = await request.json();
    console.log("📄 Content received, length:", content?.length || 0);
    console.log("👤 User context:", userContext);

    if (!content) {
      console.error("❌ No content provided");
      return NextResponse.json(
        {
          error: "Content is required",
          userMessage: "Please provide document content to generate description.",
          details: null,
        },
        { status: 400 }
      );
    }

    console.log("🚀 Calling GeminiService.generateContentDescription...");
    const description = await GeminiService.generateContentDescription(content, userContext);
    console.log("✅ Content description generated successfully");

    return NextResponse.json({ description });
  } catch (error) {
    console.error("💥 Error in generate-description API:", error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return NextResponse.json(
      {
        error: "Failed to generate content description",
        userMessage: errorMessage,
        details: error instanceof Error ? error.stack : null,
      },
      { status: 500 }
    );
  }
}
