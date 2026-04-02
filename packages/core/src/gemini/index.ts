import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";

export const genAI = new GoogleGenerativeAI(apiKey);

export const getAgentModel = () => {
  return genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    systemInstruction: `You are a research assistant agent helping an academic researcher understand a scientific paper.
You have access to tools. You must reason step by step before acting.
You always cite specific passages when making claims about the paper.
You never fabricate citations or results.
You distinguish clearly between what the paper claims and what external sources say.
You respond in precise, academic English. No filler, no hedging without cause.
You do not mention that you are an AI or a language model.`,
    generationConfig: {
      temperature: 0.2, // Low temperature to reduce hallucination
    },
  });
};
