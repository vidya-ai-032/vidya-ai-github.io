// Enhanced validation function
export function validateExtractedContent(content: string): boolean {
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
    "no text content found",
    "failed to extract text",
  ];

  const lowerContent = content.toLowerCase();
  if (errorPatterns.some((pattern) => lowerContent.includes(pattern))) {
    return false;
  }

  return true;
}

// Enhanced text cleaning function
export function cleanTextContent(text: string): string {
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

// File type detection
export function detectFileType(fileName: string, mimeType: string): string {
  const extension = fileName.toLowerCase().split(".").pop() || "";

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

  if (mimeType && mimeType !== "application/octet-stream") {
    return mimeType;
  }

  return extensionToMimeType[extension] || mimeType;
}

// Content quality assessment
export function assessContentQuality(content: string): {
  score: number;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  if (!content || content.trim().length === 0) {
    return {
      score: 0,
      issues: ["No content found"],
      suggestions: ["Upload a file with readable text"],
    };
  }

  // Check content length
  if (content.trim().length < 50) {
    score -= 30;
    issues.push("Content is very short");
    suggestions.push("Upload a document with more content");
  } else if (content.trim().length < 200) {
    score -= 15;
    issues.push("Content is short");
    suggestions.push(
      "Consider uploading a longer document for better analysis"
    );
  }

  // Check text quality
  const textOnly = content.replace(/[^a-zA-Z\s]/g, "");
  const textRatio = textOnly.trim().length / content.length;

  if (textRatio < 0.3) {
    score -= 40;
    issues.push("Low text content ratio");
    suggestions.push("Upload a document with more readable text");
  } else if (textRatio < 0.5) {
    score -= 20;
    issues.push("Moderate text content ratio");
    suggestions.push("Document may contain many special characters or images");
  }

  // Check for common problems
  const lowerContent = content.toLowerCase();
  if (lowerContent.includes("text extraction failed")) {
    score -= 50;
    issues.push("Text extraction failed");
    suggestions.push(
      "Try uploading a different file format or a simpler document"
    );
  }

  if (lowerContent.includes("word document parsing not implemented")) {
    score -= 30;
    issues.push("Word document format not supported");
    suggestions.push("Convert to PDF or text format before uploading");
  }

  if (lowerContent.includes("image ocr not implemented")) {
    score -= 30;
    issues.push("Image OCR not supported");
    suggestions.push("Extract text from images before uploading");
  }

  return {
    score: Math.max(0, score),
    issues,
    suggestions,
  };
}
