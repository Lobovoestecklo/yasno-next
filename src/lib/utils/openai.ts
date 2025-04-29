import OpenAI from "openai";
import { IMessage } from "@/types";

// Только для серверной среды
let openai: OpenAI | null = null;

// Получение клиента OpenAI (в серверной среде)
export const getOpenAIClient = (): OpenAI | null => {
  if (typeof window !== 'undefined') {
    console.log('Attempted to initialize OpenAI client in browser');
    return null;
  }

  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("❌ OPENAI_API_KEY is not set in environment variables.");
      return null;
    }
    console.log('Initializing OpenAI client...');
    try {
      openai = new OpenAI({ apiKey });
      console.log('OpenAI client initialized successfully');
    } catch (error) {
      console.error('Error initializing OpenAI client:', error);
      return null;
    }
  }

  return openai;
};

// Подготовка сообщений для API OpenAI
export const prepareMessagesForOpenAI = (messages: IMessage[]) => {
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));
};
