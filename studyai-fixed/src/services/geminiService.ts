import { GoogleGenAI, Type } from "@google/genai";

// Support both Vite env (browser) and Node env (server/tests)
const apiKey = (process.env.GEMINI_API_KEY as string) || (import.meta as any).env?.VITE_GEMINI_API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

// Use the correct, available model name
const MODEL = "gemini-2.0-flash";

export const generateSummary = async (text: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `Please summarize the following educational material. Provide a concise but comprehensive overview with key themes and main takeaways. Format the output in professional markdown with clear headings.\n\nMaterial Content:\n${text.substring(0, 30000)}`,
  });
  return response.text ?? "No summary could be generated.";
};

export const generateQuiz = async (text: string) => {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `Generate 5 multiple-choice questions based on the following material. Each question must have exactly 4 options. Return ONLY valid JSON, no markdown.\n\nMaterial Content:\n${text.substring(0, 30000)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            correctAnswer: { type: Type.STRING },
            explanation: { type: Type.STRING },
          },
          required: ["question", "options", "correctAnswer", "explanation"],
        },
      },
    },
  });

  try {
    const raw = response.text ?? "[]";
    return JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    return [];
  }
};

export const generateFlashcards = async (text: string) => {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `Generate 10 flashcards (term and definition) based on the following material. Return ONLY valid JSON, no markdown.\n\nMaterial Content:\n${text.substring(0, 30000)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            term: { type: Type.STRING },
            definition: { type: Type.STRING },
          },
          required: ["term", "definition"],
        },
      },
    },
  });

  try {
    const raw = response.text ?? "[]";
    return JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    return [];
  }
};

export const chatWithNotes = async (
  question: string,
  context: string,
  history: { role: "user" | "model"; parts: { text: string }[] }[]
): Promise<string> => {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      ...history,
      {
        role: "user",
        parts: [
          {
            text: `Based on the following notes, please answer my question: "${question}"\n\nNotes Context:\n${context.substring(0, 20000)}`,
          },
        ],
      },
    ],
    config: {
      systemInstruction:
        "You are a helpful study companion named StudyAI. Use the provided notes as your primary source of truth. If the answer isn't in the notes, use your general knowledge but mention it's not in the provided material. Keep answers encouraging, clear, and educational. Use markdown formatting where helpful.",
    },
  });
  return response.text ?? "I couldn't generate a response. Please try again.";
};
