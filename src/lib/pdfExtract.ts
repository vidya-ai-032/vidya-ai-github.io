import * as pdfjsLib from "pdfjs-dist";

// Define a minimal TextItem type if not available from pdfjs-dist
// (for strict TypeScript, you may want to install @types/pdfjs-dist)
type TextItem = { str: string };

// Set the workerSrc to the CDN version for compatibility with Netlify/Next.js
// Using the improved worker configuration from the provided code
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;

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

export async function extractPdfText(file: File): Promise<string> {
  try {
    console.log(`🔍 Starting PDF text extraction for: ${file.name}`);

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    console.log(`📄 PDF has ${pdf.numPages} pages`);

    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const items = content.items as TextItem[];
        const pageText = items.map((item) => item.str || "").join(" ");
        text += pageText + "\n";

        console.log(`📄 Page ${i} extracted: ${pageText.length} characters`);
      } catch (pageError) {
        console.error(`❌ Error extracting page ${i}:`, pageError);
        // Continue with other pages
      }
    }

    const cleanText = cleanTextContent(text);
    console.log(
      `✅ PDF text extraction completed, length: ${cleanText.length}`
    );

    return cleanText;
  } catch (error) {
    console.error("Error extracting PDF text:", error);
    throw new Error("Failed to extract text from PDF");
  }
}
