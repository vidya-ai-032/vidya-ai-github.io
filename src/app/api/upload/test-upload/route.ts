import { NextRequest, NextResponse } from "next/server";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

export async function POST(request: NextRequest) {
  console.log("🔍 Test Upload API called");

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

    // Test file system operations
    try {
      const uploadDir = join(process.cwd(), "uploads");
      console.log("📁 Creating upload directory:", uploadDir);
      mkdirSync(uploadDir, { recursive: true });
      console.log("✅ Upload directory created/verified");

      // Test file writing
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const testFileName = `test_${Date.now()}.txt`;
      const testFilePath = join(uploadDir, testFileName);

      console.log("📝 Writing test file:", testFilePath);
      writeFileSync(testFilePath, buffer);
      console.log("✅ Test file written successfully");

      return NextResponse.json({
        success: true,
        message: "Upload test successful",
        fileName: testFileName,
        fileSize: buffer.length,
        uploadDir: uploadDir,
      });
    } catch (fsError) {
      console.error("❌ File system error:", fsError);
      return NextResponse.json(
        {
          error: "File system error",
          details: fsError instanceof Error ? fsError.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("❌ Test upload error:", error);
    return NextResponse.json(
      {
        error: "Test upload failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

