export interface IMessage {
  id: string;
  content: string;
  is_bot: boolean;
  // ... any other existing properties
  is_user_message?: boolean;
} 