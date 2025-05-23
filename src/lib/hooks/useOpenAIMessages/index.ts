import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { IMessage } from '@/types';
import { updateChat } from '@/lib/utils/chat-management';
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
    if (initialMessages.length > 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  const submitUserMessage = useCallback(async (message: string) => {
    if (isStreaming) return;

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
      const response = await fetch('/api/openai-bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: prepareMessagesForOpenAI(updatedMessages),
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

      setMessages(prev => [...prev, initialAssistantMessage]);
      assistantMessageId = initialAssistantMessage.id ?? null;
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
              const assistantMessage = newMessages.find(msg => msg.id === assistantMessageId);
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
    messages,
    isStreaming,
    streamedMessageId,
    setMessages
  };
};
