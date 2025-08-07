import { NextRequest, NextResponse } from "next/server";
import { GeminiService } from "@/lib/gemini";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";

export async function POST(request: NextRequest) {
  console.log("🔍 Analyze Document API called");

  const session = await getServerSession(authOptions);
  if (!session) {
    console.error("❌ Unauthorized access to analyze-document API");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("✅ User authenticated:", session.user.email);

  try {
    const { content, filename } = await request.json();
    console.log("📄 Content received, length:", content?.length || 0);
    console.log("📁 Filename:", filename);

    if (!content) {
      console.error("❌ No content provided");
      return NextResponse.json(
        {
          error: "Content is required",
          userMessage: "Please provide document content to analyze.",
          details: null,
        },
        { status: 400 }
      );
    }

    console.log("🚀 Calling GeminiService.analyzeDocument...");
    const analysis = await GeminiService.analyzeDocument(content, filename);
    console.log("✅ Document analysis completed successfully");

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("💥 Error in analyze-document API:", error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return NextResponse.json(
      {
        error: "Failed to analyze document",
        userMessage: errorMessage,
        details: error instanceof Error ? error.stack : null,
      },
      { status: 500 }
    );
  }
}
