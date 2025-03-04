import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

// temp comment

import { ANTHROPIC_HEADERS, ANTHROPIC_POST_BODY_PARAMS, ANTHROPIC_SYSTEM_MESSAGE, SCENARIO_MESSAGE_PREFIX } from '@/lib/constants';
import { prepareMessagesForPost } from '@/lib/utils/anthropic';
import { IMessage } from '@/types';
import { updateChat } from '@/lib/utils/chat-management';

export const useAnthropicMessages = (
  setInputValue: (value: string) => void,
  initialMessages: IMessage[],
  currentChatId: string
) => {
  const [messages, setMessages] = useState<IMessage[]>(initialMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedMessageId, setStreamedMessageId] = useState<string | null>(null);

  useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  const submitScenario = useCallback(async (scenario: string) => {
    const scenarioMessage: IMessage = {
      id: uuidv4(),
      is_scenario: true,
      role: 'user',
      content: `${SCENARIO_MESSAGE_PREFIX}\n${scenario}`,
    }
    setMessages((prev) => {
      const newMessages = [...prev, scenarioMessage];
      updateChat(currentChatId, newMessages);
      return newMessages;
    });
  }, [currentChatId])

  const submitUserMessage = useCallback(async (message: string) => {
    if (isStreaming) {
      return;
    }

    const userMessage: IMessage = {
      id: uuidv4(),
      role: 'user',
      content: message,
    };

    setIsStreaming(true);

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    updateChat(currentChatId, updatedMessages);
    setInputValue('');

    try {
      const response = await fetch('/api/bot', {
        method: 'POST',
        headers: {
          ...ANTHROPIC_HEADERS,
        },
        body: JSON.stringify({
          ...ANTHROPIC_POST_BODY_PARAMS,
          messages: prepareMessagesForPost(updatedMessages),
          system: ANTHROPIC_SYSTEM_MESSAGE,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      let assistantMessageId: string | null = null;
      let assistantMessageContent = '';

      const initialAssistantMessage: IMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: '',
      };

      setMessages(prev => {
        const newMessages = [...prev, initialAssistantMessage];
        return newMessages;
      });

      assistantMessageId = initialAssistantMessage.id || null;
      setStreamedMessageId(assistantMessageId);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          const data = JSON.parse(line.slice(6));
          if (data.type === 'content_block_delta' && data.delta.type === 'text_delta') {
            assistantMessageContent += data.delta.text;
            setMessages(prev => {
              const newMessages = [...prev];
              const assistantMessage = newMessages.find(msg => msg.id && msg.id === assistantMessageId);
              if (assistantMessage) {
                assistantMessage.content = assistantMessageContent;
              }
              return newMessages;
            });
          }
        }
      }

      return new Promise<void>((resolve) => {
        setMessages(prev => {
          const finalMessages = prev.map(msg =>
            msg.id === assistantMessageId
              ? { ...msg, content: assistantMessageContent }
              : msg
          );

          // After assistant response is complete, always update chat
          updateChat(currentChatId, finalMessages).catch(console.error);

          resolve();
          return finalMessages;
        });
      });

    } catch (error) {
      console.error('Error submitting message:', error);
      alert('Что-то пошло не так, попробуйте еще раз!');
      setMessages(prev => {
        const newMessages = prev.filter(msg => msg.id !== userMessage.id);
        updateChat(currentChatId, newMessages).catch(console.error);
        return newMessages;
      });
      throw error;
    } finally {
      setIsStreaming(false);
      setStreamedMessageId(null);
    }
  }, [messages, setInputValue, isStreaming, currentChatId]);

  return {
    submitUserMessage,
    submitScenario,
    messages,
    isStreaming,
    streamedMessageId,
    setMessages
  };
};
