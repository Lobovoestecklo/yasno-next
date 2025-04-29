import { NextResponse } from 'next/server';
import { getOpenAIClient } from '@/lib/utils/openai';
import {
  OPENAI_MODEL,
  OPENAI_POST_BODY_PARAMS,
  OPENAI_TRAINING_SYSTEM_MESSAGE
} from '@/lib/constants/openai';
import { loadScriptFromFile } from '@/lib/utils/server/scriptLoader';

// Загружаем дефолтный system message из файла
const DEFAULT_SYSTEM_MESSAGE = loadScriptFromFile('src/app/api/openai-bot/system-message.txt');

export async function POST(request: Request) {
  try {
    console.log('API Request received');
    const { messages, training } = await request.json();
    console.log('Messages received:', JSON.stringify(messages, null, 2));

    if (!messages || !Array.isArray(messages)) {
      console.error('Invalid messages format');
      return NextResponse.json(
        { error: 'Invalid or missing messages in request body' },
        { status: 400 }
      );
    }

    const systemMessage = training
      ? OPENAI_TRAINING_SYSTEM_MESSAGE
      : DEFAULT_SYSTEM_MESSAGE;

    if (!systemMessage) {
      console.error('System message is missing');
      return NextResponse.json(
        { error: 'System message is missing or failed to load.' },
        { status: 500 }
      );
    }

    const openai = getOpenAIClient();
    if (!openai) {
      console.error('OpenAI client initialization failed');
      return NextResponse.json(
        { error: 'OpenAI client could not be initialized' },
        { status: 500 }
      );
    }

    console.log('Attempting to call OpenAI API with model:', OPENAI_MODEL);
    console.log('System message:', systemMessage);
    console.log('Messages:', JSON.stringify(messages, null, 2));

    try {
      const stream = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: systemMessage },
          ...messages.map((message: any) => ({
            role: message.role,
            content: message.content,
          })),
        ],
        stream: true,
      });

      return new Response(
        new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content;
                if (content) {
                  const data = {
                    type: 'content_block_delta',
                    delta: { type: 'text_delta', text: content }
                  };
                  controller.enqueue(
                    new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`)
                  );
                }
              }
              controller.close();
            } catch (err) {
              const error = err as Error;
              console.error('Stream processing error:', error);
              console.error('Stream error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
              });
              controller.error(error);
            }
          }
        }),
        {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
        }
      );
    } catch (err) {
      const error = err as Error;
      console.error('OpenAI API Error:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      return NextResponse.json(
        { error: `OpenAI API Error: ${error.message}` },
        { status: 500 }
      );
    }
  } catch (err) {
    const error = err as Error;
    console.error('Chat API Error:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return NextResponse.json(
      { error: `Chat API Error: ${error.message}` },
      { status: 500 }
    );
  }
}
