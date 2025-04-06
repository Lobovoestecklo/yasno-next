'use client';

import React, { useState, KeyboardEvent, useEffect, useRef, useCallback, Suspense } from 'react';
import { useMessages } from '@/lib/hooks/useMessages';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { IMessage } from '@/types';
import { useRouter, useParams } from 'next/navigation';
import { updateChat, startNewChat } from '@/lib/utils/chat-management';
import { SidebarToggle } from '@/components/chat-history/sidebar-toggle';
import { INITIAL_BOT_MESSAGE } from '@/lib/constants';
import { ChatLoading } from '@/components/ui/chat-loading';
import { loadChat } from '@/lib/utils/chat-history';

const PREDEFINED_MESSAGE = "режим тренировки";

export default function ChatPage() {
  const params = useParams();
  const chatId = params.id as string;
  const [input, setInput] = useState("");
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [initialMessages, setInitialMessages] = useState<IMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentChatId, setCurrentChatId] = useState<string>(chatId);

  const { messages, setMessages, submitUserMessage, isStreaming } = useMessages(setInput, initialMessages, currentChatId);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming, scrollToBottom]);

  useEffect(() => {
    const initializeChat = async () => {
      try {
        if (chatId === 'new') {
          const defaultMessages = [INITIAL_BOT_MESSAGE];
          setInitialMessages(defaultMessages);
          setMessages(defaultMessages);

          const newChatId = await startNewChat(defaultMessages);
          setCurrentChatId(newChatId);
          window.history.replaceState({}, '', `/chat/${newChatId}`);
        } else {
          setCurrentChatId(chatId);
          const chatMessages = loadChat(chatId);
          if (chatMessages && chatMessages.length > 0) {
            setInitialMessages(chatMessages);
            setMessages(chatMessages);
          } else {
            const defaultMessages = [INITIAL_BOT_MESSAGE];
            setInitialMessages(defaultMessages);
            setMessages(defaultMessages);
            const newChatId = await startNewChat(defaultMessages);
            setCurrentChatId(newChatId);
            window.history.replaceState({}, '', `/chat/${newChatId}`);
          }
        }
      } catch (error) {
        console.error('Error initializing chat:', error);
        const defaultMessages = [INITIAL_BOT_MESSAGE];
        setInitialMessages(defaultMessages);
        setMessages(defaultMessages);
        const newChatId = await startNewChat(defaultMessages);
        setCurrentChatId(newChatId);
        window.history.replaceState({}, '', `/chat/${newChatId}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (typeof window !== 'undefined') {
      initializeChat();
    }
  }, [chatId, setMessages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      await submitUserMessage(input);
    }
  };

  const handlePredefinedMessage = (message: string) => {
    if (!currentChatId) return;
    submitUserMessage(message);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  const handleClearHistory = () => {
    console.log('История очищена!');
    // Добавьте логику очистки, если требуется
  };

  if (isLoading) {
    return <ChatLoading />;
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="w-[900px] max-w-[calc(100vw-2rem)] h-[calc(100vh-2rem)] mx-auto">
        <Card className="h-full flex flex-col bg-white shadow-lg rounded-[20px]">
          {/* Шапка */}
          <CardHeader className="flex-none flex flex-row items-center justify-between bg-black text-white p-4 sticky top-0 z-10 rounded-t-[20px]">
            <div className="flex items-center gap-2">
              <SidebarToggle />
              <h1 className="text-xl font-semibold">Коммуникационный коуч</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => handlePredefinedMessage(PREDEFINED_MESSAGE)}
                className="text-black border-white px-4 py-1 rounded"
              >
                {PREDEFINED_MESSAGE}
              </Button>
            </div>
          </CardHeader>

          {/* Содержимое чата */}
          <CardContent className="flex-1 p-4 space-y-4 overflow-y-auto min-h-0">
            <Suspense fallback={<ChatLoading />}>
              {messages.map((msg) =>
                msg.is_scenario ? null : (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[80%] rounded-[16px] px-4 py-2 ${
                        msg.role === 'assistant'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-black text-white'
                      }`}
                    >
                      <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                )
              )}
              <div ref={messagesEndRef} />
            </Suspense>
          </CardContent>

          {/* Поле ввода и кнопка отправки */}
          <CardFooter className="flex-none border-t p-4">
            <form onSubmit={sendMessage} className="relative flex items-center w-full">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Введите сообщение... (Shift + Enter для новой строки)"
                rows={2}
                className="flex-1 min-h-[50px] max-h-[200px] resize-none text-sm md:text-base leading-relaxed pr-10 bg-transparent border-none outline-none focus:ring-0 whitespace-pre-wrap"
              />
              <button
                type="submit"
                disabled={isStreaming}
                className="absolute right-2 bottom-3 p-0 m-0 bg-transparent border-none cursor-pointer text-gray-500 hover:text-gray-700"
              >
                <Send className="h-8 w-8" />
                <span className="sr-only">Отправить</span>
              </button>
            </form>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
