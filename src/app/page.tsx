'use client'

import { useState, KeyboardEvent } from 'react'
import styles from './page.module.css'
import { useAnthropicMessages } from '@/lib/hooks/useAnthropicMessages'
import { Send } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"


export default function Home() {
  const [input, setInput] = useState("");
  const { messages, submitUserMessage, isStreaming } = useAnthropicMessages(setInput);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Card className="max-w-2xl mx-auto min-h-screen shadow-none border-0 rounded-none md:min-h-0 md:my-8 md:rounded-lg md:border">
        <CardHeader className="border-b bg-primary px-6 py-4">
          <h1 className="text-xl font-semibold text-primary-foreground text-center">
            Сценарный Коуч
          </h1>
        </CardHeader>

        <CardContent className="p-4 md:p-6 space-y-4 h-[60vh] overflow-y-auto">
          {messages.map((msg, index) => (
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

        <CardFooter className="border-t p-4 md:p-6">
          <form onSubmit={sendMessage} className="flex w-full gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Введите сообщение... (Shift + Enter для новой строки)"
              className="flex-1 min-h-[60px] max-h-[200px] resize-none"
              rows={2}
            />
            <Button type="submit" size="icon" className="h-[60px] w-[60px]">
              <Send className="h-5 w-5" />
              <span className="sr-only">Отправить</span>
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  )

  return (
    <div className={styles.container}>
      <div className={styles.chatHeader}>
        <h1>Сценарный Коуч</h1>
      </div>
      <div className={styles.chatBody}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`${styles.message} ${msg.role === "user" ? styles.userMessage : styles.botMessage}`}
          >
            <div className={styles.sender}>
              {msg.role === "user" ? "Вы" : "Бот"}
            </div>
            <div>{msg.content}</div>
          </div>
        ))}
      </div>
      <div className={styles.chatFooter}>
        <input
          className={styles.input}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Введите сообщение..."
          disabled={isStreaming}
        />
        <button
          className={styles.button}
          onClick={sendMessage}
          disabled={isStreaming}
        >
          Отправить
        </button>
      </div>
    </div>
  )
}