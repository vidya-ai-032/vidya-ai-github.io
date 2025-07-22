import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(req: NextRequest) {
  const uploadsDir = path.join(process.cwd(), "uploads");
  try {
    const files = await fs.readdir(uploadsDir);
    // Only return PDF files
    const pdfs = files.filter((f) => f.endsWith(".pdf"));
    return NextResponse.json({ files: pdfs });
  } catch (err) {
    return NextResponse.json({ files: [] });
  }
}
