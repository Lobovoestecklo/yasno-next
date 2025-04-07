import { useOpenAIMessages } from './useOpenAIMessages';
import { IMessage, UseMessagesResult } from '@/types';

export const useMessages = (
  setInputValue: (value: string) => void,
  initialMessages: IMessage[],
  currentChatId: string
): UseMessagesResult => {
  return useOpenAIMessages(setInputValue, initialMessages, currentChatId) as UseMessagesResult;
};
