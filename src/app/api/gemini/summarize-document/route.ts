import { NextRequest, NextResponse } from "next/server";
import { GeminiService } from "@/lib/gemini";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";

export async function POST(request: NextRequest) {
  console.log("🔍 Summarize Document API called");

  const session = await getServerSession(authOptions);
  if (!session) {
    console.error("❌ Unauthorized access to summarize-document API");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("✅ User authenticated:", session.user.email);

  try {
    const { content, academicLevel } = await request.json();
    console.log("📄 Content received, length:", content?.length || 0);
    console.log("🎓 Academic level:", academicLevel);

    if (!content) {
      console.error("❌ No content provided");
      return NextResponse.json(
        {
          error: "Content is required",
          userMessage: "Please provide document content to generate summary.",
          details: null,
        },
        { status: 400 }
      );
    }

    console.log("🚀 Calling GeminiService.summarizeDocument...");
    const summary = await GeminiService.summarizeDocument(
      content,
      academicLevel
    );
    console.log("✅ Document summary generated successfully");

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("💥 Error in summarize-document API:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        error: "Failed to summarize document",
        userMessage: errorMessage,
        details: error instanceof Error ? error.stack : null,
      },
      { status: 500 }
    );
  }
}

