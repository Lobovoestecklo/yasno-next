import OpenAI from "openai";
import { IMessage } from "@/types";

// Только для серверной среды
let openai: OpenAI | null = null;

// Получение клиента OpenAI (в серверной среде)
export const getOpenAIClient = (): OpenAI | null => {
  if (typeof window !== 'undefined') return null;

  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("❌ OPENAI_API_KEY is not set in environment variables.");
      return null;
    }
    openai = new OpenAI({ apiKey });
  }

  return openai;
};

// Подготовка сообщений для API OpenAI (с блоками текста)
export const prepareMessagesForOpenAI = (messages: IMessage[]) => {
  return messages.map((message) => ({
    role: message.role,
    content: [
      {
        type: message.role === 'user' ? 'input_text' : 'output_text',
        text: message.content,
      },
    ],
  }));
};
