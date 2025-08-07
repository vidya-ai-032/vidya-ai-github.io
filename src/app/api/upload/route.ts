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

// Helper function to extract text from different file types
async function extractTextFromFile(
  buffer: Buffer,
  fileType: string,
  fileName: string
): Promise<string> {
  try {
    if (fileType === "application/pdf") {
      // Use pdf-parse with proper error handling
      try {
        const pdfParse = (await import("pdf-parse")).default;
        const data = await pdfParse(buffer);

        // Check if we got meaningful text content
        if (data && data.text && data.text.trim().length > 0) {
          const cleanText = data.text.trim().replace(/\s+/g, " ");
          console.log(
            "✅ PDF text extraction successful, length:",
            cleanText.length
          );
          return cleanText;
        } else {
          console.log("⚠️ PDF parsed but no text content found");
          return "";
        }
      } catch (pdfError) {
        console.error("PDF parsing error:", pdfError);

        // Try alternative PDF parsing method
        try {
          const pdfjsLib = await import("pdfjs-dist");
          const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
          let fullText = "";

          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
              .map((item: any) => item.str)
              .join(" ");
            fullText += pageText + "\n";
          }

          const cleanText = fullText.trim().replace(/\s+/g, " ");
          if (cleanText.length > 0) {
            console.log(
              "✅ PDF text extraction successful with pdfjs, length:",
              cleanText.length
            );
            return cleanText;
          } else {
            console.log("⚠️ PDF parsed with pdfjs but no text content found");
            return "";
          }
        } catch (pdfjsError) {
          console.error("PDF.js parsing also failed:", pdfjsError);
          return "";
        }
      }
    } else if (fileType === "text/plain") {
      const text = buffer.toString("utf-8");
      const cleanText = text.trim().replace(/\s+/g, " ");
      console.log(
        "✅ Text file extraction successful, length:",
        cleanText.length
      );
      return cleanText;
    } else if (fileType.includes("wordprocessingml.document")) {
      // For Word documents, we'll need to implement DOCX parsing
      console.log("⚠️ Word document parsing not implemented yet");
      return "";
    } else if (fileType.startsWith("image/")) {
      // For images, we'll need OCR implementation
      console.log("⚠️ Image OCR not implemented yet");
      return "";
    }
    return "";
  } catch (error) {
    console.error("Error extracting text from file:", error);
    // Don't throw error, just return empty string to allow upload to continue
    return "";
  }
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

    if (!ACCEPTED_TYPES.includes(file.type)) {
      console.error("❌ Unsupported file type:", file.type);
      return NextResponse.json(
        { error: "Unsupported file type" },
        { status: 400 }
      );
    }

    console.log("✅ File type accepted:", file.type);

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
      extractedText = await extractTextFromFile(buffer, file.type, file.name);
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
