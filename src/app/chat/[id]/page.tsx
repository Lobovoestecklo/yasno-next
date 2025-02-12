'use client';

import React, { useState, KeyboardEvent, useEffect, useRef, useCallback } from 'react';
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
import { loadChat, updateChat } from '@/lib/utils/chat-management';
import { SidebarToggle } from '@/components/chat-history/sidebar-toggle';
import { INITIAL_BOT_MESSAGE } from '@/lib/constants';

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

  const {
    messages,
    submitUserMessage,
    submitScenario,
    isStreaming,
    setMessages
  } = useAnthropicMessages(setInput, initialMessages, saveMessages, getSavedMessages);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Scroll when messages change or when streaming
  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming, scrollToBottom]);

  useEffect(() => {
    const initializeChat = async () => {
      if (chatId === 'new') {
        const existingMessages = getSavedMessages();
        if (existingMessages.length > 0) {
          // If there are saved messages, create a new chat with them
          const newChatId = addChatToHistory(existingMessages, 'Новый чат');
          router.replace(`/chat/${newChatId}`, { scroll: false });
        } else {
          // If no saved messages, create a new chat with initial message
          const newChatId = addChatToHistory([INITIAL_BOT_MESSAGE], 'Новый чат');
          setInitialMessages([INITIAL_BOT_MESSAGE]);
          router.replace(`/chat/${newChatId}`, { scroll: false });
        }
        return;
      }

      // Handle existing chat
      const chatMessages = loadChat(chatId);
      if (chatMessages.length > 0) {
        setInitialMessages(chatMessages);
      } else {
        router.push('/');
      }
    };

    initializeChat();
  }, [chatId, router]);

  // Add a debug log for messages state changes
  useEffect(() => {
    console.log('Current messages:', messages);
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      const userMessage: IMessage = {
        role: 'user',
        content: input.trim(),
        id: Date.now().toString()
      };

      // Update messages immediately with user message
      setMessages(prev => [...prev, userMessage]);
      
      // Clear input right away
      setInput('');
      
      // Submit message and handle response
      await submitUserMessage(input);

      // Update chat in persistent storage
      if (chatId && chatId !== 'new') {
        await updateChat(chatId, messages);
      }
    }
  };

  const handlePredefinedMessage = (message: string) => {
    if (!chatId) return;
    
    const userMessage: IMessage = {
      role: 'user',
      content: message,
      id: Date.now().toString()
    };

    // Update messages immediately
    setMessages(prev => [...prev, userMessage]);
    
    // Submit message
    submitUserMessage(message);
    
    // Update chat storage
    if (chatId !== 'new') {
      updateChat(chatId, [...messages, userMessage]);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  const handleScenarioSubmit = (content: string) => {
    if (!chatId) return;
    submitScenario(content);
    updateChat(chatId, [...messages, { role: 'user', content, id: Date.now().toString(), is_scenario: true }]);
  };

  return (
    <Card className="relative min-h-[calc(100vh-3rem)] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between bg-black text-white p-4">
        <div className="flex items-center gap-2">
          <SidebarToggle />
          <h1 className="text-xl font-semibold">Сценарный Коуч</h1>
        </div>
        <ClearChatHistoryDialog onAccept={clearMessagesAndReload} />
      </CardHeader>

      <CardContent className="p-4 md:p-6 space-y-4 h-[calc(100vh-256px)] md:h-[calc(100vh-364px)] overflow-y-auto">
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
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${msg.role === 'assistant'
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-primary text-primary-foreground'
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
      </CardContent>

      <CardFooter className="border-t p-4 md:p-6">
        <div className="flex flex-col w-full gap-4">
          <div className="flex gap-4 justify-center w-full">
            <Button
              variant="outline"
              className="flex-1 max-w-[300px] whitespace-normal h-auto py-2"
              onClick={() => handlePredefinedMessage(PREDEFINED_MESSAGES.IMPROVE_EXISTING)}
              disabled={isStreaming}
            >
              {PREDEFINED_MESSAGES.IMPROVE_EXISTING}
            </Button>
            <Button
              variant="outline"
              className="flex-1 max-w-[300px] whitespace-normal h-auto py-2"
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
                className="flex-1 min-h-[60px] max-h-[200px] resize-none"
                rows={2}
              />
              <Button type="submit" size="icon" className="h-[60px] w-[60px]" disabled={isStreaming}>
                <Send className="h-5 w-5" />
                <span className="sr-only">Отправить</span>
              </Button>
            </form>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
} 