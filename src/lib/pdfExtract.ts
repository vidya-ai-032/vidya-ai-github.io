import * as pdfjsLib from "pdfjs-dist";

// Define a minimal TextItem type if not available from pdfjs-dist
// (for strict TypeScript, you may want to install @types/pdfjs-dist)
type TextItem = { str: string };

// Set the workerSrc to the CDN version for compatibility with Netlify/Next.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

export async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const items = content.items as TextItem[];
    text += items.map((item) => item.str).join(" ") + "\n";
  }
  return text;
}
