import { ANTHROPIC_HEADERS } from '@/lib/constants';
import { IMessage } from '@/types';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    if (!process.env.ANTHROPIC_API_KEY) {
      console.log('ANTHROPIC_API_KEY is not set, using fallback title');
      return Response.json({ title: 'Новый чат' });
    }

    // Filter out null messages and ensure we have valid messages
    const validMessages = messages.filter((msg: IMessage | null): msg is IMessage => 
      msg !== null && msg.role !== undefined && msg.content !== undefined
    );

    if (validMessages.length === 0) {
      return Response.json({ title: 'Новый чат' });
    }

    // Find first user message for fallback
    const firstUserMessage = validMessages.find((msg: IMessage) => msg.role === 'user');
    const fallbackTitle = firstUserMessage 
      ? firstUserMessage.content.length > 30
        ? `${firstUserMessage.content.substring(0, 30)}...`
        : firstUserMessage.content
      : 'Новый чат';

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          ...ANTHROPIC_HEADERS,
          'anthropic-beta': 'messages-2023-12-15',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 100,
          system: 'You are a helpful assistant that generates concise, descriptive titles for chat conversations. Create a title in Russian that captures the main topic or intent of the conversation in 5-7 words.',
          messages: [
            {
              role: 'user',
              content: `Generate a short title in Russian language for this chat conversation:\n\n${validMessages.map((msg: IMessage) => `${msg.role}: ${msg.content}`).join('\n')}`
            }
          ]
        })
      });

      if (!response.ok) {
        console.log('Anthropic API error, using fallback title');
        return Response.json({ title: fallbackTitle });
      }

      const data = await response.json();
      return Response.json({ title: data.content[0].text || fallbackTitle });
    } catch (error) {
      console.log('Error calling Anthropic API, using fallback title:', error);
      return Response.json({ title: fallbackTitle });
    }
  } catch (error) {
    console.log('Error in generate-title route, using fallback title:', error);
    return Response.json({ title: 'Новый чат' });
  }
} 