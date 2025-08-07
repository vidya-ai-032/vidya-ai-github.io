import { NextRequest, NextResponse } from "next/server";
import { GeminiService } from "@/lib/gemini";
import fs from "fs/promises";
import path from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { content, summary, pdfFile, subject = "" } = body;

  let text = content;
  const usedSummary = summary;

  // If a PDF file is provided, extract its text
  if (pdfFile) {
    // Only allow PDF files
    if (!pdfFile.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Only PDF files are supported for teaching." },
        { status: 400 }
      );
    }
    const uploadsDir = path.join(process.cwd(), "uploads");
    const filePath = path.join(uploadsDir, pdfFile);
    try {
      const fileBuffer = await fs.readFile(filePath);
      // Use dynamic import for pdfjs-dist (avoid Next.js SSR issues)
      const pdfjsLib = await import("pdfjs-dist");

      // Configure PDF.js worker with improved setup
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;

      const pdf = await pdfjsLib.getDocument({ data: fileBuffer }).promise;
      let pdfText = "";

      console.log(`📄 PDF has ${pdf.numPages} pages`);

      for (let i = 1; i <= pdf.numPages; i++) {
        try {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items
            .map((item: { str: string }) => item.str || "")
            .join(" ");
          pdfText += pageText + "\n";

          console.log(`📄 Page ${i} extracted: ${pageText.length} characters`);
        } catch (pageError) {
          console.error(`❌ Error extracting page ${i}:`, pageError);
          // Continue with other pages
        }
      }

      // Clean the extracted text
      text = pdfText
        .trim()
        .replace(/\s+/g, " ")
        .replace(/\n\s*\n/g, "\n")
        .replace(/[^\w\s\.\,\;\:\!\?\-\(\)\[\]\{\}]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      console.log(`✅ PDF text extraction completed, length: ${text.length}`);
    } catch (_err: unknown) {
      return NextResponse.json(
        { error: "Failed to extract PDF text." },
        { status: 500 }
      );
    }
  }

  // If only summary is provided, use it; otherwise, generate summary from content
  let summaryResult = null;
  try {
    if (text) {
      const topics = await GeminiService.processContent(text, subject);
      if (topics && topics.length > 0) {
        summaryResult = {
          summary: topics.map((t) => t.summary).join(" "),
          mainPoints: topics.flatMap((t) => t.keyPoints),
          correlatedQuestions: topics.flatMap((t) =>
            t.keyPoints.map((kp) => `Would you like to know more about: ${kp}?`)
          ),
        };
      }
    } else if (usedSummary) {
      summaryResult = {
        summary: usedSummary,
        mainPoints: [],
        correlatedQuestions: [
          "Would you like to know more about this topic?",
          "Can I explain any point further?",
        ],
      };
    } else {
      return NextResponse.json(
        { error: "No content, summary, or PDF file provided." },
        { status: 400 }
      );
    }
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

    console.error("Error in tutor teach:", error);
    return NextResponse.json(
      {
        error: "Failed to get tutor teach response",
        userMessage: message,
        details,
      },
      { status: 500 }
    );
  }

  return NextResponse.json(summaryResult);
}
