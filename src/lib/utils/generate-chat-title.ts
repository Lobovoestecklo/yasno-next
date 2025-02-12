import { IMessage } from '@/types';

export async function generateChatTitle(messages: IMessage[]): Promise<string> {
  if (!messages.length) {
    return 'New Chat';
  }

  try {
    console.log('Sending messages for title generation:', messages.slice(0, 3)); // Debug log

    const response = await fetch('/api/generate-title', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages: messages.slice(0, 3) }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Title generation error:', data.error);
      throw new Error(data.error || 'Failed to generate title');
    }

    return data.title;
  } catch (error) {
    console.error('Error generating title:', error);
    
    // Fallback to first user message if API fails
    const firstUserMessage = messages.find(msg => msg.role === 'user');
    if (firstUserMessage) {
      const title = firstUserMessage.content.length > 30
        ? `${firstUserMessage.content.substring(0, 30)}...`
        : firstUserMessage.content;
      console.log('Using fallback title:', title);
      return title;
    }
    
    return 'New Chat';
  }
} 