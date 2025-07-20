import * as pdfjsLib from "pdfjs-dist";

// Set the workerSrc to the CDN version for compatibility with Netlify/Next.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

export async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    // Fallback for types if needed
    const items = content.items as any[]; // pdfjsLib.TextItem[] may not be available
    text += items.map((item: any) => item.str).join(" ") + "\n";
  }
  return text;
}
