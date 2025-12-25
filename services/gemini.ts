
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { GroundingSource } from "../types";

export class GeminiService {
  private chatSession: any = null;

  constructor() {}

  /**
   * Initializes the AI session. 
   * Uses process.env.API_KEY exclusively as per core requirements.
   */
  async initChat() {
    const apiKey = process.env.API_KEY;
    
    if (!apiKey) {
      console.error("NEURAL LINK FAILURE: API_KEY is not defined in environment variables.");
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      this.chatSession = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.8,
          tools: [{ googleSearch: {} }]
        },
      });
    } catch (error) {
      console.error("AI Initialization Error:", error);
    }
  }

  async sendMessage(message: string): Promise<{ text: string; sources: GroundingSource[] }> {
    try {
      if (!this.chatSession) {
        await this.initChat();
      }

      if (!this.chatSession) {
        throw new Error("API_KEY_MISSING");
      }

      const result = await this.chatSession.sendMessage({ message });
      const response = result as GenerateContentResponse;
      
      const text = response.text || "Neural connection stable, but response was empty.";
      const sources: GroundingSource[] = [];

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        chunks.forEach((chunk: any) => {
          if (chunk.web && chunk.web.uri) {
            sources.push({
              title: chunk.web.title || "Verified Source",
              uri: chunk.web.uri
            });
          }
        });
      }

      return { 
        text, 
        sources: Array.from(new Map(sources.map(item => [item.uri, item])).values()) 
      };

    } catch (error: any) {
      console.error("Neural Link Error:", error);
      
      let errorMessage = "My neural link was interrupted. Please try again.";
      const rawError = error.message?.toLowerCase() || "";

      if (rawError.includes("api_key_missing") || rawError.includes("api key") || rawError.includes("403")) {
        errorMessage = "CONFIGURATION ALERT: API_KEY detect nahi ho rahi. Meherbaani karke apne hosting dashboard mein 'API_KEY' set karein.";
      } else if (rawError.includes("safety") || rawError.includes("blocked")) {
        errorMessage = "Neural Safety Protocol: Content flagged. Please refrain from violating core directives.";
      } else if (rawError.includes("quota") || rawError.includes("429")) {
        errorMessage = "Bandwidth Limit Reached: Neural net is busy. Please wait 60 seconds.";
      }

      return { text: errorMessage, sources: [] };
    }
  }
}

export const geminiService = new GeminiService();
