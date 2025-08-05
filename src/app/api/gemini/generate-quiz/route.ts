import { NextRequest, NextResponse } from "next/server";
import { GeminiService } from "@/lib/gemini";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";

export async function POST(request: NextRequest) {
  console.log("🔍 Generate Quiz API called");

  const session = await getServerSession(authOptions);
  if (!session) {
    console.error("❌ Unauthorized access to generate-quiz API");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("✅ User authenticated:", session.user.email);

  try {
    const { content, subject, quizType } = await request.json();
    console.log("📄 Content received, length:", content?.length || 0);
    console.log("📚 Subject:", subject);
    console.log("🎯 Quiz type:", quizType);

    if (!content) {
      console.error("❌ No content provided");
      return NextResponse.json(
        {
          error: "Content is required",
          userMessage: "Please provide document content to generate quiz.",
          details: null,
        },
        { status: 400 }
      );
    }

    console.log("🚀 Calling GeminiService.generateQuiz...");
    const quiz = await GeminiService.generateQuiz(
      content,
      subject || "",
      quizType || "mcq"
    );
    console.log(
      "✅ Quiz generated successfully, questions count:",
      quiz?.questions?.length || 0
    );

    return NextResponse.json({ quiz });
  } catch (error: unknown) {
    console.error("💥 Error in generate-quiz API:", error);

    let message = "Unknown error";
    let details = null;

    if (error) {
      if (typeof error === "string") {
        message = error;
      } else if ((error as Error).message) {
        message = (error as Error).message;
      } else {
        message = JSON.stringify(error);
      }
      if ((error as Error).stack) {
        details = (error as Error).stack;
      } else {
        details = JSON.stringify(error);
      }
    }

    console.error("📋 Error details:", { message, details });
    return NextResponse.json(
      {
        error: "Failed to generate quiz",
        userMessage: message,
        details,
      },
      { status: 500 }
    );
  }
}
