import React from 'react';

export interface IMessage {
  id?: string;
  is_scenario?: boolean;
  role: 'user' | 'assistant';
  content: string;
}

export interface UseMessagesResult {
  messages: IMessage[];
  setMessages: React.Dispatch<React.SetStateAction<IMessage[]>>;
  isStreaming: boolean;
  streamedMessageId: string | null;
  submitUserMessage: (message: string) => Promise<void>;
  submitTrainingCase: (message: string) => Promise<void>;
  finalizeTrainingCase: () => void;
  isTraining: boolean;
  trainingRound: number;
}
