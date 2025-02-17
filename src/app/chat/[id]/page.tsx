'use client';

import React, { useState, KeyboardEvent, useEffect, useRef, useCallback, Suspense } from 'react';
import { useAnthropicMessages } from '@/lib/hooks/useAnthropicMessages';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import ScenarioDialog from '@/components/scenario-dialog';
import { FormattedResponse } from '@/components/FormattedResponse';
import { getSavedMessages, saveMessages, clearMessagesAndReload, addChatToHistory } from '@/lib/utils/local-storage-chat-messages';
import ClearChatHistoryDialog from '@/components/clear-chat-history-dialog';
import { IMessage } from '@/types';
import { useRouter, useParams } from 'next/navigation';
import { loadChat, updateChat, startNewChat } from '@/lib/utils/chat-management';
import { SidebarToggle } from '@/components/chat-history/sidebar-toggle';
import { INITIAL_BOT_MESSAGE } from '@/lib/constants';
import { ChatLoading } from '@/components/ui/chat-loading';

const PREDEFINED_MESSAGES = {
  IMPROVE_EXISTING: "У меня уже есть сценарий и я хочу его улучшить",
  CREATE_NEW: "У меня нет сценария, я создаю все с нуля"
} as const;

export default function ChatPage() {
  const params = useParams();
  const chatId = params.id as string;
  const [input, setInput] = useState("");
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [initialMessages, setInitialMessages] = useState<IMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentChatId, setCurrentChatId] = useState<string>(chatId);

  const {
    messages,
    setMessages,
    submitUserMessage,
    submitScenario,
    isStreaming
  } = useAnthropicMessages(setInput, initialMessages, saveMessages, currentChatId);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Scroll when messages change or when streaming
  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming, scrollToBottom]);

  useEffect(() => {
    const initializeChat = async () => {
      try {
        if (chatId === 'new') {
          // For new chats, start with initial message and create chat entry
          const defaultMessages = [INITIAL_BOT_MESSAGE];
          setInitialMessages(defaultMessages);
          setMessages(defaultMessages);
          
          // Create new chat entry with temporary title
          const newChatId = await startNewChat(defaultMessages);
          setCurrentChatId(newChatId);
          
          // Update URL without causing a reload
          window.history.replaceState({}, '', `/chat/${newChatId}`);
        } else {
          setCurrentChatId(chatId);
          // Load existing chat
          const chatMessages = loadChat(chatId);
          
          if (chatMessages && chatMessages.length > 0) {
            setInitialMessages(chatMessages);
            setMessages(chatMessages);
          } else {
            // If chat not found or empty, start a new chat
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
        // Handle error gracefully - start a new chat
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

  // Update chat history when messages change, but not during streaming
  useEffect(() => {
    const updateChatIfNeeded = async () => {
      if (currentChatId && messages.length > 0 && !isLoading && !isStreaming) {
        await updateChat(currentChatId, messages);
      }
    };
    updateChatIfNeeded();
  }, [currentChatId, messages, isLoading, isStreaming]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      // Clear input right away
      setInput('');
      
      // Submit message and handle response
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

  const handleScenarioSubmit = (content: string) => {
    if (!currentChatId) return;
    submitScenario(content);
    updateChat(currentChatId, [...messages, { role: 'user', content, id: Date.now().toString(), is_scenario: true }]);
  };

  const handleClearHistory = useCallback(() => {
    clearMessagesAndReload();
    router.push('/');
  }, [router]);

  if (isLoading) {
    return <ChatLoading />;
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="w-[800px] max-w-[calc(100vw-2rem)] h-[calc(100vh-2rem)] mx-auto">
        <Card className="h-full flex flex-col bg-white shadow-lg rounded-[20px]">
          <CardHeader className="flex-none flex flex-row items-center justify-between bg-black text-white p-4 sticky top-0 z-10 rounded-t-[20px]">
            <div className="flex items-center gap-2">
              <SidebarToggle />
              <h1 className="text-xl font-semibold">Скриптантино</h1>
            </div>
            <ClearChatHistoryDialog onAccept={handleClearHistory} />
          </CardHeader>

          <CardContent className="flex-1 p-4 space-y-4 overflow-y-auto min-h-0">
            <Suspense fallback={<ChatLoading />}>
              {messages.map((msg) => {
                if (msg.is_scenario) {
                  return null;
                }
                return (
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
                      {msg.role === 'assistant' ? (
                        <FormattedResponse content={msg.content} />
                      ) : (
                        <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </Suspense>
          </CardContent>

          <CardFooter className="flex-none border-t p-4">
            <div className="flex flex-col w-full gap-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-between w-full">
                <Button
                  variant="outline"
                  className="flex-1 whitespace-normal h-auto py-3 text-sm sm:text-base rounded-[12px] border-2"
                  onClick={() => handlePredefinedMessage(PREDEFINED_MESSAGES.IMPROVE_EXISTING)}
                  disabled={isStreaming}
                >
                  {PREDEFINED_MESSAGES.IMPROVE_EXISTING}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 whitespace-normal h-auto py-3 text-sm sm:text-base rounded-[12px] border-2"
                  onClick={() => handlePredefinedMessage(PREDEFINED_MESSAGES.CREATE_NEW)}
                  disabled={isStreaming}
                >
                  {PREDEFINED_MESSAGES.CREATE_NEW}
                </Button>
              </div>

              <div className="flex w-full gap-2 items-center">
                <form onSubmit={sendMessage} className="flex w-full gap-2 items-center relative">
                  <ScenarioDialog onSubmit={handleScenarioSubmit} scenario={null} />
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Введите сообщение... (Shift + Enter для новой строки)"
                    className="flex-1 min-h-[50px] max-h-[200px] resize-none text-sm md:text-base leading-relaxed"
                    rows={2}
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    className="h-[50px] w-[50px] flex-shrink-0" 
                    disabled={isStreaming}
                  >
                    <Send className="h-4 w-4" />
                    <span className="sr-only">Отправить</span>
                  </Button>
                </form>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
} 