'use client'

import React, { useState, KeyboardEvent } from 'react'
import { useAnthropicMessages } from '@/lib/hooks/useAnthropicMessages'
import { Send } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import ScenarioDialog from "@/components/scenario-dialog"
import { FormattedResponse } from '@/components/FormattedResponse'

const PREDEFINED_MESSAGES = {
  IMPROVE_EXISTING: "У меня уже есть сценарий и я хочу его улучшить",
  CREATE_NEW: "У меня нет сценария, я создаю все с нуля"
} as const;

export default function Home() {
  const [input, setInput] = useState("");
  const { messages, submitUserMessage, submitScenario, isStreaming } = useAnthropicMessages(setInput);
  // const [scenario, setScenario] = useState("");

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      submitUserMessage(input);
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
    // console.log('Scenario submitted:', content);
    // setScenario(content);
  };


  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 md:py-[60px]">
      <Card className="max-w-2xl mx-auto min-h-screen shadow-none border-0 rounded-none md:min-h-0 md:rounded-lg md:border">
        <CardHeader className="border-b bg-primary px-6 py-4 h-[60px] md:rounded-t-lg">
          <h1 className="text-xl font-semibold text-primary-foreground text-center tracking-tighter">
            Сценарный Коуч
          </h1>
        </CardHeader>

        <CardContent className="p-4 md:p-6 space-y-4 h-[calc(100vh-256px)] md:h-[calc(100vh-364px)] overflow-y-auto">
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
                <ScenarioDialog onSubmit={handleScenarioSubmit} />
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