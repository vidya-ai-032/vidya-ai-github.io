import { NextRequest, NextResponse } from "next/server";
import { GeminiService } from "@/lib/gemini";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const { question, context, conversationHistory = [] } = body;
  if (!question || !context) {
    return NextResponse.json(
      { error: "Missing question or context." },
      { status: 400 }
    );
  }
  try {
    const aiRes = await GeminiService.tutorConversation(
      question,
      context,
      conversationHistory
    );
    if (aiRes.fallback) {
      return NextResponse.json({
        ...aiRes,
        warning: "AI returned a plain answer instead of structured JSON.",
      });
    }
    return NextResponse.json(aiRes);
  } catch (error: unknown) {
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

    console.error("Error in tutor followup:", error);
    return NextResponse.json(
      {
        error: "Failed to get tutor followup response",
        userMessage: message,
        details,
      },
      { status: 500 }
    );
  }
}
