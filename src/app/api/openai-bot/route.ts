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
    const { messages, training } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid or missing messages in request body' },
        { status: 400 }
      );
    }

    const systemMessage = training
      ? OPENAI_TRAINING_SYSTEM_MESSAGE
      : DEFAULT_SYSTEM_MESSAGE;

    if (!systemMessage) {
      return NextResponse.json(
        { error: 'System message is missing or failed to load.' },
        { status: 500 }
      );
    }

    const openai = getOpenAIClient();
    if (!openai) {
      return NextResponse.json(
        { error: 'OpenAI client could not be initialized' },
        { status: 500 }
      );
    }

    const response = await openai.responses.create(
      {
        model: OPENAI_MODEL,
        input: [
          {
            role: 'system',
            content: [
              {
                type: 'input_text',
                text: systemMessage
              }
            ]
          },
          ...messages
        ],
        text: {
          format: { type: 'text' }
        },
        ...OPENAI_POST_BODY_PARAMS,
        stream: true
      },
      { stream: true }
    );

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            if (chunk.type === 'response.output_text.delta') {
              const data = {
                type: 'content_block_delta',
                delta: { type: 'text_delta', text: chunk.delta }
              };
              controller.enqueue(
                new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`)
              );
            }
          }
          controller.close();
        } catch (error) {
          console.error('Stream processing error:', error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      },
      { status: 500 }
    );
  }
}
