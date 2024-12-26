'use client'

import React, { useState, KeyboardEvent } from 'react'
import { useAnthropicMessages } from '@/lib/hooks/useAnthropicMessages'
import { Send } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import ScenarioDialog from "@/components/scenario-dialog"


export default function Home() {
  const [input, setInput] = useState("");
  const { messages, submitUserMessage, isStreaming } = useAnthropicMessages(setInput);
  const [scenario, setScenario] = useState("");

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      submitUserMessage(input);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(e)
    }
  }

  const handleScenarioSubmit = (content: string) => {
    console.log('Scenario submitted:', content);
    setScenario(content);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 md:py-[60px]">
      <Card className="max-w-2xl mx-auto min-h-screen shadow-none border-0 rounded-none md:min-h-0 md:rounded-lg md:border">
        <CardHeader className="border-b bg-primary px-6 py-4 h-[60px] md:rounded-t-lg">
          <h1 className="text-xl font-semibold text-primary-foreground text-center tracking-tighter">
            Сценарный Коуч
          </h1>
        </CardHeader>

        <CardContent className="p-4 md:p-6 space-y-4 h-[calc(100vh-160px)] md:h-[calc(100vh-280px)] overflow-y-auto">
          {messages.map((msg) => (
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
                <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
        </CardContent>

        <CardFooter className="border-t p-4 h-[100px] md:p-6">
          <form onSubmit={sendMessage} className="flex w-full gap-2 items-center relative">
            <ScenarioDialog onSubmit={handleScenarioSubmit} />
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Введите сообщение... (Shift + Enter для новой строки)"
              className="flex-1 min-h-[60px] max-h-[200px] resize-none pr-10"
              rows={2}
            />
            <Button type="submit" size="icon" className="h-[60px] w-[60px]" disabled={isStreaming}>
              <Send className="h-5 w-5" />
              <span className="sr-only">Отправить</span>
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}