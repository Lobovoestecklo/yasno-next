import { NextResponse } from 'next/server';
import { IMessage } from '@/types';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      console.warn('OPENAI_API_KEY not set. Using fallback title.');
      return NextResponse.json({ title: 'Новый чат' });
    }

    const validMessages: IMessage[] = Array.isArray(messages)
      ? messages.filter((msg): msg is IMessage => msg && typeof msg.content === 'string' && typeof msg.role === 'string')
      : [];

    const firstUserMessage = validMessages.find((msg) => msg.role === 'user');
    const fallbackTitle =
      firstUserMessage?.content && firstUserMessage.content.length > 30
        ? `${firstUserMessage.content.slice(0, 30)}...`
        : firstUserMessage?.content || 'Новый чат';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        max_tokens: 100,
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful assistant that generates concise, descriptive titles for chat conversations. Create a title in Russian that captures the main topic or intent of the conversation in 5-7 words.',
          },
          {
            role: 'user',
            content: `Generate a short title in Russian language for this chat conversation:\n\n${validMessages
              .map((msg) => `${msg.role}: ${msg.content}`)
              .join('\n')}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.warn('OpenAI API error. Using fallback title.');
      return NextResponse.json({ title: fallbackTitle });
    }

    const data = await response.json();
    const title = data?.choices?.[0]?.message?.content?.trim() || fallbackTitle;

    return NextResponse.json({ title });
  } catch (error) {
    console.error('Error in /generate-title route:', error);
    return NextResponse.json({ title: 'Новый чат' });
  }
}
