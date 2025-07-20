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

// Helper to get the Gemini model using the user's key if present
function getGeminiModel() {
  if (typeof window !== "undefined") {
    const userKey = localStorage.getItem("vidyaai_gemini_api_key");
    if (userKey) {
      const genAI = new GoogleGenerativeAI(userKey);
      return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    }
  }
  // Fallback to server-side or default key
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
  return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
}

export class GeminiService {
  // Content Processing Service
  static async processContent(
    content: string,
    subject: string
  ): Promise<ContentTopic[]> {
    try {
      const prompt = `
        Break down the following ${subject} content into main topics and subtopics. For each topic, provide:
        - title
        - summary (2-3 sentences)
        - 3-5 key points
        - subtopics: an array of subtopic objects (with the same structure, and can be nested further if needed)

        Format the response as a JSON array:
        [
          {
            "title": "Main Topic",
            "summary": "Summary of the main topic.",
            "keyPoints": ["Point 1", "Point 2", "Point 3"],
            "subtopics": [
              {
                "title": "Subtopic",
                "summary": "Summary of the subtopic.",
                "keyPoints": ["Point 1", "Point 2"],
                "subtopics": [ ... ]
              }
            ]
          }
        ]

        Make sure the topics and subtopics are logical, progressive, and suitable for students.
      `;

      const model = getGeminiModel();
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      console.log("Gemini raw response:", text); // Debug Gemini response
      // Extract JSON from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error("Failed to parse content processing response");
    } catch (error) {
      console.error("Error processing content:", error);
      throw new Error("Failed to process content");
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
        Generate a quiz based on the following ${subject} content.
        
        Content: ${content}
        
        Quiz Type: ${
          quizType === "mcq"
            ? "Multiple Choice Questions"
            : quizType === "subjective"
            ? "Subjective Questions"
            : "Creative/Problem Solving Questions"
        }
        
        Requirements:
        - Create 5 questions
        - For MCQ: Provide 4 options per question with one correct answer
        - For Subjective: Provide detailed explanations
        - For Creative: Focus on application and problem-solving
        - Include explanations for correct answers
        - Estimate total time (2-3 minutes per question)
        
        Format the response as a JSON object with the following structure:
        {
          "title": "Quiz Title",
          "subject": "${subject}",
          "questions": [
            {
              "question": "Question text",
              "type": "${
                quizType === "mcq"
                  ? "multiple_choice"
                  : quizType === "subjective"
                  ? "subjective"
                  : "creative"
              }",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "correctAnswer": "Correct answer or explanation",
              "explanation": "Why this is correct"
            }
          ],
          "totalTime": 15
        }
      `;

      const model = getGeminiModel();
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error("Failed to parse quiz generation response");
    } catch (error) {
      console.error("Error generating quiz:", error);
      throw new Error("Failed to generate quiz");
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
  ): Promise<TutorResponse> {
    try {
      const prompt = `
        You are an AI tutor for VidyaAI, a learning platform. Your role is to help students learn effectively.
        
        ${context ? `Context: ${context}` : ""}
        
        ${
          conversationHistory.length > 0
            ? `Previous conversation:\n${conversationHistory
                .map((msg) => `${msg.role}: ${msg.content}`)
                .join("\n")}`
            : ""
        }
        
        Student's question: ${userMessage}
        
        Please provide:
        1. A helpful, educational response
        2. 2-3 suggestions for further learning
        3. 2-3 follow-up questions to encourage deeper thinking
        
        Format the response as a JSON object:
        {
          "response": "Your educational response",
          "suggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3"],
          "followUpQuestions": ["Question 1", "Question 2", "Question 3"]
        }
        
        Be encouraging, clear, and educational. Adapt your response to the student's level and the context provided.
      `;

      const model = getGeminiModel();
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error("Failed to parse tutor response");
    } catch (error) {
      console.error("Error in tutor conversation:", error);
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
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error("Failed to parse evaluation response");
    } catch (error) {
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
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error("Failed to parse content analysis response");
    } catch (error) {
      console.error("Error analyzing content:", error);
      throw new Error("Failed to analyze content");
    }
  }
}
