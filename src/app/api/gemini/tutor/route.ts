import { NextRequest, NextResponse } from "next/server";
import { GeminiService } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch (parseErr) {
      console.error(
        "[Gemini Tutor] Failed to parse request body:",
        body,
        parseErr
      );
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }
    const { message, context, conversationHistory = [] } = parsed;

    if (!message) {
      console.error("[Gemini Tutor] Missing message in request:", parsed);
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    try {
      const response = await GeminiService.tutorConversation(
        message,
        context,
        conversationHistory
      );
      return NextResponse.json({ response });
    } catch (geminiErr: any) {
      console.error("[Gemini Tutor] GeminiService error:", geminiErr);
      return NextResponse.json(
        {
          error: "Failed to get tutor response",
          userMessage:
            geminiErr?.message ||
            "AI Tutor is currently unavailable. Please try again later.",
          details: geminiErr?.stack || String(geminiErr),
        },
        { status: 500 }
      );
    }
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

    console.error("Error in tutor conversation:", error);
    return NextResponse.json(
      {
        error: "Failed to get tutor response",
        userMessage: message,
        details,
      },
      { status: 500 }
    );
  }
}
