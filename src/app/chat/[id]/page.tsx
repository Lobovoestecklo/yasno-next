'use client';

import React, {
  useState,
  KeyboardEvent,
  useEffect,
  useRef,
  useCallback,
  Suspense,
} from 'react';
import { useMessages } from '@/lib/hooks/useMessages';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from '@/components/ui/card';
import { IMessage } from '@/types';
import { useParams } from 'next/navigation';
import { startNewChat } from '@/lib/utils/chat-management';
import { SidebarToggle } from '@/components/chat-history/sidebar-toggle';
import { INITIAL_BOT_MESSAGE } from '@/lib/constants';
import { ChatLoading } from '@/components/ui/chat-loading';
import { loadChat } from '@/lib/utils/chat-history';
import { FormattedResponse } from '@/components/FormattedResponse';

const PREDEFINED_MESSAGE = 'режим тренировки';

export default function ChatPage() {
  const params = useParams();
  const chatId = params.id as string;

  const [input, setInput] = useState('');
  const [initialMessages, setInitialMessages] = useState<IMessage[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>(chatId);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    setMessages,
    submitUserMessage,
    submitTrainingCase,
    isStreaming,
  } = useMessages(setInput, initialMessages, currentChatId);

  // Прокрутка вниз при новом сообщении
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const initializeChat = async () => {
      let defaultMessages = [INITIAL_BOT_MESSAGE];
      try {
        if (chatId === 'new') {
          const newChatId = await startNewChat(defaultMessages);
          setCurrentChatId(newChatId);
          setInitialMessages(defaultMessages);
          setMessages(defaultMessages);
          window.history.replaceState({}, '', `/chat/${newChatId}`);
        } else {
          const chatMessages = loadChat(chatId);
          if (chatMessages && chatMessages.length > 0) {
            setInitialMessages(chatMessages);
            setMessages(chatMessages);
            setCurrentChatId(chatId);
          } else {
            const newChatId = await startNewChat(defaultMessages);
            setInitialMessages(defaultMessages);
            setMessages(defaultMessages);
            setCurrentChatId(newChatId);
            window.history.replaceState({}, '', `/chat/${newChatId}`);
          }
        }
      } catch (e) {
        console.error('Error initializing chat:', e);
      } finally {
        setIsLoading(false);
      }
    };

    initializeChat();
  }, [chatId, setMessages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    await submitUserMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  const handlePredefinedMessage = async () => {
    await submitTrainingCase(PREDEFINED_MESSAGE);
    setInput('');
  };

  if (isLoading) return <ChatLoading />;

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
            <Suspense fallback={<ChatLoading />}>
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
            </Suspense>
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
