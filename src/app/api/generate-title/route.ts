import { ANTHROPIC_HEADERS } from '@/lib/constants';
import { IMessage } from '@/types';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is not set');
      throw new Error('API key not configured');
    }

    // Filter out null messages and ensure we have valid messages
    const validMessages = messages.filter((msg: IMessage | null): msg is IMessage => 
      msg !== null && msg.role !== undefined && msg.content !== undefined
    );

    if (validMessages.length === 0) {
      return Response.json({ title: 'New Chat' });
    }

    console.log('Generating title for messages:', validMessages);

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
      const errorData = await response.json().catch(() => null);
      console.error('Anthropic API error:', errorData);
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();
    console.log('Generated title:', data);

    return Response.json({ title: data.content[0].text });
  } catch (error) {
    console.error('Error in generate-title route:', error);
    return Response.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        title: 'New Chat' 
      }, 
      { status: 500 }
    );
  }
} 