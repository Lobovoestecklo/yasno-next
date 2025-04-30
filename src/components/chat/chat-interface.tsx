'use client';

import { useState, useRef, useEffect } from 'react';
import { IMessage } from '@/types';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { SidebarToggle } from '@/components/chat-history/sidebar-toggle';
import { ChatLoading } from '@/components/ui/chat-loading';
import { FormattedResponse } from '@/components/FormattedResponse';
import { useMessages } from '@/lib/hooks/useMessages';
import { updateChat } from '@/lib/utils/chat-management';

const PREDEFINED_MESSAGE = 'режим тренировки';

interface ChatInterfaceProps {
  messages: IMessage[];
  setMessages: React.Dispatch<React.SetStateAction<IMessage[]>>;
  initialMessages: IMessage[];
  currentChatId: string | null;
  isLoading: boolean;
}

export default function ChatInterface({
  messages,
  setMessages,
  initialMessages,
  currentChatId,
  isLoading
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { submitTrainingCase } = useMessages(setInput, initialMessages, currentChatId || '');

  // Initialize messages with initialMessages if they're empty
  useEffect(() => {
    console.log('🔄 Chat interface effect - initializing messages:', {
      currentMessages: messages.length,
      initialMessages: initialMessages.length,
      currentChatId
    });
    if (messages.length === 0 && initialMessages.length > 0) {
      setMessages(initialMessages);
    }
  }, [messages, initialMessages, setMessages]);

  // Save messages to chat history whenever they change
  useEffect(() => {
    console.log('💾 Chat interface effect - saving messages:', {
      messageCount: messages.length,
      currentChatId
    });
    if (currentChatId && messages.length > 0) {
      updateChat(currentChatId, messages);
    }
  }, [messages, currentChatId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e as unknown as React.FormEvent);
    }
  };

  const handlePredefinedMessage = async () => {
    console.log('🎯 Handling predefined message');
    if (isStreaming) return;
    
    const userMessage: IMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: PREDEFINED_MESSAGE,
      is_scenario: false
    };

    setMessages((prev: IMessage[]) => {
      const newMessages = [...prev, userMessage];
      if (currentChatId) {
        console.log('💾 Saving predefined message to history:', {
          chatId: currentChatId,
          messageCount: newMessages.length
        });
        updateChat(currentChatId, newMessages);
      }
      return newMessages;
    });
    setIsStreaming(true);

    try {
      const response = await fetch('/api/openai-bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          training: true
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response body is not readable');

      const assistantMessage: IMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        is_scenario: false
      };

      setMessages((prev: IMessage[]) => {
        const newMessages = [...prev, assistantMessage];
        if (currentChatId) {
          console.log('💾 Saving assistant message to history:', {
            chatId: currentChatId,
            messageCount: newMessages.length
          });
          updateChat(currentChatId, newMessages);
        }
        return newMessages;
      });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'content_block_delta' && data.delta.type === 'text_delta') {
              setMessages((prev: IMessage[]) => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage.role === 'assistant') {
                  if (!lastMessage.content.endsWith(data.delta.text)) {
                    lastMessage.content += data.delta.text;
                  }
                }
                if (currentChatId) {
                  updateChat(currentChatId, newMessages);
                }
                return newMessages;
              });
            }
          } catch (error) {
            console.error('Error parsing chunk:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsStreaming(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMessage: IMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      is_scenario: false
    };

    setMessages((prev: IMessage[]) => {
      const newMessages = [...prev, userMessage];
      if (currentChatId) {
        updateChat(currentChatId, newMessages);
      }
      return newMessages;
    });
    setInput('');
    setIsStreaming(true);

    try {
      const response = await fetch('/api/openai-bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          training: false
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response body is not readable');

      const assistantMessage: IMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        is_scenario: false
      };

      setMessages((prev: IMessage[]) => {
        const newMessages = [...prev, assistantMessage];
        if (currentChatId) {
          updateChat(currentChatId, newMessages);
        }
        return newMessages;
      });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'content_block_delta' && data.delta.type === 'text_delta') {
              setMessages((prev: IMessage[]) => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage.role === 'assistant') {
                  if (!lastMessage.content.endsWith(data.delta.text)) {
                    lastMessage.content += data.delta.text;
                  }
                }
                if (currentChatId) {
                  updateChat(currentChatId, newMessages);
                }
                return newMessages;
              });
            }
          } catch (error) {
            console.error('Error parsing chunk:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="w-[900px] max-w-[calc(100vw-2rem)] h-[calc(100vh-2rem)] mx-auto">
        <Card className="h-full flex flex-col bg-white shadow-lg rounded-[20px]">
          <CardHeader className="flex-none flex flex-row items-center justify-between bg-black text-white p-4 sticky top-0 z-10 rounded-t-[20px]">
            <div className="flex items-center gap-2">
              <SidebarToggle />
              <h1 className="text-xl font-semibold">Коммуникационный коуч</h1>
            </div>
            <Button
              variant="outline"
              onClick={handlePredefinedMessage}
              className="text-black border-white px-4 py-1 rounded"
              disabled={isStreaming}
            >
              {PREDEFINED_MESSAGE}
            </Button>
          </CardHeader>

          <CardContent className="flex-1 p-4 space-y-4 overflow-y-auto min-h-0">
            {isLoading ? (
              <ChatLoading />
            ) : (
              <>
                {messages.map(
                  (msg) =>
                    !msg.is_scenario && (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.role === 'assistant'
                            ? 'justify-start'
                            : 'justify-end'
                        }`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[80%] rounded-[16px] px-4 py-2 ${
                            msg.role === 'assistant'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-black text-white'
                          }`}
                        >
                          {msg.role === 'assistant' ? (
                            <FormattedResponse content={msg.content} />
                          ) : (
                            <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                              {msg.content}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </CardContent>

          <CardFooter className="flex-none border-t p-4">
            <form onSubmit={sendMessage} className="relative flex items-center w-full">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Введите сообщение... (Shift + Enter — новая строка)"
                rows={2}
                className="flex-1 min-h-[50px] max-h-[200px] resize-none text-sm md:text-base leading-relaxed pr-10 bg-transparent border-none outline-none focus:ring-0 whitespace-pre-wrap"
              />
              <button
                type="submit"
                disabled={isStreaming}
                className="absolute right-2 bottom-3 p-0 m-0 bg-transparent border-none cursor-pointer text-gray-500 hover:text-gray-700"
              >
                <Send className="h-8 w-8" />
              </button>
            </form>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
} 