import * as pdfjsLib from "pdfjs-dist";

// Improved worker configuration with fallback
function configurePdfWorker() {
  try {
    // Try CDN first
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;
  } catch (error) {
    console.warn("CDN worker failed, using local worker");
    // Fallback to local worker if available
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
  }
}

configurePdfWorker();

// Enhanced text extraction with better error handling
export async function extractPdfText(file: File): Promise<string> {
  try {
    console.log(`🔍 Starting PDF text extraction for: ${file.name}`);

    const arrayBuffer = await file.arrayBuffer();

    // Method 1: Try pdf-parse first (faster for simple PDFs)
    try {
      const pdfParse = (await import("pdf-parse")).default;
      const data = await pdfParse(Buffer.from(arrayBuffer));

      if (data && data.text && data.text.trim().length > 0) {
        const cleanText = cleanTextContent(data.text);
        console.log(
          `✅ PDF text extraction successful with pdf-parse, length: ${cleanText.length}`
        );
        return cleanText;
      }
    } catch (pdfError) {
      console.warn("pdf-parse failed, trying pdfjs:", pdfError);
    }

    // Method 2: Try pdfjs-dist as fallback
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
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
      } catch (pageError) {
        console.error(`❌ Error extracting page ${i}:`, pageError);
        // Continue with other pages
      }
    }

    const cleanText = cleanTextContent(fullText);
    if (cleanText.length > 0) {
      console.log(
        `✅ PDF text extraction successful with pdfjs, length: ${cleanText.length}`
      );
      return cleanText;
    }

    throw new Error("No text content could be extracted from PDF");
  } catch (error) {
    console.error("Error extracting PDF text:", error);
    throw new Error(
      `Failed to extract text from PDF: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// Enhanced text cleaning function
function cleanTextContent(text: string): string {
  if (!text) return "";

  return text
    .trim()
    .replace(/\s+/g, " ") // Replace multiple whitespace with single space
    .replace(/\n\s*\n/g, "\n") // Remove empty lines
    .replace(
      /[^\w\s\.\,\;\:\!\?\-\(\)\[\]\{\}\-\+\=\*\/\@\#\$\%\&\*\(\)]/g,
      " "
    ) // Keep more readable characters
    .replace(/\s+/g, " ") // Clean up any remaining multiple spaces
    .trim();
}
