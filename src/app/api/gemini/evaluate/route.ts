import { NextRequest, NextResponse } from "next/server";
import { GeminiService } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const { question, correctAnswer, studentAnswer, questionType } =
      await request.json();
    if (!question || studentAnswer === undefined) {
      return NextResponse.json(
        { error: "Question and student answer are required" },
        { status: 400 }
      );
    }
    // Use Gemini to provide intelligent, constructive feedback
    const prompt = `You are an expert teacher. Evaluate the student's answer to the following question. If the answer is incomplete, incorrect, or 'I don't know', provide constructive, actionable, and encouraging feedback on how the student can improve their answer. Be specific and suggest what concepts or details to include.\n\nQuestion: ${question}\nStudent's Answer: ${studentAnswer}\n${
      correctAnswer ? `Reference Answer: ${correctAnswer}\n` : ""
    }Feedback:`;
    const model = GeminiService.getModel();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const feedback = response.text();
    return NextResponse.json({ evaluation: { feedback } });
  } catch (error: any) {
    console.error("Error generating evaluation feedback:", error);
    return NextResponse.json(
      {
        error: "Failed to evaluate answer",
        userMessage:
          error?.message ||
          "Could not evaluate your answer. Please try again later.",
        details: error?.stack || String(error),
      },
      { status: 500 }
    );
  }
}
