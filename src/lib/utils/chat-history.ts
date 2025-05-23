'use client';

import { IMessage } from '@/types';
import { getLSValue, setLSValue } from './local-storage';
import { INITIAL_BOT_MESSAGE } from '../constants';

// Constants
const CHAT_HISTORY_KEY = 'chat-history';

// Types
export interface ChatHistory {
  id: string;
  title: string;
  createdAt: string;
  messages: IMessage[];
  lastUpdated: string;
}

// Helper function to generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 9);

// Check if we're on the client side
const isClient = typeof window !== 'undefined';

// Get all chat histories
export const getAllChatHistories = (): ChatHistory[] => {
  if (!isClient) return [];

  try {
    const histories = getLSValue(CHAT_HISTORY_KEY);
    return histories || [];
  } catch (error) {
    console.error('Error getting chat histories:', error);
    return [];
  }
};

// Get a specific chat history by ID
export const getChatHistoryById = (id: string): ChatHistory | null => {
  if (!isClient) return null;

  try {
    const histories = getAllChatHistories();
    return histories.find(chat => chat.id === id) || null;
  } catch (error) {
    console.error('Error getting chat history by id:', error);
    return null;
  }
};

// Add new chat to history
export function addChatToHistory(messages: IMessage[], title: string): string {
  if (!isClient) return '';

  const chatId = generateId();
  const chatEntry: ChatHistory = { 
    id: chatId, 
    title, 
    messages, 
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  };

  const histories = getAllChatHistories();
  const newChats = [chatEntry, ...histories];

  setLSValue(CHAT_HISTORY_KEY, newChats);
  return chatId;
}

// Update existing chat
export const updateChatHistory = (id: string, messages: IMessage[]): void => {
  if (!isClient) return;

  const histories = getAllChatHistories();
  const chatIndex = histories.findIndex(chat => chat.id === id);

  if (chatIndex !== -1) {
    histories[chatIndex] = {
      ...histories[chatIndex],
      messages,
      lastUpdated: new Date().toISOString()
    };
    setLSValue(CHAT_HISTORY_KEY, histories);
  }
};

// Update chat title
export const updateChatTitle = (id: string, newTitle: string): void => {
  if (!isClient) return;

  const histories = getAllChatHistories();
  const chatIndex = histories.findIndex(chat => chat.id === id);

  if (chatIndex !== -1) {
    histories[chatIndex] = {
      ...histories[chatIndex],
      title: newTitle,
      lastUpdated: new Date().toISOString()
    };
    setLSValue(CHAT_HISTORY_KEY, histories);
  }
};

// Delete chat from history
export const deleteChatHistory = (id: string): void => {
  if (!isClient) return;

  const histories = getAllChatHistories();
  const filteredHistories = histories.filter(chat => chat.id !== id);
  setLSValue(CHAT_HISTORY_KEY, filteredHistories);
};

// Clear all chat histories
export const clearAllChatHistories = (): void => {
  if (!isClient) return;
  setLSValue(CHAT_HISTORY_KEY, []);
};

// Get latest chat history
export const getLatestChat = (): ChatHistory | null => {
  if (!isClient) return null;

  const histories = getAllChatHistories();
  return histories.length > 0 ? histories[0] : null;
};

// Check if a chat exists
export const doesChatExist = (id: string): boolean => {
  if (!isClient) return false;

  const histories = getAllChatHistories();
  return histories.some(chat => chat.id === id);
};

// Get total number of chats
export const getChatCount = (): number => {
  if (!isClient) return 0;
  return getAllChatHistories().length;
};

// Load chat
export const loadChat = (chatId: string): IMessage[] => {
  const chat = getChatHistoryById(chatId);
  if (chat && chat.messages.length > 0) {
    // Если первое сообщение чата соответствует INITIAL_BOT_MESSAGE, возвращаем как есть,
    // иначе добавляем INITIAL_BOT_MESSAGE в начало.
    const messages = chat.messages[0]?.id === INITIAL_BOT_MESSAGE.id
      ? chat.messages
      : [INITIAL_BOT_MESSAGE, ...chat.messages];
    return messages;
  }
  return [];
};
