import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  console.log("🔍 Test PDF Parse API called");

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "File must be a PDF" },
        { status: 400 }
      );
    }

    console.log("📄 PDF file received:", file.name, file.size);

    // Test dynamic import of pdf-parse
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      console.log("📖 Reading PDF buffer...");
      try {
        const pdfParse = (await import("pdf-parse")).default;
        console.log("✅ pdf-parse imported successfully");

        const data = await pdfParse(buffer);
        console.log(
          "✅ PDF parsed successfully, text length:",
          data.text?.length || 0
        );

        return NextResponse.json({
          success: true,
          textLength: data.text?.length || 0,
          textPreview:
            data.text?.substring(0, 200) + "..." || "No text extracted",
        });
      } catch (pdfError) {
        console.error("❌ PDF parsing error:", pdfError);
        return NextResponse.json({
          success: false,
          error: "PDF parsing failed",
          details:
            pdfError instanceof Error ? pdfError.message : "Unknown error",
        });
      }
    } catch (parseError) {
      console.error("❌ PDF parsing error:", parseError);
      return NextResponse.json(
        {
          error: "PDF parsing failed",
          details:
            parseError instanceof Error ? parseError.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("❌ Test PDF parse error:", error);
    return NextResponse.json(
      {
        error: "Test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
