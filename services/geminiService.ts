import { GoogleGenAI, Type } from "@google/genai";
import { LectureData } from "../types";
import { blobToBase64 } from "./audioService";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = "gemini-2.5-flash"; // Excellent for audio processing

// Schema for structured output
const lectureSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "A concise, academic title for the lecture." },
    transcript: { type: Type.STRING, description: "A clean transcript of the audio. If very long, provide a detailed abridged version with timestamps [mm:ss]." },
    summary: { type: Type.STRING, description: "A 200-word executive summary of the lecture content." },
    confidenceScore: { type: Type.NUMBER, description: "A number between 0 and 100 indicating clarity of audio and confidence in transcription." },
    takeaways: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          point: { type: Type.STRING },
          explanation: { type: Type.STRING },
          priority: { type: Type.STRING, enum: ["High", "Medium", "Low"] }
        }
      }
    },
    flashcards: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          front: { type: Type.STRING, description: "The question or term." },
          back: { type: Type.STRING, description: "The answer or definition." }
        }
      }
    }
  },
  required: ["title", "summary", "takeaways", "flashcards", "transcript", "confidenceScore"]
};

export const processLecture = async (audioBlob: Blob): Promise<LectureData> => {
  const base64Audio = await blobToBase64(audioBlob);
  const mimeType = audioBlob.type || 'audio/webm'; // Fallback if type is missing

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio
            }
          },
          {
            text: `You are ClassCore, an expert academic assistant. 
            Analyze the attached lecture audio. 
            1. Generate a clean title.
            2. produce a highly accurate transcript with timestamps.
            3. Create a comprehensive summary.
            4. Extract 8 key takeaways with priority levels.
            5. Create 10 high-quality flashcards for Anki (Q&A style).
            6. Rate the audio quality confidence (0-100).
            
            Return ONLY valid JSON matching the schema.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: lectureSchema,
        temperature: 0.2, // Low temperature for factual accuracy
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const data = JSON.parse(text);

    return {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      durationSeconds: 0, // Placeholder, would need metadata from audio element
      ...data
    };

  } catch (error) {
    console.error("Gemini Processing Error:", error);
    throw error;
  }
};
