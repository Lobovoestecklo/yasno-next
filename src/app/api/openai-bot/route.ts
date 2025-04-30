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
    // Расширенное логирование окружения
    console.log('Environment check:', {
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      cwd: process.cwd(),
      openAIKeyExists: !!process.env.OPENAI_API_KEY,
      openAIKeyLength: process.env.OPENAI_API_KEY?.length,
      systemMessagePath: 'src/app/api/openai-bot/system-message.txt',
      systemMessageExists: !!DEFAULT_SYSTEM_MESSAGE,
      systemMessageLength: DEFAULT_SYSTEM_MESSAGE?.length
    });
    
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    const { messages, training } = body;

    if (!messages || !Array.isArray(messages)) {
      console.error('Invalid messages format:', messages);
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

    console.log('System message loaded:', systemMessage.slice(0, 50) + '...');

    const openai = getOpenAIClient();
    if (!openai) {
      console.error('OpenAI client initialization failed. Environment:', {
        NODE_ENV: process.env.NODE_ENV,
        API_KEY_EXISTS: !!process.env.OPENAI_API_KEY,
        API_KEY_LENGTH: process.env.OPENAI_API_KEY?.length,
        IS_SERVER: typeof window === 'undefined'
      });
      return NextResponse.json(
        { error: 'OpenAI client could not be initialized' },
        { status: 500 }
      );
    }

    console.log('OpenAI client initialized successfully');

    console.log('Attempting to call OpenAI API with model:', OPENAI_MODEL);
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

      console.log('Stream created successfully');

      return new Response(
        new ReadableStream({
          async start(controller) {
            try {
              console.log('Starting stream processing');
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
              console.log('Stream processing completed');
              controller.close();
            } catch (err) {
              const error = err as Error;
              console.error('Stream processing error:', {
                name: error.name,
                message: error.message,
                stack: error.stack,
                details: JSON.stringify(error, null, 2)
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
        stack: error.stack,
        details: JSON.stringify(error, null, 2)
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
      stack: error.stack,
      details: JSON.stringify(error, null, 2),
      environment: process.env.NODE_ENV,
      apiKeyExists: !!process.env.OPENAI_API_KEY,
      apiKeyLength: process.env.OPENAI_API_KEY?.length,
      systemMessageLoaded: !!DEFAULT_SYSTEM_MESSAGE,
      systemMessageLength: DEFAULT_SYSTEM_MESSAGE?.length
    });
    return NextResponse.json(
      { error: `Chat API Error: ${error.message}` },
      { status: 500 }
    );
  }
}
