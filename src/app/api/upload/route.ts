import { NextRequest, NextResponse } from "next/server";
import { mkdirSync, writeFileSync, readFileSync } from "fs";
import { join, extname } from "path";
import { GeminiService } from "@/lib/gemini";

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "image/jpeg",
  "image/png",
];

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

// Helper function to detect file type more robustly
function detectFileType(fileName: string, mimeType: string): string {
  const extension = fileName.toLowerCase().split(".").pop() || "";

  // Map common extensions to MIME types
  const extensionToMimeType: { [key: string]: string } = {
    pdf: "application/pdf",
    txt: "text/plain",
    md: "text/plain",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    doc: "application/msword",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    bmp: "image/bmp",
  };

  // Use MIME type if available, otherwise fall back to extension
  if (mimeType && mimeType !== "application/octet-stream") {
    return mimeType;
  }

  return extensionToMimeType[extension] || mimeType;
}

// Helper function to validate extracted content
function validateExtractedContent(content: string): boolean {
  if (!content || content.trim().length === 0) {
    return false;
  }

  // Check if content is too short (likely not meaningful)
  if (content.trim().length < 10) {
    return false;
  }

  // Check if content contains mostly special characters or numbers
  const textOnly = content.replace(/[^a-zA-Z\s]/g, "");
  if (textOnly.trim().length < content.length * 0.3) {
    return false;
  }

  return true;
}

// Helper function to clean and normalize text content
function cleanTextContent(text: string): string {
  if (!text) return "";

  return text
    .trim()
    .replace(/\s+/g, " ") // Replace multiple whitespace with single space
    .replace(/\n\s*\n/g, "\n") // Remove empty lines
    .replace(/[^\w\s\.\,\;\:\!\?\-\(\)\[\]\{\}]/g, " ") // Keep only readable characters
    .replace(/\s+/g, " ") // Clean up any remaining multiple spaces
    .trim();
}

// Helper function to extract text from different file types
async function extractTextFromFile(
  buffer: Buffer,
  fileType: string,
  fileName: string
): Promise<{ text: string; method: string; error?: string }> {
  try {
    console.log(`🔍 Starting text extraction for: ${fileName} (${fileType})`);

    if (
      fileType === "application/pdf" ||
      fileName.toLowerCase().endsWith(".pdf")
    ) {
      console.log("📄 Processing PDF file...");

      // Method 1: Try pdf-parse first
      try {
        const pdfParse = (await import("pdf-parse")).default;
        const data = await pdfParse(buffer);

        if (data && data.text && data.text.trim().length > 0) {
          const cleanText = cleanTextContent(data.text);
          if (validateExtractedContent(cleanText)) {
            console.log(
              `✅ PDF text extraction successful with pdf-parse, length: ${cleanText.length}`
            );
            return { text: cleanText, method: "pdf-parse" };
          }
        }
      } catch (pdfError) {
        console.warn("pdf-parse failed:", pdfError);
      }

      // Method 2: Try pdfjs-dist as fallback
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;

        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
        let fullText = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          try {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
              .map((item: any) => item.str || "")
              .join(" ");
            fullText += pageText + "\n";
          } catch (pageError) {
            console.error(`❌ Error extracting page ${i}:`, pageError);
          }
        }

        const cleanText = cleanTextContent(fullText);
        if (validateExtractedContent(cleanText)) {
          console.log(
            `✅ PDF text extraction successful with pdfjs, length: ${cleanText.length}`
          );
          return { text: cleanText, method: "pdfjs" };
        }
      } catch (pdfjsError) {
        console.error("PDF.js parsing failed:", pdfjsError);
        return { text: "", method: "none", error: pdfjsError.message };
      }
    } else if (
      fileType === "text/plain" ||
      fileName.toLowerCase().endsWith(".txt")
    ) {
      console.log("📝 Processing text file...");
      const text = buffer.toString("utf-8");
      const cleanText = cleanTextContent(text);
      if (validateExtractedContent(cleanText)) {
        return { text: cleanText, method: "text" };
      }
    }

    return {
      text: "",
      method: "none",
      error: "Unsupported file type or no content extracted",
    };
  } catch (error) {
    console.error("Error extracting text from file:", error);
    return {
      text: "",
      method: "none",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Enhanced validation function
function validateExtractedContent(content: string): boolean {
  if (!content || content.trim().length === 0) {
    return false;
  }

  // Check if content is too short (likely not meaningful)
  if (content.trim().length < 20) {
    return false;
  }

  // Check if content contains mostly special characters or numbers
  const textOnly = content.replace(/[^a-zA-Z\s]/g, "");
  if (textOnly.trim().length < content.length * 0.2) {
    return false;
  }

  // Check for common error messages
  const errorPatterns = [
    "text extraction failed",
    "word document parsing not implemented",
    "image ocr not implemented",
    "unsupported file type",
  ];

  const lowerContent = content.toLowerCase();
  if (errorPatterns.some((pattern) => lowerContent.includes(pattern))) {
    return false;
  }

  return true;
}

export async function POST(request: NextRequest) {
  console.log("🔍 Upload API called");

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const email = formData.get("email") as string | null;

    console.log("📄 File received:", file?.name, file?.type, file?.size);
    console.log("📧 Email received:", email);

    if (!file) {
      console.error("❌ No file uploaded");
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!email) {
      console.error("❌ No email provided");
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Use improved file type detection
    const detectedType = detectFileType(file.name, file.type);
    console.log(
      `🔍 File type detection: original=${file.type}, detected=${detectedType}`
    );

    if (!ACCEPTED_TYPES.includes(detectedType)) {
      console.error("❌ Unsupported file type:", detectedType);
      return NextResponse.json(
        {
          error:
            "Unsupported file type. Please upload PDF, DOCX, TXT, or image files.",
        },
        { status: 400 }
      );
    }

    console.log("✅ File type accepted:", detectedType);

    // Read file buffer
    console.log("📖 Reading file buffer...");
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log("✅ File buffer read, size:", buffer.length);

    if (buffer.length > MAX_FILE_SIZE) {
      console.error("❌ File too large:", buffer.length, ">", MAX_FILE_SIZE);
      return NextResponse.json(
        { error: "File is too large. Maximum allowed size is 15MB." },
        { status: 400 }
      );
    }

    // Ensure uploads directory exists
    const uploadDir = join(process.cwd(), "uploads");
    console.log("📁 Creating upload directory:", uploadDir);
    mkdirSync(uploadDir, { recursive: true });
    console.log("✅ Upload directory created/verified");

    // Generate unique file name
    const ext = extname(file.name) || "";
    const fileName = `${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}${ext}`;
    const filePath = join(uploadDir, fileName);
    console.log("📝 Writing file:", filePath);

    // Write file
    writeFileSync(filePath, buffer);
    console.log("✅ File written successfully");

    // Extract text from the file
    console.log("🔍 Extracting text from file...");
    let extractedText = "";
    let textExtractionError = null;

    try {
      const { text, method, error } = await extractTextFromFile(
        buffer,
        detectedType,
        file.name
      );
      extractedText = text;
      if (error) {
        textExtractionError = error;
      }
      console.log(
        "✅ Text extraction successful, length:",
        extractedText.length
      );
    } catch (error) {
      console.error("❌ Text extraction failed:", error);
      textExtractionError = error;
      // Continue with upload even if text extraction fails
    }

    // Analyze the document if text was extracted
    let analysis = null;
    let description = null;
    let analysisError = null;

    // Check if text extraction actually succeeded and content is valid
    const isTextExtractionSuccessful =
      extractedText &&
      extractedText.trim().length > 0 &&
      !extractedText.includes("Text extraction failed") &&
      !extractedText.includes("Word document content") &&
      !extractedText.includes("Image content") &&
      validateExtractedContent(extractedText);

    if (isTextExtractionSuccessful) {
      console.log("🔍 Analyzing document...");
      console.log(
        "📄 Content preview:",
        extractedText.substring(0, 200) + "..."
      );

      // Check if Gemini API key is available
      if (!process.env.GOOGLE_GEMINI_API_KEY) {
        console.error("❌ Gemini API key not found, using fallback analysis");
        analysisError = new Error("Gemini API key not configured");
        const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        analysis = {
          topic: fileNameWithoutExt,
          subject: "General",
          level: "general",
          documentTitle: file.name,
          chapterSection: fileNameWithoutExt,
          confidenceScore: 5,
        };
        description = {
          subject: "General",
          chapter: fileNameWithoutExt,
          level: "general",
          document_name: file.name,
          description:
            "Document uploaded successfully. AI analysis requires API key configuration.",
          auto_generated: ["subject", "chapter", "level"],
          date_created: new Date().toISOString(),
        };
      } else {
        try {
          // Perform document analysis with timeout
          console.log("📊 Performing document analysis...");
          const analysisPromise = GeminiService.analyzeDocument(
            extractedText,
            file.name
          );

          // Add timeout to prevent hanging
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Analysis timeout")), 30000)
          );

          analysis = await Promise.race([analysisPromise, timeoutPromise]);
          console.log("✅ Document analysis successful:", analysis?.subject);

          // Generate content description with timeout
          console.log("📝 Generating content description...");
          const descriptionPromise = GeminiService.generateContentDescription(
            extractedText,
            {
              subject: analysis.subject,
              level: analysis.level,
              chapterInfo: analysis.chapterSection,
            }
          );

          const descriptionTimeoutPromise = new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Description generation timeout")),
              30000
            )
          );

          description = await Promise.race([
            descriptionPromise,
            descriptionTimeoutPromise,
          ]);
          console.log("✅ Content description generated");
        } catch (error) {
          console.error("❌ Document analysis failed:", error);
          analysisError = error;

          // Provide fallback analysis data
          const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, ""); // Remove file extension
          analysis = {
            topic: fileNameWithoutExt,
            subject: "General",
            level: "general",
            documentTitle: file.name,
            chapterSection: fileNameWithoutExt,
            confidenceScore: 5,
          };

          description = {
            subject: "General",
            chapter: fileNameWithoutExt,
            level: "general",
            document_name: file.name,
            description:
              "Document uploaded successfully. Content analysis will be available once processing is complete.",
            auto_generated: ["subject", "chapter", "level"],
            date_created: new Date().toISOString(),
          };
        }
      }
    } else {
      console.log("⚠️ No text extracted, providing fallback analysis");
      // Provide fallback analysis data when text extraction fails
      const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      analysis = {
        topic: fileNameWithoutExt,
        subject: "General",
        level: "general",
        documentTitle: file.name,
        chapterSection: fileNameWithoutExt,
        confidenceScore: 3,
      };

      description = {
        subject: "General",
        chapter: fileNameWithoutExt,
        level: "general",
        document_name: file.name,
        description:
          "Document uploaded successfully. Content analysis will be available once processing is complete.",
        auto_generated: ["subject", "chapter", "level"],
        date_created: new Date().toISOString(),
      };
    }

    console.log("✅ Upload completed successfully");
    console.log("📄 Final content length:", extractedText.length);
    console.log("📄 Content preview:", extractedText.substring(0, 100) + "...");
    console.log(
      "📄 Text extraction status:",
      isTextExtractionSuccessful ? "success" : "failed"
    );

    return NextResponse.json({
      success: true,
      fileName,
      content: extractedText,
      analysis,
      description,
      textExtractionStatus: isTextExtractionSuccessful ? "success" : "failed",
      analysisStatus: analysisError ? "failed" : "success",
      errors: {
        textExtraction: textExtractionError
          ? textExtractionError.message
          : null,
        analysis: analysisError ? analysisError.message : null,
      },
      message: isTextExtractionSuccessful
        ? "Document uploaded and analyzed successfully"
        : "Document uploaded successfully. Text extraction failed, using fallback analysis.",
    });
  } catch (error) {
    console.error("❌ Upload error:", error);
    return NextResponse.json(
      {
        error: "Failed to upload file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
