export interface IMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  is_scenario: boolean;
} 