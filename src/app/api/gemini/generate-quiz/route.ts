import { NextRequest, NextResponse } from "next/server";
import { GeminiService } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const { content, subject, quizType = "mcq" } = await request.json();

    if (!content || !subject) {
      return NextResponse.json(
        { error: "Content and subject are required" },
        { status: 400 }
      );
    }

    const quiz = await GeminiService.generateQuiz(content, subject, quizType);

    return NextResponse.json({ quiz });
  } catch (error) {
    console.error("Error generating quiz:", error);
    return NextResponse.json(
      { error: "Failed to generate quiz" },
      { status: 500 }
    );
  }
}
