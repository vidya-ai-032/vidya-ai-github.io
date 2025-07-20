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
    } catch (geminiErr) {
      console.error("[Gemini Tutor] GeminiService error:", geminiErr);
      return NextResponse.json(
        { error: "Failed to get tutor response", details: String(geminiErr) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[Gemini Tutor] Unexpected error:", error);
    return NextResponse.json(
      { error: "Unexpected server error", details: String(error) },
      { status: 500 }
    );
  }
}
