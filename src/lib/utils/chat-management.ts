import { IMessage } from '@/types';
import {
  addChatToHistory,
  updateChatHistory,
  updateChatTitle,
  deleteChatHistory
} from './chat-history';
import { generateChatTitle } from './generate-chat-title';
import { INITIAL_BOT_MESSAGE } from '../constants';

// Start a new chat
export const startNewChat = async (initialMessages: IMessage | IMessage[]) => {
  // Make sure to use the entire array if available
  const messages = Array.isArray(initialMessages) ? initialMessages : [initialMessages];

  // Create chat with temporary title first
  const chatId = addChatToHistory(messages, 'Новый чат');
  return chatId;
};

// Update existing chat
export const updateChat = async (chatId: string, messages: IMessage[]) => {
  // Always update messages first
  updateChatHistory(chatId, messages);

  // Generate new title if we have a conversation (more than just initial message)
  if (messages.length === 2 || messages.length === 3) {
    const hasUserMessages = messages.some(msg => msg.role === 'user');
    const hasAssistantMessages = messages.some(msg => msg.role === 'assistant' && msg.id !== INITIAL_BOT_MESSAGE.id);

    if (hasUserMessages && hasAssistantMessages) {
      const title = await generateChatTitle(messages);
      updateChatTitle(chatId, title);
    }
  }
};

// Delete chat
export const deleteChat = (chatId: string) => {
  deleteChatHistory(chatId);
};

// Update chat title
export const updateTitle = async (chatId: string, messages: IMessage[]) => {
  const title = await generateChatTitle(messages);
  updateChatTitle(chatId, title);
};