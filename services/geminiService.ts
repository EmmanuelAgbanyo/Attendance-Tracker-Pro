
import { GoogleGenAI } from "@google/genai";
import { AttendanceRecord } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    console.warn("API_KEY environment variable not set. AI features will not work.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const getAIInsights = async (records: AttendanceRecord[]): Promise<string> => {
    if (!API_KEY) {
        throw new Error("API Key for Gemini is not configured.");
    }
    
    const model = 'gemini-2.5-flash';
    
    const dataSummary = records.map(r => `- On ${r.date}, ${r.institution} had ${r.participants} participants.`).join('\n');

    const prompt = `
        You are an expert data analyst for event management.
        Analyze the following attendance data and provide a brief, insightful summary.
        Format your response in Markdown.

        Your analysis should include:
        - A "Key Highlights" section identifying the event with the highest and lowest attendance.
        - A "Trend Analysis" section describing any noticeable trends (e.g., growth over time, popular months).
        - An "Institution Spotlight" section identifying the institution with the highest total participation across all events.

        Do not just list the data back. Provide actionable, easy-to-read insights.
        Keep the entire response concise and under 150 words.

        Here is the data:
        ${dataSummary}
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });

        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to communicate with the AI service.");
    }
};
