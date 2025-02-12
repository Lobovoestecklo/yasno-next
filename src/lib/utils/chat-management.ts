import { IMessage } from '@/types';
import { 
  addChatToHistory, 
  updateChatHistory, 
  getChatHistoryById,
  updateChatTitle,
  deleteChatHistory 
} from './chat-history';
import { generateChatTitle } from './generate-chat-title';
import { saveMessages } from './local-storage-chat-messages';

// Start a new chat
export const startNewChat = async (initialMessages: IMessage | IMessage[]) => {
  // Make sure to use the entire array if available
  const messages = Array.isArray(initialMessages) ? initialMessages : [initialMessages];
  const title = await generateChatTitle(messages);
  const chatId = addChatToHistory(messages, title);
  saveMessages(messages);
  return chatId;
};

// Update existing chat
export const updateChat = async (chatId: string, messages: IMessage[]) => {
  const title = await generateChatTitle(messages);
  updateChatHistory(chatId, messages);
  updateChatTitle(chatId, title);
  saveMessages(messages);
};

// Load chat
export const loadChat = (chatId: string): IMessage[] => {
  const chat = getChatHistoryById(chatId);
  if (chat) {
    saveMessages(chat.messages);
    return chat.messages;
  }
  return [];
};

// Delete chat
export const deleteChat = (chatId: string) => {
  deleteChatHistory(chatId);
  saveMessages([]);
};

// Update chat title
export const updateTitle = async (chatId: string, messages: IMessage[]) => {
  const title = await generateChatTitle(messages);
  updateChatTitle(chatId, title);
}; 