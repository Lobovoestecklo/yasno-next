import { IMessage } from '@/types';
import { 
  addChatToHistory, 
  updateChatHistory, 
  getChatHistoryById,
  updateChatTitle,
  deleteChatHistory 
} from './chat-history';
import { generateChatTitle } from './generate-chat-title';
import { saveMessages, getSavedMessages } from './local-storage-chat-messages';
import { INITIAL_BOT_MESSAGE } from '../constants';

// Start a new chat
export const startNewChat = async (initialMessages: IMessage | IMessage[]) => {
  // Make sure to use the entire array if available
  const messages = Array.isArray(initialMessages) ? initialMessages : [initialMessages];
  
  // Create chat with temporary title first
  const chatId = addChatToHistory(messages, 'Новый чат');
  saveMessages(messages);
  return chatId;
};

// Update existing chat
export const updateChat = async (chatId: string, messages: IMessage[]) => {
  // Always update messages first
  updateChatHistory(chatId, messages);
  saveMessages(messages);
  
  // Generate new title if we have a conversation (more than just initial message)
  if (messages.length > 1) {
    const hasUserMessages = messages.some(msg => msg.role === 'user');
    const hasAssistantMessages = messages.some(msg => msg.role === 'assistant' && msg.id !== INITIAL_BOT_MESSAGE.id);
    
    if (hasUserMessages && hasAssistantMessages) {
      const title = await generateChatTitle(messages);
      updateChatTitle(chatId, title);
    }
  }
};

// Load chat
export const loadChat = (chatId: string): IMessage[] => {
  // First try to get from chat history
  const chat = getChatHistoryById(chatId);
  if (chat && chat.messages.length > 0) {
    const messages = chat.messages[0]?.id === INITIAL_BOT_MESSAGE.id
      ? chat.messages
      : [INITIAL_BOT_MESSAGE, ...chat.messages];
    saveMessages(messages); // Sync with local storage
    return messages;
  }

  // If not in chat history, try local storage
  const savedMessages = getSavedMessages();
  if (savedMessages && savedMessages.length > 0) {
    // Update chat history with saved messages
    updateChatHistory(chatId, savedMessages);
    return savedMessages;
  }

  // If no messages found anywhere, return empty array
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