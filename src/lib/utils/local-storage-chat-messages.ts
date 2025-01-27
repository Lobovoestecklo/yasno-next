'use client'

import { IMessage } from '@/types';
import { LOCAL_STORAGE_CHAT_MESSAGES_KEY, INITIAL_BOT_MESSAGE } from '../constants';
import { getLSValue, setLSValue } from './local-storage';

export const getSavedMessages = (): IMessage[] => {
    const messages = getLSValue(LOCAL_STORAGE_CHAT_MESSAGES_KEY);
    if (!messages) {
        return [INITIAL_BOT_MESSAGE];
    }
    return messages;
}

export const saveMessages = (messages: IMessage[]) => {
    setLSValue(LOCAL_STORAGE_CHAT_MESSAGES_KEY, messages);
}

export const clearMessagesAndReload = () => {
    if (!window || !window.localStorage) {
        throw new Error('Local storage is not available, switch to client');
    }
    localStorage.removeItem(LOCAL_STORAGE_CHAT_MESSAGES_KEY);
    window.location.reload();
}