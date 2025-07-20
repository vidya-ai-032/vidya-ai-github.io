import type { NextApiRequest, NextApiResponse } from "next";
import pdfParse from "pdf-parse";
import { IncomingForm, File, Fields, Files } from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false, // Disables Next.js body parsing to let formidable handle it
    sizeLimit: "4mb",
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    console.log("[extract-text] API route hit");
    const form = new IncomingForm({ maxFileSize: 4 * 1024 * 1024 }); // 4MB
    await new Promise<void>((resolve) => {
      form.parse(req, async (err: unknown, fields: Fields, files: Files) => {
        if (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          console.error("[extract-text] formidable error:", err);
          res
            .status(400)
            .json({ error: "File upload error", details: errorMsg });
          return resolve();
        }
        let file = files.file as File | File[] | undefined;
        if (Array.isArray(file)) file = file[0];
        if (!file || !file.filepath) {
          console.error("[extract-text] No file uploaded");
          res.status(400).json({ error: "No file uploaded" });
          return resolve();
        }
        const buffer = fs.readFileSync(file.filepath);
        const data = await pdfParse(buffer);
        if (!data.text || data.text.trim().length === 0) {
          console.error(
            "[extract-text] PDF text extraction returned empty text"
          );
          res.status(422).json({ error: "Failed to extract text from PDF" });
          return resolve();
        }
        res.status(200).json({ text: data.text });
        resolve();
      });
    });
  } catch (error: unknown) {
    console.error("[extract-text] Error extracting PDF text:", error);
    return res.status(500).json({
      error: "Failed to extract PDF text",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
