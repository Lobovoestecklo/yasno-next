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
import { loadChat } from '@/lib/utils/chat-history';
import { SidebarToggle } from '@/components/chat-history/sidebar-toggle';
import { INITIAL_BOT_MESSAGE } from '@/lib/constants';
import { ChatLoading } from '@/components/ui/chat-loading';
import { FormattedResponse } from '@/components/FormattedResponse';
import ChatInterface from '@/components/chat/chat-interface';

const PREDEFINED_MESSAGE = 'режим тренировки';

export default function ChatPage() {
  const params = useParams();
  const chatId = params.id as string;
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [initialMessages, setInitialMessages] = useState<IMessage[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mounted = useRef(true);

  const {
    messages: chatMessages,
    setMessages: setChatMessages,
    submitUserMessage,
    submitTrainingCase,
    isStreaming,
  } = useMessages(setInput, initialMessages, currentChatId || '');

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
          // Создаем новый чат с приветственным сообщением
          const newChatId = await startNewChat(defaultMessages);
          setCurrentChatId(newChatId);
          setInitialMessages(defaultMessages);
          setChatMessages(defaultMessages);
          // Обновляем URL без перезагрузки страницы
          window.history.replaceState({}, '', `/chat/${newChatId}`);
        } else {
          // Загружаем существующий чат
          const chatMessages = loadChat(chatId);
          if (chatMessages && chatMessages.length > 0) {
            setInitialMessages(chatMessages);
            setChatMessages(chatMessages);
            setCurrentChatId(chatId);
          } else {
            // Если чат не найден, создаем новый
            const newChatId = await startNewChat(defaultMessages);
            setInitialMessages(defaultMessages);
            setChatMessages(defaultMessages);
            setCurrentChatId(newChatId);
            window.history.replaceState({}, '', `/chat/${newChatId}`);
          }
        }
      } catch (e) {
        console.error('Error initializing chat:', e);
        // В случае ошибки все равно создаем новый чат
        const newChatId = await startNewChat(defaultMessages);
        setInitialMessages(defaultMessages);
        setChatMessages(defaultMessages);
        setCurrentChatId(newChatId);
        window.history.replaceState({}, '', `/chat/${newChatId}`);
      } finally {
        setIsLoading(false);
      }
    };

    // Запускаем инициализацию только если mounted
    if (mounted.current) {
      initializeChat();
    }
  }, [chatId, setChatMessages, mounted]);

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
    <div className="flex flex-col h-screen">
      <ChatInterface
        messages={messages}
        setMessages={setMessages}
        initialMessages={initialMessages}
        currentChatId={currentChatId}
        isLoading={isLoading}
      />
    </div>
  );
}
