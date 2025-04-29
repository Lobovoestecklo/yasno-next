import { IMessage } from '@/types';

export async function generateChatTitle(messages: IMessage[]): Promise<string> {
  if (!messages.length) return 'Новый чат';

  const firstUserMessage = messages.find(msg => msg.role === 'user');
  const fallbackTitle =
    firstUserMessage && firstUserMessage.content.length > 30
      ? `${firstUserMessage.content.substring(0, 30)}...`
      : firstUserMessage?.content || 'Новый чат';

  try {
    const baseUrl =
      process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/api/generate-title`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages: messages.slice(0, 3) }),
    });

    if (!response.ok) {
      console.warn('Title generation API error. Using fallback:', fallbackTitle);
      return fallbackTitle;
    }

    const data = await response.json();
    return data.title || fallbackTitle;
  } catch (error) {
    console.error('Title generation failed:', error);
    return fallbackTitle;
  }
}
