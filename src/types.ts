export interface IMessage {
    id?: string;
    is_scenario?: boolean;
    role: 'user' | 'assistant';
    content: string;
}