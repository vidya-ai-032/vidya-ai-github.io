import { NextRequest, NextResponse } from "next/server";
import { mkdirSync, writeFileSync } from "fs";
import { join, extname } from "path";

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "image/jpeg",
  "image/png",
];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type" },
        { status: 400 }
      );
    }
    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    // Ensure uploads directory exists
    const uploadDir = join(process.cwd(), "uploads");
    mkdirSync(uploadDir, { recursive: true });
    // Generate unique file name
    const ext = extname(file.name) || "";
    const fileName = `${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}${ext}`;
    const filePath = join(uploadDir, fileName);
    // Write file
    writeFileSync(filePath, buffer);
    return NextResponse.json({ success: true, fileName });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
