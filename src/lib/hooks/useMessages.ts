import { useOpenAIMessages } from './useOpenAIMessages';
import { IMessage } from '@/types';

export const useMessages = (
  setInputValue: (value: string) => void,
  initialMessages: IMessage[],
  currentChatId: string
) => {
  return useOpenAIMessages(setInputValue, initialMessages, currentChatId);
};
