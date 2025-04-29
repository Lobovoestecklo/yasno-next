'use client';

import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { IMessage, UseMessagesResult } from '@/types';
import { updateChatHistory } from '@/lib/utils/chat-history';
import { prepareMessagesForOpenAI } from '@/lib/utils/openai';

export const useOpenAIMessages = (
  setInputValue: (value: string) => void,
  initialMessages: IMessage[],
  currentChatId: string
): UseMessagesResult => {
  const [messages, setMessages] = useState<IMessage[]>(initialMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedMessageId, setStreamedMessageId] = useState<string | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingRound, setTrainingRound] = useState(0);

  useEffect(() => {
    if (Array.isArray(initialMessages)) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  const finalizeTrainingCase = useCallback(() => {
    const analysisMessage: IMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: `Тренировка завершена.
Вот моя обратная связь: ...
Предлагаю следующую тренировочную ситуацию: ...`,
    };
    setMessages((prev) => {
      const updated = [...prev, analysisMessage];
      updateChatHistory(currentChatId, updated);
      return updated;
    });
    setIsTraining(false);
    setTrainingRound(0);
  }, [currentChatId]);

  const sendMessageToAPI = async (body: object) => {
    const response = await fetch('/api/openai-bot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok || !response.body) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.body.getReader();
  };

  const handleStreamingResponse = async (
    reader: ReadableStreamDefaultReader<Uint8Array>,
    assistantMessageId: string
  ) => {
    const decoder = new TextDecoder();
    let assistantContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = JSON.parse(line.slice(6));
        if (data.type === 'content_block_delta' && data.delta.type === 'text_delta') {
          assistantContent += data.delta.text;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: assistantContent }
                : msg
            )
          );
        }
      }
    }

    setMessages((prev) => {
      const final = prev.map((msg) =>
        msg.id === assistantMessageId ? { ...msg, content: assistantContent } : msg
      );
      updateChatHistory(currentChatId, final);
      return final;
    });
  };

  const submitUserMessage = useCallback(
    async (message: string) => {
      if (isStreaming) return;

      const userMessage: IMessage = {
        id: uuidv4(),
        role: 'user',
        content: message,
      };

      setIsStreaming(true);
      setInputValue('');
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      updateChatHistory(currentChatId, updatedMessages);

      try {
        const reader = await sendMessageToAPI({ messages: prepareMessagesForOpenAI(updatedMessages) });

        const assistantMessage: IMessage = {
          id: uuidv4(),
          role: 'assistant',
          content: '',
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setStreamedMessageId(String(assistantMessage.id));

        await handleStreamingResponse(reader, String(assistantMessage.id));
      } catch (error) {
        console.error('Error submitting message:', error);
        alert('Что-то пошло не так!');
        setMessages((prev) => {
          const filtered = prev.filter((msg) => msg.id !== userMessage.id);
          updateChatHistory(currentChatId, filtered);
          return filtered;
        });
      } finally {
        setIsStreaming(false);
        setStreamedMessageId(null);
      }
    },
    [messages, isStreaming, currentChatId, setInputValue]
  );

  const submitTrainingCase = useCallback(
    async (message: string) => {
      if (!isTraining) {
        setIsTraining(true);
        setTrainingRound(0);
        const instruction: IMessage = {
          id: uuidv4(),
          role: 'assistant',
          content: `Начинается тренировочный кейс. В течение 7 реплик мы будем вести диалог,
после чего я дам обратную связь и предложу следующую тренировочную ситуацию.`,
        };
        setMessages((prev) => {
          const updated = [...prev, instruction];
          updateChatHistory(currentChatId, updated);
          return updated;
        });
      }

      const userMessage: IMessage = {
        id: uuidv4(),
        role: 'user',
        content: message,
      };

      setInputValue('');
      setIsStreaming(true);
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      updateChatHistory(currentChatId, updatedMessages);

      try {
        const reader = await sendMessageToAPI({
          messages: prepareMessagesForOpenAI(updatedMessages),
          training: true,
        });

        const assistantMessage: IMessage = {
          id: uuidv4(),
          role: 'assistant',
          content: '',
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setStreamedMessageId(String(assistantMessage.id));

        await handleStreamingResponse(reader, String(assistantMessage.id));

        setTrainingRound((prev) => {
          const next = prev + 1;
          if (next >= 7) finalizeTrainingCase();
          return next;
        });
      } catch (error) {
        console.error('Error in training mode:', error);
        alert('Ошибка при отправке тренировочного сообщения!');
        setMessages((prev) => {
          const filtered = prev.filter((msg) => msg.id !== userMessage.id);
          updateChatHistory(currentChatId, filtered);
          return filtered;
        });
      } finally {
        setIsStreaming(false);
      }
    },
    [isTraining, messages, currentChatId, setInputValue, finalizeTrainingCase]
  );

  const submitUserMessageWrapper = useCallback(
    async (message: string) => {
      if (isTraining) {
        await submitTrainingCase(message);
      } else {
        await submitUserMessage(message);
      }
    },
    [isTraining, submitTrainingCase, submitUserMessage]
  );

  return {
    messages,
    setMessages,
    isStreaming,
    streamedMessageId,
    submitUserMessage: submitUserMessageWrapper,
    submitTrainingCase,
    finalizeTrainingCase,
    isTraining,
    trainingRound,
  };
};
