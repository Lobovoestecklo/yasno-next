import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';


import { ANTHROPIC_HEADERS, ANTHROPIC_POST_BODY_PARAMS, ANTHROPIC_SYSTEM_MESSAGE, SCENARIO_MESSAGE_PREFIX } from '@/lib/constants';
import { prepareMessagesForPost } from '@/lib/utils/anthropic';
import { IMessage } from '@/types';

export const useAnthropicMessages = (
  setInputValue: (value: string) => void,
  localStorageMessages: IMessage[],
  saveMessages: (messages: IMessage[]) => void,
  getSavedMessages: () => IMessage[]
) => {
  const [messages, setMessages] = useState<IMessage[]>(localStorageMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedMessageId, setStreamedMessageId] = useState<string | null>(null);

  const submitScenario = useCallback(async (scenario: string) => {
    const scenarioMessage: IMessage = {
      id: uuidv4(),
      is_scenario: true,
      role: 'user',
      content: `${SCENARIO_MESSAGE_PREFIX}\n${scenario}`,
    }
    setMessages((prev) => {
      const newMessages = [...prev, scenarioMessage];
      saveMessages(newMessages);
      return newMessages;
    });
  }, [messages])

  const submitUserMessage = useCallback(async (message: string) => {
    const userMessage: IMessage = {
      id: uuidv4(),
      role: 'user',
      content: message,
    };
    setMessages((prev) => {
      const newMessages = [...prev, userMessage];
      saveMessages(newMessages);
      return newMessages;
    });
    setInputValue('');
    setIsStreaming(true);

    const messagesToPost = prepareMessagesForPost([...messages, userMessage]);

    try {
      const response = await fetch('/api/bot', {
        method: 'POST',
        headers: {
          ...ANTHROPIC_HEADERS,
        },
        body: JSON.stringify({
          ...ANTHROPIC_POST_BODY_PARAMS,
          messages: messagesToPost,
          system: ANTHROPIC_SYSTEM_MESSAGE,
        }),
      });

      if (!response.ok) {
        console.log(`HTTP error! status: ${response.status}`);
        alert('Что-то пошло не так, попробуйте еще раз!')
      }

      const reader = response.body?.getReader();
      if (!reader) {
        console.log('Response body is not readable');
        alert('Что-то пошло не так, попробуйте еще раз!')
        return;
      }

      let assistantMessageId: string | null = null;
      let assistantMessageContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'message_stop' && assistantMessageId) {
              saveMessages([...getSavedMessages(), {
                id: assistantMessageId,
                role: 'assistant',
                content: assistantMessageContent,
              }]);
            }
            if (data.type === 'message_start') {
              assistantMessageId = data.message.id;
              setStreamedMessageId(assistantMessageId);
            } else if (data.type === 'content_block_delta' && data.delta.type === 'text_delta') {
              assistantMessageContent += data.delta.text;
              setMessages((prev) => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage.role === 'assistant' && lastMessage.id === assistantMessageId) {
                  lastMessage.content = assistantMessageContent;
                } else {
                  newMessages.push({
                    id: assistantMessageId || uuidv4(),
                    role: 'assistant',
                    content: assistantMessageContent,
                  });
                }
                return newMessages;
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error submitting message:', error);
      alert('Что-то пошло не так, попробуйте еще раз!');
    } finally {
      setIsStreaming(false);
      setStreamedMessageId(null);
    }
  }, [messages, setInputValue]);

  useEffect(() => {
    setMessages(localStorageMessages);
  }, [localStorageMessages])

  return {
    submitUserMessage,
    submitScenario,
    messages,
    isStreaming,
    streamedMessageId,
  };
};
