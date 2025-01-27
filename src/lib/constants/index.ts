import { IMessage } from "@/types";

export const ANTHROPIC_HEADERS = {
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json'
}

export const ANTHROPIC_POST_BODY_PARAMS = {
    model: 'claude-3-5-sonnet-20240620',
    max_tokens: 1024,
    stream: true
}

export const ANTHROPIC_SYSTEM_MESSAGE = `Ты сценарный коуч, который помогает людям улучшить свои сценарии.`;

export const LOCAL_STORAGE_CHAT_MESSAGES_KEY = 'scenario-chat-messages';

export const INITIAL_BOT_MESSAGE: IMessage = {
    id: 'assistant-initial',
    role: 'assistant',
    content: "Привет! Я твой сценарный коуч, который поможет тебе улучшить твой сценарий. Расскажи мне о твоем сценарии, и я помогу тебе с ним.",
};