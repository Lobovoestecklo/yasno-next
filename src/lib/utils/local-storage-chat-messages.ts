'use client'

import { IMessage } from '@/types';
import { LOCAL_STORAGE_CHAT_MESSAGES_KEY, SCENARIO_MESSAGE_PREFIX, INITIAL_BOT_MESSAGE } from '../constants';
import { getLSValue, setLSValue } from './local-storage';
import { clearAllChatHistories } from './chat-history';

// Helper function to generate unique ID - same as in chat-history.ts
const generateId = () => Math.random().toString(36).substring(2, 9);

export const getSavedMessages = (): IMessage[] => {
    const messages = getLSValue(LOCAL_STORAGE_CHAT_MESSAGES_KEY);
    if (!messages || messages.length === 0) {
        return [INITIAL_BOT_MESSAGE];
    }
    return messages[0]?.id === INITIAL_BOT_MESSAGE.id ? messages : [INITIAL_BOT_MESSAGE, ...messages];
}

export const saveMessages = (messages: IMessage[]) => {
    // Ensure initial message is always present
    const messagesWithInitial = messages[0]?.id === INITIAL_BOT_MESSAGE.id
        ? messages
        : [INITIAL_BOT_MESSAGE, ...messages];
    setLSValue(LOCAL_STORAGE_CHAT_MESSAGES_KEY, messagesWithInitial);
}

export const clearMessagesAndReload = () => {
    if (window && window.localStorage) {
        localStorage.removeItem(LOCAL_STORAGE_CHAT_MESSAGES_KEY);
        clearAllChatHistories();
    }
}

export const extractLatestScenario = (messages: IMessage[]): string | null => {
    const scenarioMessages = messages.filter(msg => msg.is_scenario);
    if (scenarioMessages.length === 0) {
        return null;
    }
    const latestScenario = scenarioMessages[scenarioMessages.length - 1].content;
    const regex = new RegExp(`${SCENARIO_MESSAGE_PREFIX}`, 'g');
    const result = latestScenario.replace(regex, '').trim();
    return result;
}

export const addChatToHistory = (messages: IMessage[], title: string): string => {
    const chatId = generateId();
    const chats = JSON.parse(localStorage.getItem('chats') || '{}');
    chats[chatId] = { messages, title };
    localStorage.setItem('chats', JSON.stringify(chats));
    return chatId;
};