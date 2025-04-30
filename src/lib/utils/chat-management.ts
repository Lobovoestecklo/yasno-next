import { IMessage } from '@/types';
import {
  addChatToHistory,
  updateChatHistory,
  updateChatTitle,
  deleteChatHistory,
  getAllChatHistories
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
  console.log('🔄 UPDATE CHAT CALLED:', { 
    chatId,
    messageCount: messages.length,
    messageTypes: messages.map(m => m.role)
  });
  
  // Always update messages first
  updateChatHistory(chatId, messages);

  // Count user messages
  const userMessagesCount = messages.filter(msg => msg.role === 'user').length;
  
  // Get current chat to check if title was already generated
  const currentChat = getAllChatHistories().find(chat => chat.id === chatId);
  const titleWasGenerated = currentChat?.title !== 'Новый чат';
  
  console.log('🏷️ TITLE GENERATION CHECK:', {
    userMessagesCount,
    hasUserMessages: messages.some(msg => msg.role === 'user'),
    totalMessages: messages.length,
    chatId,
    titleWasGenerated
  });

  // Generate title only if:
  // 1. We have at least one user message
  // 2. User has sent less than 4 messages
  // 3. Title hasn't been generated yet
  if (userMessagesCount > 0 && userMessagesCount < 4 && !titleWasGenerated) {
    try {
      console.log('🚀 STARTING TITLE GENERATION for chat:', chatId);
      const title = await generateChatTitle(messages);
      console.log('✨ GENERATED TITLE:', { chatId, title });
      
      if (title && title !== 'Новый чат') {
        console.log('💾 UPDATING CHAT TITLE:', { chatId, title });
        updateChatTitle(chatId, title);
        // Trigger storage event for other tabs
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'chat-history',
          newValue: JSON.stringify(getAllChatHistories())
        }));
      } else {
        console.log('⚠️ SKIPPING TITLE UPDATE - title is empty or default');
      }
    } catch (error) {
      console.error('❌ FAILED TO GENERATE CHAT TITLE:', error);
    }
  } else {
    console.log('⏳ SKIPPING TITLE GENERATION:', {
      userMessagesCount,
      titleWasGenerated,
      reason: userMessagesCount >= 4 ? 'too many messages' : titleWasGenerated ? 'title already generated' : 'no user messages'
    });
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