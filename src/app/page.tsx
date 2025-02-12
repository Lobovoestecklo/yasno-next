'use client'

import React, { useState, KeyboardEvent, useEffect } from 'react'
import { useAnthropicMessages } from '@/lib/hooks/useAnthropicMessages'
import { Send } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import ScenarioDialog from "@/components/scenario-dialog"
import { FormattedResponse } from '@/components/FormattedResponse'
import { getSavedMessages, saveMessages, clearMessagesAndReload } from '@/lib/utils/local-storage-chat-messages'
import ClearChatHistoryDialog from '@/components/clear-chat-history-dialog'
import { IMessage } from '@/types'
import { useRouter } from 'next/navigation'
import { startNewChat } from '@/lib/utils/chat-management'
import { SidebarToggle } from '@/components/chat-history/sidebar-toggle'
import { useSidebar } from '@/components/ui/sidebar'
import { addChatToHistory } from '@/lib/utils/chat-history'

const PREDEFINED_MESSAGES = {
  IMPROVE_EXISTING: "У меня уже есть сценарий и я хочу его улучшить",
  CREATE_NEW: "У меня нет сценария, я создаю все с нуля"
} as const;

export default function Home() {
  const [input, setInput] = useState("");
  const [_localStorageMessages] = useState<IMessage[]>([]);
  const [scenario] = useState<string | null>(null);
  const router = useRouter();
  const { } = useSidebar();

  const {
    messages,
    submitUserMessage,
    submitScenario,
    isStreaming
  } = useAnthropicMessages(setInput, _localStorageMessages, saveMessages, getSavedMessages);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      await submitUserMessage(input);
      if (messages.length === 1) {
        const chatId = await startNewChat(messages[0]);
        router.push(`/chat/${chatId}`);
      }
    }
  };

  const handlePredefinedMessage = (message: string) => {
    submitUserMessage(message);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(e)
    }
  }

  const handleScenarioSubmit = (content: string) => {
    submitScenario(content);
    // Uncomment if you need this functionality later
    // setScenario(content);
  };

  useEffect(() => {
    const initializeChat = async () => {
      const savedMessages = getSavedMessages();
      
      if (savedMessages.length > 0) {
        // Clear local storage as we're moving messages to persistent storage
        clearMessagesAndReload();
        const chatId = await startNewChat(savedMessages);
        router.push(`/chat/${chatId}`);
      }
    };

    initializeChat();
  }, [router]);

  useEffect(() => {
    if (messages.length > 0) {
      const chatId = addChatToHistory(messages, 'Новый сценарий');
      router.push(`/chat/${chatId}`);
    }
  }, [messages, router]);

  return (
    <div>
      <Card className="relative min-h-[calc(100vh-3rem)] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between bg-black text-white p-4">
          <div className="flex items-center gap-2">
            <SidebarToggle />
            <h1 className="text-xl font-semibold">Сценарный Коуч</h1>
          </div>
          <ClearChatHistoryDialog onAccept={clearMessagesAndReload} />
        </CardHeader>
        
        <CardContent className="flex-1 overflow-auto pb-24">
          {messages.map((msg) => {
            if (msg.is_scenario) {
              return null
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
            )
          })}
        </CardContent>
        
        <CardFooter className="absolute bottom-0 left-0 right-0 bg-background border-t p-4">
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
                <ScenarioDialog onSubmit={handleScenarioSubmit} scenario={scenario} />
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
    </div>
  )
}