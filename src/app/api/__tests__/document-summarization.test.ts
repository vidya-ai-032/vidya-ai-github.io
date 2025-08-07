import { NextRequest } from "next/server";
import { POST } from "../gemini/summarize-document/route";
import { GeminiService } from "@/lib/gemini";

// Mock the GeminiService
jest.mock("@/lib/gemini", () => ({
  GeminiService: {
    summarizeDocument: jest.fn(),
  },
}));

// Mock next-auth
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(() =>
    Promise.resolve({
      user: { email: "test@example.com" },
    })
  ),
}));

describe("Document Summarization API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 401 for unauthenticated requests", async () => {
    // Mock unauthenticated session
    const { getServerSession } = require("next-auth");
    getServerSession.mockResolvedValueOnce(null);

    const request = new NextRequest(
      "http://localhost:3000/api/gemini/summarize-document",
      {
        method: "POST",
        body: JSON.stringify({ content: "test content" }),
      }
    );

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("should return 400 when no content is provided", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/gemini/summarize-document",
      {
        method: "POST",
        body: JSON.stringify({}),
      }
    );

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe("Content is required");
  });

  it("should successfully generate summary", async () => {
    const mockSummary = {
      summary:
        "This is a test summary with 10-12 sentences following the educational format.",
      academicLevel: "high school",
      keyTakeaways: ["Key point 1", "Key point 2", "Key point 3"],
      estimatedReadingTime: "5 minutes",
    };

    (GeminiService.summarizeDocument as jest.Mock).mockResolvedValueOnce(
      mockSummary
    );

    const request = new NextRequest(
      "http://localhost:3000/api/gemini/summarize-document",
      {
        method: "POST",
        body: JSON.stringify({
          content:
            "This is a test document content about science and education.",
          academicLevel: "high school",
        }),
      }
    );

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.summary).toEqual(mockSummary);
    expect(GeminiService.summarizeDocument).toHaveBeenCalledWith(
      "This is a test document content about science and education.",
      "high school"
    );
  });

  it("should handle API errors gracefully", async () => {
    (GeminiService.summarizeDocument as jest.Mock).mockRejectedValueOnce(
      new Error("API Error")
    );

    const request = new NextRequest(
      "http://localhost:3000/api/gemini/summarize-document",
      {
        method: "POST",
        body: JSON.stringify({
          content: "Test content",
          academicLevel: "college",
        }),
      }
    );

    const response = await POST(request);
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data.error).toBe("Failed to summarize document");
    expect(data.userMessage).toBe("API Error");
  });
});

