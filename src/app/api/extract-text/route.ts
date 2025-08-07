import { NextRequest, NextResponse } from "next/server";
import { IncomingForm, File, Fields, Files } from "formidable";
import fs from "fs";
import {
  validateExtractedContent,
  cleanTextContent,
} from "../../../lib/textUtils";

export async function POST(request: NextRequest) {
  console.log("🔍 Extract Text API called");

  try {
    // Use formidable for robust file parsing
    const form = new IncomingForm({
      maxFileSize: 15 * 1024 * 1024, // 15MB
      keepExtensions: true,
      multiples: false,
    });

    return new Promise<NextResponse>((resolve) => {
      form.parse(
        request as any,
        async (err: unknown, fields: Fields, files: Files) => {
          if (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            console.error("❌ Formidable error:", err);
            resolve(
              NextResponse.json(
                {
                  error: "File upload error",
                  details: errorMsg,
                  userMessage:
                    "Failed to process uploaded file. Please try again.",
                },
                { status: 400 }
              )
            );
            return;
          }

          let file = files.file as File | File[] | undefined;
          if (Array.isArray(file)) file = file[0];

          if (!file || !file.filepath) {
            console.error("❌ No file uploaded");
            resolve(
              NextResponse.json(
                {
                  error: "No file uploaded",
                  userMessage: "Please select a file to upload.",
                },
                { status: 400 }
              )
            );
            return;
          }

          try {
            console.log(
              "📄 Processing file:",
              file.originalFilename,
              file.mimetype
            );

            // Read file buffer
            const buffer = fs.readFileSync(file.filepath);
            console.log("✅ File read, size:", buffer.length);

            // Determine file type
            const fileName = file.originalFilename || "unknown";
            const fileType = file.mimetype || "application/octet-stream";

            // Extract text based on file type
            const extractionResult = await extractTextFromFile(
              buffer,
              fileType,
              fileName
            );

            if (extractionResult.success) {
              console.log(
                "✅ Text extraction successful, length:",
                extractionResult.text.length
              );
              resolve(
                NextResponse.json({
                  success: true,
                  text: extractionResult.text,
                  method: extractionResult.method,
                  fileName: fileName,
                  fileSize: buffer.length,
                  textLength: extractionResult.text.length,
                })
              );
            } else {
              console.error(
                "❌ Text extraction failed:",
                extractionResult.error
              );
              resolve(
                NextResponse.json(
                  {
                    error: "Text extraction failed",
                    details: extractionResult.error,
                    userMessage:
                      "Unable to extract text from this file. Please ensure it's a readable PDF, DOCX, or text file.",
                  },
                  { status: 422 }
                )
              );
            }
          } catch (extractionError) {
            console.error("❌ Error during text extraction:", extractionError);
            resolve(
              NextResponse.json(
                {
                  error: "Text extraction error",
                  details:
                    extractionError instanceof Error
                      ? extractionError.message
                      : "Unknown error",
                  userMessage:
                    "An error occurred while processing your file. Please try again.",
                },
                { status: 500 }
              )
            );
          }
        }
      );
    });
  } catch (error) {
    console.error("❌ Extract text API error:", error);
    return NextResponse.json(
      {
        error: "Failed to extract text",
        details: error instanceof Error ? error.message : "Unknown error",
        userMessage: "Server error occurred. Please try again later.",
      },
      { status: 500 }
    );
  }
}

// Enhanced text extraction function
async function extractTextFromFile(
  buffer: Buffer,
  fileType: string,
  fileName: string
): Promise<{ success: boolean; text: string; method: string; error?: string }> {
  try {
    console.log(`🔍 Starting text extraction for: ${fileName} (${fileType})`);

    // PDF Processing
    if (
      fileType === "application/pdf" ||
      fileName.toLowerCase().endsWith(".pdf")
    ) {
      console.log("📄 Processing PDF file...");

      // Primary method: pdf-parse
      try {
        const pdfParse = (await import("pdf-parse")).default;
        const data = await pdfParse(buffer);

        if (data && data.text && data.text.trim().length > 0) {
          const cleanText = cleanTextContent(data.text);
          if (validateExtractedContent(cleanText)) {
            console.log(
              `✅ PDF text extraction successful with pdf-parse, length: ${cleanText.length}`
            );
            return { success: true, text: cleanText, method: "pdf-parse" };
          } else {
            console.warn("⚠️ PDF parsed but content validation failed");
          }
        } else {
          console.warn("⚠️ PDF parsed but no text content found");
        }
      } catch (pdfError) {
        console.warn("pdf-parse failed, trying pdfjs:", pdfError);
      }

      // Fallback method: pdfjs-dist
      try {
        const pdfjsLib = await import("pdfjs-dist");
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
            console.log(
              `📄 Page ${i} extracted: ${pageText.length} characters`
            );
          } catch (pageError) {
            console.error(`❌ Error extracting page ${i}:`, pageError);
          }
        }

        const cleanText = cleanTextContent(fullText);
        if (validateExtractedContent(cleanText)) {
          console.log(
            `✅ PDF text extraction successful with pdfjs, length: ${cleanText.length}`
          );
          return { success: true, text: cleanText, method: "pdfjs" };
        } else {
          console.warn(
            "⚠️ PDF parsed with pdfjs but content validation failed"
          );
        }
      } catch (pdfjsError) {
        console.error("PDF.js parsing failed:", pdfjsError);
        return {
          success: false,
          text: "",
          method: "none",
          error: `PDF parsing failed: ${
            pdfjsError instanceof Error ? pdfjsError.message : "Unknown error"
          }`,
        };
      }

      return {
        success: false,
        text: "",
        method: "none",
        error: "No readable text could be extracted from PDF",
      };
    }

    // Text file processing
    else if (
      fileType === "text/plain" ||
      fileName.toLowerCase().endsWith(".txt")
    ) {
      console.log("📝 Processing text file...");
      const text = buffer.toString("utf-8");
      const cleanText = cleanTextContent(text);

      if (validateExtractedContent(cleanText)) {
        console.log(
          `✅ Text file extraction successful, length: ${cleanText.length}`
        );
        return { success: true, text: cleanText, method: "text" };
      } else {
        return {
          success: false,
          text: "",
          method: "none",
          error: "Text file contains no readable content",
        };
      }
    }

    // Unsupported file type
    else {
      return {
        success: false,
        text: "",
        method: "none",
        error: `Unsupported file type: ${fileType}`,
      };
    }
  } catch (error) {
    console.error("Error extracting text from file:", error);
    return {
      success: false,
      text: "",
      method: "none",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
