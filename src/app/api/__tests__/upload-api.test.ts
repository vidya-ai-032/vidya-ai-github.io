import request from "supertest";
import app from "../route"; // Adjust import if needed for your Next.js API handler
import path from "path";
import fs from "fs";

describe("POST /api/upload", () => {
  it("should reject missing file", async () => {
    const res = await request(app).post("/api/upload").send();
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("should upload a real PDF file", async () => {
    const filePath = path.join(__dirname, "../../../../uploads/sample.pdf");
    const fileExists = fs.existsSync(filePath);
    expect(fileExists).toBe(true);
    const res = await request(app).post("/api/upload").attach("file", filePath);
    expect([200, 201]).toContain(res.status);
    expect(res.body).toBeDefined();
    // Optionally, check for specific response fields
  });

  // Add more tests for valid PDF, invalid file, etc.
});
