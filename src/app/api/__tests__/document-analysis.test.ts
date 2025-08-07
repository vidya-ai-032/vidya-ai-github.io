import { NextRequest } from "next/server";
import { POST as analyzeDocument } from "../gemini/analyze-document/route";
import { POST as generateDescription } from "../gemini/generate-description/route";

// Mock NextAuth
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(() => Promise.resolve({
    user: { email: "test@example.com" }
  }))
}));

// Mock GeminiService
jest.mock("@/lib/gemini", () => ({
  GeminiService: {
    analyzeDocument: jest.fn(),
    generateContentDescription: jest.fn()
  }
}));

describe("Document Analysis API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should analyze document successfully", async () => {
    const mockAnalysis = {
      topic: "Mathematics Fundamentals",
      subject: "Mathematics",
      level: "high school",
      documentTitle: "Algebra Basics",
      chapterSection: "Chapter 1: Introduction to Algebra",
      confidenceScore: 8
    };

    const { GeminiService } = require("@/lib/gemini");
    GeminiService.analyzeDocument.mockResolvedValue(mockAnalysis);

    const request = new NextRequest("http://localhost:3000/api/gemini/analyze-document", {
      method: "POST",
      body: JSON.stringify({
        content: "This is a mathematics document about algebra...",
        filename: "algebra_basics.pdf"
      })
    });

    const response = await analyzeDocument(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.analysis).toEqual(mockAnalysis);
    expect(GeminiService.analyzeDocument).toHaveBeenCalledWith(
      "This is a mathematics document about algebra...",
      "algebra_basics.pdf"
    );
  });

  it("should return error for missing content", async () => {
    const request = new NextRequest("http://localhost:3000/api/gemini/analyze-document", {
      method: "POST",
      body: JSON.stringify({})
    });

    const response = await analyzeDocument(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Content is required");
  });
});

describe("Content Description Generation API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should generate content description successfully", async () => {
    const mockDescription = {
      subject: "Physics",
      chapter: "Chapter 2: Mechanics",
      level: "college",
      document_name: "Introduction to Classical Mechanics",
      description: "This chapter covers the fundamental principles of classical mechanics...",
      auto_generated: ["subject", "level"],
      date_created: "2024-01-01T00:00:00.000Z"
    };

    const { GeminiService } = require("@/lib/gemini");
    GeminiService.generateContentDescription.mockResolvedValue(mockDescription);

    const request = new NextRequest("http://localhost:3000/api/gemini/generate-description", {
      method: "POST",
      body: JSON.stringify({
        content: "This is a physics document about mechanics...",
        userContext: {
          subject: "Physics",
          level: "college"
        }
      })
    });

    const response = await generateDescription(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.description).toEqual(mockDescription);
    expect(GeminiService.generateContentDescription).toHaveBeenCalledWith(
      "This is a physics document about mechanics...",
      {
        subject: "Physics",
        level: "college"
      }
    );
  });

  it("should return error for missing content", async () => {
    const request = new NextRequest("http://localhost:3000/api/gemini/generate-description", {
      method: "POST",
      body: JSON.stringify({})
    });

    const response = await generateDescription(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Content is required");
  });
});
