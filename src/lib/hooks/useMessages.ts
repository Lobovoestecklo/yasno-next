import { useOpenAIMessages } from './useOpenAIMessages/useOpenAIMessages';
import { IMessage, UseMessagesResult } from '@/types';

export const useMessages = (
  setInputValue: (value: string) => void,
  initialMessages: IMessage[],
  currentChatId: string
): UseMessagesResult => {
  console.log('🎣 useMessages hook initialized:', {
    hasInitialMessages: initialMessages.length > 0,
    currentChatId
  });
  
  const hook = useOpenAIMessages(setInputValue, initialMessages, currentChatId);

  return {
    messages: hook.messages,
    setMessages: hook.setMessages,
    isStreaming: hook.isStreaming,
    streamedMessageId: hook.streamedMessageId,
    submitUserMessage: hook.submitUserMessage,
    submitTrainingCase: hook.submitTrainingCase,
    finalizeTrainingCase: hook.finalizeTrainingCase,
    isTraining: hook.isTraining,
    trainingRound: hook.trainingRound
  };
};
