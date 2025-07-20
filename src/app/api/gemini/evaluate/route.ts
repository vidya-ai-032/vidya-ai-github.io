import { NextRequest, NextResponse } from "next/server";
import { GeminiService } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const { question, correctAnswer, studentAnswer, questionType } =
      await request.json();

    if (!question || !correctAnswer || !studentAnswer || !questionType) {
      return NextResponse.json(
        {
          error:
            "Question, correct answer, student answer, and question type are required",
        },
        { status: 400 }
      );
    }

    const evaluation = await GeminiService.evaluateAnswer(
      question,
      correctAnswer,
      studentAnswer,
      questionType
    );

    return NextResponse.json({ evaluation });
  } catch (error) {
    console.error("Error evaluating answer:", error);
    return NextResponse.json(
      { error: "Failed to evaluate answer" },
      { status: 500 }
    );
  }
}
