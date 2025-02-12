'use client'

import { IMessage } from '@/types';
import { LOCAL_STORAGE_CHAT_MESSAGES_KEY, SCENARIO_MESSAGE_PREFIX } from '../constants';
import { getLSValue, setLSValue } from './local-storage';

export const getSavedMessages = (): IMessage[] => {
    const messages = getLSValue(LOCAL_STORAGE_CHAT_MESSAGES_KEY);
    return messages || [];
}

export const saveMessages = (messages: IMessage[]) => {
    setLSValue(LOCAL_STORAGE_CHAT_MESSAGES_KEY, messages);
}

export const clearMessagesAndReload = () => {
    if (window && window.localStorage) {
        localStorage.removeItem(LOCAL_STORAGE_CHAT_MESSAGES_KEY);
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
    const chatId = Date.now().toString();
    const chats = JSON.parse(localStorage.getItem('chats') || '{}');
    chats[chatId] = { messages, title };
    localStorage.setItem('chats', JSON.stringify(chats));
    return chatId;
};