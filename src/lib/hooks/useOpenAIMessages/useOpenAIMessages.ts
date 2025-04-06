'use client';

import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { IMessage } from '@/types';
import { updateChatHistory } from '@/lib/utils/chat-history';
import { prepareMessagesForOpenAI } from '@/lib/utils/openai';

export const useOpenAIMessages = (
  setInputValue: (value: string) => void,
  initialMessages: IMessage[],
  currentChatId: string
) => {
  const [messages, setMessages] = useState<IMessage[]>(initialMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedMessageId, setStreamedMessageId] = useState<string | null>(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  const submitUserMessage = useCallback(async (message: string) => {
    if (isStreaming) return;

    const userMessage: IMessage = {
      id: uuidv4(),
      role: 'user',
      content: message,
    };

    setIsStreaming(true);

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    updateChatHistory(currentChatId, newMessages);
    setInputValue('');

    try {
      const response = await fetch('/api/openai-bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: prepareMessagesForOpenAI(newMessages),
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      let assistantMessageContent = '';

      const initialAssistantMessage: IMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: '',
      };

      setMessages((prev) => [...prev, initialAssistantMessage]);
      setStreamedMessageId(initialAssistantMessage.id ?? null);

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
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === initialAssistantMessage.id
                  ? { ...msg, content: assistantMessageContent }
                  : msg
              )
            );
          }
        }
      }

      setMessages((prev) => {
        const finalMessages = prev.map((msg) =>
          msg.id === initialAssistantMessage.id
            ? { ...msg, content: assistantMessageContent }
            : msg
        );
        updateChatHistory(currentChatId, finalMessages);
        return finalMessages;
      });
    } catch (error) {
      console.error('Error submitting message:', error);
      alert('Что-то пошло не так, попробуйте еще раз!');
      setMessages((prev) => {
        const filtered = prev.filter((msg) => msg.id !== userMessage.id);
        updateChatHistory(currentChatId, filtered);
        return filtered;
      });
      throw error;
    } finally {
      setIsStreaming(false);
      setStreamedMessageId(null);
    }
  }, [isStreaming, currentChatId, setInputValue, messages]);

  return {
    submitUserMessage,
    messages,
    isStreaming,
    streamedMessageId,
    setMessages,
  };
};
