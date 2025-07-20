import { NextRequest, NextResponse } from "next/server";
import { GeminiService } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const { content, subject } = await request.json();

    if (!content || !subject) {
      return NextResponse.json(
        { error: "Content and subject are required" },
        { status: 400 }
      );
    }

    const topics = await GeminiService.processContent(content, subject);

    return NextResponse.json({ topics });
  } catch (error) {
    console.error("Error processing content:", error);
    return NextResponse.json(
      { error: "Failed to process content" },
      { status: 500 }
    );
  }
}
