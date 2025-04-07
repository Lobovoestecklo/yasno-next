import { NextResponse } from 'next/server';
import { getOpenAIClient } from '@/lib/utils/openai';
import { 
  OPENAI_MODEL, 
  OPENAI_POST_BODY_PARAMS, 
  OPENAI_VECTOR_STORE_IDS, 
  OPENAI_TRAINING_SYSTEM_MESSAGE 
} from '@/lib/constants/openai';
import { loadScriptFromFile } from '@/lib/utils/server/scriptLoader';

// Fallback system message from file (for regular cases)
const DEFAULT_SYSTEM_MESSAGE = loadScriptFromFile('src/app/api/openai-bot/system-message.txt');

export async function POST(request: Request) {
  try {
    // Parse request body; expect { messages, training?: boolean }
    const { messages, training } = await request.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid or missing messages in request body' },
        { status: 400 }
      );
    }

    // Choose system message based on training flag
    const systemMessage = training ? OPENAI_TRAINING_SYSTEM_MESSAGE : DEFAULT_SYSTEM_MESSAGE;

    const openai = getOpenAIClient();
    if (!openai) {
      return NextResponse.json(
        { error: 'OpenAI client could not be initialized' },
        { status: 500 }
      );
    }

    const response = await openai.responses.create({
      model: OPENAI_MODEL,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: systemMessage
            }
          ]
        },
        ...messages // Предполагается, что сообщения уже в нужном формате для OpenAI
      ],
      text: {
        format: {
          type: "text"
        }
      },
      reasoning: {}, // Пустой объект reasoning, если требуется
      tools: [
        {
          type: "file_search",
          vector_store_ids: OPENAI_VECTOR_STORE_IDS
        }
      ],
      ...OPENAI_POST_BODY_PARAMS,
      stream: true
    }, { stream: true });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log('Starting stream processing...');
          for await (const chunk of response) {
            console.log('Event received:', chunk.type);
            if (chunk.type === 'response.output_text.delta') {
              console.log('Got text delta:', chunk.delta);
              const data = {
                type: 'content_block_delta',
                delta: { type: 'text_delta', text: chunk.delta }
              };
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`));
            }
          }
          console.log('Stream completed');
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
