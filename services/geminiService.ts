import { GoogleGenAI } from "@google/genai";
import { GeneratedCode } from "../types";

const SYSTEM_INSTRUCTION = `
You are a world-class Backend Architect and DevOps Engineer specializing in Node.js, Express, and PostgreSQL.
The user is transitioning from Supabase to a self-hosted Home Server with PostgreSQL.
Your goal is to generate secure, production-ready API code snippets based on the user's description.

Context:
- Database: PostgreSQL (local network).
- API Framework: Node.js with Express.
- ORM: Use 'pg' (node-postgres) for raw queries or 'Prisma' if the user asks for schema.
- Security: Assume the user will use a Cloudflare Tunnel, so standard Express security applies (Helmet, CORS).

Output Format:
Return a JSON object with the following structure:
{
  "title": "Short title of what was generated",
  "code": "The full code snippet (string)",
  "explanation": "Brief explanation of how this works and where to put it."
}
`;

export const generateBackendCode = async (
  prompt: string, 
  apiKey: string
): Promise<GeneratedCode> => {
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from Gemini.");
    }

    return JSON.parse(text) as GeneratedCode;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate code. Please check your API key and try again.");
  }
};