'use client'

import { useState } from 'react'
import styles from './page.module.css'
import { useAnthropicMessages } from '@/lib/hooks/useAnthropicMessages'

export default function Home() {
  const [input, setInput] = useState("");
  const { messages, submitUserMessage, isStreaming } = useAnthropicMessages(setInput);

  const sendMessage = () => {
    if (input.trim()) {
      submitUserMessage(input);
    }
  };

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