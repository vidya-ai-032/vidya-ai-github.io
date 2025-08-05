import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Google Generative AI

export interface ContentTopic {
  title: string;
  summary: string;
  keyPoints: string[];
  estimatedTime: string;
}

export interface QuizQuestion {
  question: string;
  type: "multiple_choice" | "subjective" | "creative";
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
}

export interface Quiz {
  title: string;
  subject: string;
  questions: QuizQuestion[];
  totalTime: number; // in minutes
}

export interface TutorResponse {
  response: string;
  suggestions: string[];
  followUpQuestions: string[];
}

interface GeminiError extends Error {
  userMessage?: string;
  rawResponse?: string;
}

// Helper to get the Gemini model using the user's key if present
function getGeminiModel() {
  if (typeof window !== "undefined") {
    const userKey = localStorage.getItem("vidyaai_gemini_api_key");
    if (userKey) {
      console.log("Using user-provided Gemini API key");
      const genAI = new GoogleGenerativeAI(userKey);
      return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    }
  }
  // Fallback to server-side or default key
  const serverKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!serverKey) {
    console.error("🚨 Gemini API key is missing from environment variables");
    console.error("This will cause all AI features to fail in production");
    throw new Error(
      "Your Gemini API key is invalid or missing. Please check your settings."
    );
  }
  console.log("Using server-side Gemini API key");
  const genAI = new GoogleGenerativeAI(serverKey);
  return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
}

async function generateWithRetry(
  model: any,
  prompt: string,
  maxRetries: number = 3
): Promise<any> {
  let lastError: GeminiError | null = null;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await model.generateContent(prompt);
      return result;
    } catch (error: unknown) {
      lastError = error as GeminiError;
      // Check for Gemini API error details
      if (error && typeof error === "object" && error !== null) {
        const err = error as GeminiError;
        if (err.message && err.message.includes("quota")) {
          err.userMessage =
            "You have exceeded your Gemini API quota. Please use a different API key in settings or wait for your quota to reset.";
        } else if (err.message && err.message.includes("API key")) {
          err.userMessage =
            "Your Gemini API key is invalid or missing. Please check your settings.";
        } else if (err.message && err.message.includes("429")) {
          err.userMessage =
            "You are being rate limited by Gemini. Please wait and try again.";
        } else if (err.message && err.message.includes("401")) {
          err.userMessage = "Unauthorized: Please check your Gemini API key.";
        } else if (err.message && err.message.includes("503")) {
          err.userMessage = "Gemini API is overloaded. Retrying...";
        }
      }
      // Check if the error is a 503 (overloaded) error
      if (lastError.message && lastError.message.includes("503")) {
        console.warn(`Gemini API overloaded. Retrying in ${i + 1}s...`);
        await new Promise((resolve) => setTimeout(resolve, (i + 1) * 1000)); // Exponential backoff
        continue;
      }
      // For other errors, fail immediately
      throw error;
    }
  }
  // If all retries fail, throw the last captured error
  throw (
    lastError || new Error("Gemini API request failed after multiple retries.")
  );
}

// Helper to safely parse Gemini JSON
function safeParseGeminiJSON(raw: string): any {
  // Remove code block markers if present
  let jsonString = raw.trim();
  if (jsonString.startsWith("```json")) {
    jsonString = jsonString.replace(/^```json/, "");
  }
  if (jsonString.startsWith("```")) {
    jsonString = jsonString.replace(/^```/, "");
  }
  if (jsonString.endsWith("```")) {
    jsonString = jsonString.replace(/```$/, "");
  }
  jsonString = jsonString.trim();

  // If the string is double-encoded, decode once
  if (jsonString.startsWith('"') && jsonString.endsWith('"')) {
    try {
      jsonString = JSON.parse(jsonString);
    } catch (e) {
      // If parsing fails, continue with the original string
    }
  }

  // Remove all control characters except for allowed whitespace
  jsonString = jsonString.replace(/[\u0000-\u001F\u007F]/g, (c: string) => {
    if (c === "\n" || c === "\r" || c === "\t") return c;
    return "";
  });

  try {
    return JSON.parse(jsonString);
  } catch (err) {
    console.error("Failed to parse Gemini JSON:", jsonString, err);
    throw Object.assign(
      new Error("Gemini returned invalid JSON. Please try again."),
      { rawResponse: raw }
    );
  }
}

export class GeminiService {
  static getModel() {
    return getGeminiModel();
  }
  // Content Processing Service
  static async processContent(
    content: string,
    subject: string
  ): Promise<ContentTopic[]> {
    console.log("🔧 GeminiService.processContent called");
    console.log("📄 Content length:", content.length);
    console.log("📚 Subject:", subject);

    try {
      console.log("🔑 Getting Gemini model...");
      const model = getGeminiModel();
      console.log("✅ Gemini model obtained successfully");

      const prompt = `
        You are an expert teacher and subject matter expert. Analyze the following document content and:

        1. Identify the main subject and theme of the document.
        2. Break down the content into meaningful subtopics based on the actual content structure and depth. Don't force a specific number - extract what's naturally present in the document.
        3. For each subtopic, provide:
           - A clear, descriptive heading that reflects the content
           - A detailed paragraph (4-6 sentences) that thoroughly explains the subtopic, its importance, and its relationship to the main subject
           - 3-5 key points that highlight crucial concepts, examples, or applications
        4. Focus on accuracy and educational value. Each subtopic should be self-contained but show its connection to the broader subject.

        Format the response as a JSON array:
        [
          {
            "title": "Subtopic Heading",
            "summary": "Detailed paragraph explaining the subtopic...",
            "keyPoints": ["Key Point 1", "Key Point 2", "Key Point 3"],
            "estimatedTime": "X minutes"
          }
        ]

        Important:
        - Do NOT hallucinate or use file metadata
        - Only extract topics actually present in the content
        - Ensure summaries are thorough and educational
        - Include estimated study time for each subtopic
      `;

      const fullPrompt = `${prompt}\n\nDocument Content:\n${content}`;
      console.log("📝 Sending request to Gemini API...");
      console.log("📏 Prompt length:", fullPrompt.length);

      const result = await generateWithRetry(model, fullPrompt);
      console.log("✅ Gemini API response received");

      const response = await result.response;
      const text = response.text();
      console.log("📄 Raw response length:", text.length);
      console.log("Gemini raw response:", text); // Debug Gemini response

      // Extract JSON from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        console.log("✅ JSON match found, parsing...");
        const parsed = safeParseGeminiJSON(jsonMatch[0]);
        console.log("✅ Content processing completed successfully");
        return parsed;
      }

      console.error("❌ No JSON array found in response");
      throw new Error("Failed to parse content processing response");
    } catch (error: unknown) {
      console.error("💥 Error in GeminiService.processContent:", error);
      // If error has userMessage, throw that for the API route to catch
      if (
        error &&
        typeof error === "object" &&
        (error as GeminiError).userMessage
      ) {
        throw new Error((error as GeminiError).userMessage);
      }
      // If error is from parsing, include the raw response if available
      if (error instanceof Error && error.message.includes("parse")) {
        const geminiError = error as GeminiError;
        throw new Error(
          `Failed to process content: ${error.message}${
            geminiError.rawResponse
              ? ` | Raw response: ${geminiError.rawResponse}`
              : ""
          }`
        );
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  // Quiz Generation Service
  static async generateQuiz(
    content: string,
    subject: string,
    quizType: "mcq" | "subjective" | "creative" = "mcq"
  ): Promise<Quiz> {
    try {
      const prompt = `
        Generate an engaging, thought-provoking quiz based on the following ${subject} content.
        
        Content: ${content}
        
        Quiz Type: ${
          quizType === "mcq"
            ? "Multiple Choice Questions"
            : quizType === "subjective"
            ? "Subjective Questions"
            : "Creative/Problem Solving Questions"
        }
        
        Requirements:
        1. Create 5 questions that:
           - Start with a real-world scenario or context
           - Require understanding and application of concepts
           - Challenge students to think critically
           - Connect different aspects of the topic
        
        2. For each question type:
           - MCQ: Create plausible options that test understanding, not just recall
           - Subjective: Ask for analysis, comparison, or evaluation
           - Creative: Present real-world problems requiring application of concepts
        
        3. For each question, provide:
           - A detailed scenario or context
           - Clear question text
           - For MCQ: 4 well-thought-out options
           - A thorough explanation of the answer
           - Learning points or key takeaways
        
        Format the response as a JSON object:
        {
          "title": "Quiz Title",
          "subject": "${subject}",
          "questions": [
            {
              "question": "Scenario + Question text",
              "type": "${
                quizType === "mcq"
                  ? "multiple_choice"
                  : quizType === "subjective"
                  ? "subjective"
                  : "creative"
              }",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "correctAnswer": "Correct answer or evaluation criteria",
              "explanation": "Detailed explanation and learning points"
            }
          ],
          "totalTime": 25
        }
        
        Note: Allow 5 minutes per question for deeper thinking and analysis.
      `;

      const model = getGeminiModel();
      const result = await generateWithRetry(model, prompt);
      const response = await result.response;
      const text = response.text();

      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return safeParseGeminiJSON(jsonMatch[0]);
      }

      throw new Error("Failed to parse quiz generation response");
    } catch (error) {
      console.error("Error generating quiz:", error);
      // If error has userMessage, throw that for the API route to catch
      if (
        error &&
        typeof error === "object" &&
        (error as GeminiError).userMessage
      ) {
        throw new Error((error as GeminiError).userMessage);
      }
      // If error is from parsing, include the raw response if available
      if (error instanceof Error && error.message.includes("parse")) {
        throw new Error(
          `Failed to generate quiz: ${error.message}${
            (error as GeminiError).rawResponse
              ? ` | Raw response: ${(error as GeminiError).rawResponse}`
              : ""
          }`
        );
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  // AI Tutor Conversation Service
  static async tutorConversation(
    userMessage: string,
    context: string = "",
    conversationHistory: Array<{
      role: "user" | "assistant";
      content: string;
    }> = []
  ): Promise<TutorResponse & { fallback?: boolean }> {
    try {
      const prompt = `
        You are an expert AI tutor for VidyaAI, specializing in creating engaging, scenario-based learning experiences.
        
        ${context ? `Topic Context: ${context}` : ""}
        
        ${
          conversationHistory.length > 0
            ? `Previous conversation:\n${conversationHistory
                .map((msg) => `${msg.role}: ${msg.content}`)
                .join("\n")}`
            : ""
        }
        
        Student's question: ${userMessage}
        
        Provide a response that:
        1. Starts with a real-world scenario or problem that illustrates the concept
        2. Explains the concept thoroughly using the scenario
        3. Guides the student through problem-solving steps
        4. Connects the concept to broader applications
        
        Then include:
        - 2-3 practical exercises or scenarios for practice
        - 2-3 thought-provoking questions that encourage critical thinking and application
        
        IMPORTANT: Respond ONLY with a valid JSON object, no explanation, no markdown, no extra text, no code block. Do not include any text before or after the JSON. Do not use markdown formatting. Do not say 'Here is the JSON'.
        
        Format the response as a JSON object:
        {
          "response": "Your detailed, scenario-based response...",
          "suggestions": [
            "Practice scenario/exercise 1",
            "Practice scenario/exercise 2",
            "Practice scenario/exercise 3"
          ],
          "followUpQuestions": [
            "Critical thinking question 1",
            "Application question 2",
            "Analysis question 3"
          ]
        }
        
        Be engaging, clear, and focus on real-world applications. Adapt your response to the student's level shown in the conversation history.
      `;

      const model = getGeminiModel();
      const result = await generateWithRetry(model, prompt);
      const response = await result.response;
      const text = response.text();

      // Robustly strip code block markers if present
      let cleanedText = text.trim();
      if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText.replace(/^```json/, "");
      }
      if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.replace(/^```/, "");
      }
      if (cleanedText.endsWith("```")) {
        cleanedText = cleanedText.replace(/```$/, "");
      }
      cleanedText = cleanedText.trim();

      // Try to extract JSON from the response
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return safeParseGeminiJSON(jsonMatch[0]);
        } catch (err) {
          // fall through to fallback below
        }
      }

      // Fallback: return the raw text as the response, with a flag
      return {
        response: text,
        suggestions: [],
        followUpQuestions: [],
        fallback: true,
      };
    } catch (error: unknown) {
      console.error("Error in tutor conversation:", error);
      if (
        error &&
        typeof error === "object" &&
        (error as GeminiError).userMessage
      ) {
        throw new Error((error as GeminiError).userMessage);
      }
      throw new Error("Failed to get tutor response");
    }
  }

  // Quiz Evaluation Service
  static async evaluateAnswer(
    question: string,
    correctAnswer: string,
    studentAnswer: string,
    questionType: "multiple_choice" | "subjective" | "creative"
  ): Promise<{ score: number; feedback: string; suggestions: string[] }> {
    try {
      const prompt = `
        Evaluate a student's answer for the following question.
        
        Question: ${question}
        Correct Answer: ${correctAnswer}
        Student's Answer: ${studentAnswer}
        Question Type: ${questionType}
        
        Provide:
        1. A score (0-100)
        2. Detailed feedback explaining what was correct/incorrect
        3. Suggestions for improvement
        
        Format the response as a JSON object:
        {
          "score": 85,
          "feedback": "Detailed feedback about the answer",
          "suggestions": ["Suggestion 1", "Suggestion 2"]
        }
        
        Be encouraging and constructive in your feedback.
      `;

      const model = getGeminiModel();
      const result = await generateWithRetry(model, prompt);
      const response = await result.response;
      const text = response.text();

      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return safeParseGeminiJSON(jsonMatch[0]);
      }

      throw new Error("Failed to parse evaluation response");
    } catch (error: unknown) {
      console.error("Error evaluating answer:", error);
      throw new Error("Failed to evaluate answer");
    }
  }

  // Content Analysis Service
  static async analyzeContent(content: string): Promise<{
    subject: string;
    difficulty: "beginner" | "intermediate" | "advanced";
    keyConcepts: string[];
    prerequisites: string[];
    estimatedStudyTime: string;
  }> {
    try {
      const prompt = `
        Analyze the following educational content and provide metadata.
        
        Content: ${content}
        
        Provide:
        1. Subject area
        2. Difficulty level (beginner/intermediate/advanced)
        3. Key concepts covered
        4. Prerequisites needed
        5. Estimated study time
        
        Format the response as a JSON object:
        {
          "subject": "Mathematics",
          "difficulty": "intermediate",
          "keyConcepts": ["Concept 1", "Concept 2", "Concept 3"],
          "prerequisites": ["Prerequisite 1", "Prerequisite 2"],
          "estimatedStudyTime": "30 minutes"
        }
      `;

      const model = getGeminiModel();
      const result = await generateWithRetry(model, prompt);
      const response = await result.response;
      const text = response.text();

      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return safeParseGeminiJSON(jsonMatch[0]);
      }

      throw new Error("Failed to parse content analysis response");
    } catch (error) {
      console.error("Error analyzing content:", error);
      throw new Error("Failed to analyze content");
    }
  }

  // Pre-extract main subject and themes from a content preview
  static async preExtractSubjectThemes(
    content: string
  ): Promise<{ subject: string; themes: string[] }> {
    try {
      const prompt = `
        Analyze the following preview of a study document and identify:
        1. The main subject (in 1 phrase)
        2. 2-4 core themes or topics covered
        Return as JSON: { "subject": "...", "themes": ["...", "..."] }
        Preview:
        ${content}
      `;
      const model = getGeminiModel();
      const result = await generateWithRetry(model, prompt);
      const response = await result.response;
      const text = response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return safeParseGeminiJSON(jsonMatch[0]);
      }
      throw new Error("Failed to parse subject/themes extraction response");
    } catch (error) {
      console.error("Error extracting subject/themes:", error);
      throw new Error("Failed to extract subject/themes");
    }
  }
}
