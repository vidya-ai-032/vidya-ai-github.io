import { NextRequest, NextResponse } from "next/server";
import { GeminiService } from "@/lib/gemini";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { content, subject, quizType = "mcq" } = await request.json();

    if (!content || !subject) {
      return NextResponse.json(
        {
          error: "Content and subject are required",
          userMessage: "Please provide both content and subject.",
          details: null,
        },
        { status: 400 }
      );
    }

    const quiz = await GeminiService.generateQuiz(content, subject, quizType);

    return NextResponse.json({ quiz });
  } catch (error: any) {
    let message = "Unknown error";
    let details = null;

    if (error) {
      if (typeof error === "string") {
        message = error;
      } else if (error.message) {
        message = error.message;
      } else {
        message = JSON.stringify(error);
      }
      if (error.stack) {
        details = error.stack;
      } else {
        details = JSON.stringify(error);
      }
    }

    console.error("Error generating quiz:", error);
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
