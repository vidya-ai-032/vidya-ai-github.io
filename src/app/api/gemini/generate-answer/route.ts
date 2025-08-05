import { NextRequest, NextResponse } from "next/server";
import { GeminiService } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json();
    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }
    // Use Gemini to generate a smart answer
    const prompt = `You are an expert teacher. Provide a clear, concise, and accurate answer to the following question. Do not include any explanations or extra text, just the answer itself.\n\nQuestion: ${question}\nAnswer:`;
    const model = GeminiService.getModel();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const answer = response.text().trim();
    return NextResponse.json({ answer });
  } catch (error: unknown) {
    console.error("Error generating answer:", error);
    return NextResponse.json(
      {
        error: "Failed to generate answer",
        userMessage:
          (error as Error)?.message ||
          "Could not generate answer. Please try again later.",
        details: (error as Error)?.stack || String(error),
      },
      { status: 500 }
    );
  }
}
