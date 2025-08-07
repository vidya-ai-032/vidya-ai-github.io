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

    if (!content.trim()) {
      console.error("❌ Content is empty or only whitespace");
      return NextResponse.json(
        {
          error: "Content is empty",
          userMessage:
            "The document content is empty. Please upload a document with readable content.",
          details: null,
        },
        { status: 400 }
      );
    }

    // Check if Gemini API key is available
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      console.error("❌ Gemini API key not configured");
      return NextResponse.json(
        {
          error: "Gemini API not configured",
          userMessage: "AI analysis is not available. Please contact support.",
          details: "GOOGLE_GEMINI_API_KEY environment variable is missing",
        },
        { status: 500 }
      );
    }

    console.log("🚀 Calling GeminiService.analyzeDocument...");
    const analysis = await GeminiService.analyzeDocument(content, filename);
    console.log("✅ Document analysis completed successfully");

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("💥 Error in analyze-document API:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);

    // Provide more specific error messages
    if (errorMessage.includes("API key")) {
      return NextResponse.json(
        {
          error: "Gemini API key error",
          userMessage:
            "AI analysis is not available due to configuration issues. Please contact support.",
          details: errorMessage,
        },
        { status: 500 }
      );
    } else if (errorMessage.includes("quota")) {
      return NextResponse.json(
        {
          error: "Gemini API quota exceeded",
          userMessage:
            "AI analysis quota has been exceeded. Please try again later.",
          details: errorMessage,
        },
        { status: 429 }
      );
    } else if (errorMessage.includes("timeout")) {
      return NextResponse.json(
        {
          error: "Analysis timeout",
          userMessage:
            "Analysis took too long. Please try again with a shorter document.",
          details: errorMessage,
        },
        { status: 408 }
      );
    }

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
