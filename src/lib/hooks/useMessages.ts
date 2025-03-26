import { useAnthropicMessages } from './useAnthropicMessages';
import { useOpenAIMessages } from './useOpenAIMessages';
import { isOpenAIActive } from '@/lib/constants/llm-provider';
import { IMessage } from '@/types';

// Factory function to get the appropriate message hook based on active provider
export const useMessages = (
  setInputValue: (value: string) => void,
  initialMessages: IMessage[],
  currentChatId: string
) => {
  // Use OpenAI or Anthropic based on the feature flag
  if (isOpenAIActive()) {
    return useOpenAIMessages(setInputValue, initialMessages, currentChatId);
  }
  
  // Default to Anthropic
  return useAnthropicMessages(setInputValue, initialMessages, currentChatId);
};