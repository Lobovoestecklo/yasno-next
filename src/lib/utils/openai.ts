import OpenAI from "openai";
import { IMessage } from "@/types";

// Only initialize OpenAI client in server components/API routes
// This prevents client-side errors when environment variables aren't available
let openai: OpenAI | null = null;

// Create a function that gets the OpenAI client on-demand in server contexts
export const getOpenAIClient = () => {
  // Only initialize in server context
  if (typeof window === 'undefined' && !openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not defined in the environment variables.");
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
};

// Convert our app message format to OpenAI format
export const prepareMessagesForOpenAI = (messages: IMessage[]) => {
  return messages.map((message) => {
    if (message.role === 'user') {
      return {
        role: "user",
        content: [
          {
            type: "input_text",
            text: message.content,
          },
        ],
      };
    }
    return {
      role: "assistant",
      content: [
        {
          type: "output_text",
          text: message.content,
        },
      ],
    };
  });
};
