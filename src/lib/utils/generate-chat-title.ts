import { IMessage } from '@/types';

export async function generateChatTitle(messages: IMessage[]): Promise<string> {
  if (!messages.length) {
    return 'Новый чат';
  }

  try {
    // Find the first user message for fallback
    const firstUserMessage = messages.find(msg => msg.role === 'user');
    const fallbackTitle = firstUserMessage 
      ? firstUserMessage.content.length > 30
        ? `${firstUserMessage.content.substring(0, 30)}...`
        : firstUserMessage.content
      : 'Новый чат';

    // Try to generate title with API
    const response = await fetch('/api/generate-title', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages: messages.slice(0, 3) }),
    });

    if (!response.ok) {
      console.log('Using fallback title due to API error:', fallbackTitle);
      return fallbackTitle;
    }

    const data = await response.json();
    return data.title || fallbackTitle;
  } catch (error) {
    console.log('Error generating title, using fallback:', error);
    // Use first user message as fallback title
    const firstUserMessage = messages.find(msg => msg.role === 'user');
    if (firstUserMessage) {
      const title = firstUserMessage.content.length > 30
        ? `${firstUserMessage.content.substring(0, 30)}...`
        : firstUserMessage.content;
      return title;
    }
    return 'Новый чат';
  }
} 