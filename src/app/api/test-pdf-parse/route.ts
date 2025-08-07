import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

export async function POST(request: NextRequest) {
  try {
    const { fileName } = await request.json();

    if (!fileName) {
      return NextResponse.json(
        { error: "fileName is required" },
        { status: 400 }
      );
    }

    const filePath = join(process.cwd(), "uploads", fileName);
    console.log("Testing PDF parsing for:", filePath);

    // Read the file
    const buffer = readFileSync(filePath);
    console.log("File size:", buffer.length);

    // Test pdf-parse
    let pdfParseResult = null;
    let pdfParseError = null;
    try {
      const pdfParse = (await import("pdf-parse")).default;
      const data = await pdfParse(buffer);
      pdfParseResult = {
        textLength: data.text?.length || 0,
        numPages: data.numpages,
        info: data.info,
        textPreview: data.text?.substring(0, 200) || "No text",
      };
      console.log("✅ pdf-parse successful:", pdfParseResult);
    } catch (error) {
      pdfParseError = error instanceof Error ? error.message : String(error);
      console.error("❌ pdf-parse failed:", pdfParseError);
    }

    // Test pdfjs-dist
    let pdfjsResult = null;
    let pdfjsError = null;
    try {
      const pdfjsLib = await import("pdfjs-dist");

      // Configure PDF.js worker with improved setup
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;

      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      let fullText = "";

      console.log(`📄 PDF has ${pdf.numPages} pages`);

      for (let i = 1; i <= pdf.numPages; i++) {
        try {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str || "")
            .join(" ");
          fullText += pageText + "\n";

          console.log(`📄 Page ${i} extracted: ${pageText.length} characters`);
        } catch (pageError) {
          console.error(`❌ Error extracting page ${i}:`, pageError);
          // Continue with other pages
        }
      }

      // Clean the extracted text
      const cleanText = fullText
        .trim()
        .replace(/\s+/g, " ")
        .replace(/\n\s*\n/g, "\n")
        .replace(/[^\w\s\.\,\;\:\!\?\-\(\)\[\]\{\}]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      pdfjsResult = {
        textLength: cleanText.length,
        numPages: pdf.numPages,
        textPreview: cleanText.substring(0, 200) || "No text",
      };
      console.log("✅ pdfjs-dist successful:", pdfjsResult);
    } catch (error) {
      pdfjsError = error instanceof Error ? error.message : String(error);
      console.error("❌ pdfjs-dist failed:", pdfjsError);
    }

    return NextResponse.json({
      fileName,
      fileSize: buffer.length,
      pdfParse: {
        success: !pdfParseError,
        result: pdfParseResult,
        error: pdfParseError,
      },
      pdfjs: {
        success: !pdfjsError,
        result: pdfjsResult,
        error: pdfjsError,
      },
    });
  } catch (error) {
    console.error("Test PDF parse error:", error);
    return NextResponse.json(
      {
        error: "Failed to test PDF parsing",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
