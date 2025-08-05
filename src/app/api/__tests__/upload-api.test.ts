import { NextRequest } from "next/server";
import { POST } from "../upload/route";
import path from "path";
import fs from "fs";

// Mock NextResponse for testing
const mockNextResponse = {
  json: (data: unknown, options?: { status?: number }) => ({
    status: options?.status || 200,
    body: data,
  }),
};

// Mock the NextResponse import
jest.mock("next/server", () => ({
  NextRequest: jest.fn(),
  NextResponse: mockNextResponse,
}));

describe("POST /api/upload", () => {
  it("should reject missing file", async () => {
    const mockRequest = {
      formData: jest.fn().mockResolvedValue(new Map()),
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    expect(response.status).toBe(400);
    expect(
      (response as { body?: { error?: string } }).body?.error
    ).toBeDefined();
  });

  it("should upload a real PDF file", async () => {
    const filePath = path.join(__dirname, "../../../../uploads/sample.pdf");
    const fileExists = fs.existsSync(filePath);
    expect(fileExists).toBe(true);

    // Create a mock file
    const mockFile = new File(["test content"], "sample.pdf", {
      type: "application/pdf",
    });

    const formData = new FormData();
    formData.append("file", mockFile);

    const mockRequest = {
      formData: jest.fn().mockResolvedValue(formData),
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    expect([200, 201]).toContain(response.status);
    expect(response.body).toBeDefined();
  });

  // Add more tests for valid PDF, invalid file, etc.
});
