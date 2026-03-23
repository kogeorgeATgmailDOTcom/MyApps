import { GoogleGenAI, Type } from "@google/genai";
import { Holding, AnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function analyzeHoldings(
  holdings: Holding[],
  referenceDate: string
): Promise<AnalysisResult[]> {
  const symbols = holdings.map((h) => h.symbol).join(", ");
  const prompt = `
    Analyze the following US stock symbols: ${symbols}.
    Reference Date/Time: ${referenceDate}.
    
    Task:
    1. Use Google Search to find the most relevant US market news for each stock from the last 16 hours relative to the reference date.
    2. Focus on high-impact events: earnings surprises, regulatory shifts, major analyst upgrades/downgrades, or significant product announcements.
    3. For each stock, provide:
       - A priority score (1-10) where 10 is most urgent/high-impact.
       - A concise summary of the overall news situation.
       - A list of specific news items found.
    
    Return the data as a JSON array of objects.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            symbol: { type: Type.STRING },
            priority: { type: Type.INTEGER },
            summary: { type: Type.STRING },
            news: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  symbol: { type: Type.STRING },
                  title: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  impact: { 
                    type: Type.STRING,
                    enum: ["high", "medium", "low"]
                  },
                  source: { type: Type.STRING },
                  url: { type: Type.STRING }
                },
                required: ["symbol", "title", "summary", "impact", "source", "url"]
              }
            }
          },
          required: ["symbol", "priority", "summary", "news"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Failed to parse Gemini response:", e);
    return [];
  }
}
