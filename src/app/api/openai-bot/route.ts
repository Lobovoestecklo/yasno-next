import { NextResponse } from 'next/server';
import { getOpenAIClient } from '@/lib/utils/openai';
import { OPENAI_MODEL, OPENAI_POST_BODY_PARAMS, OPENAI_VECTOR_STORE_IDS } from '@/lib/constants/openai';

// Load static context for system message
import { loadScriptFromFile } from '@/lib/utils/server/scriptLoader';
const SYSTEM_MESSAGE = loadScriptFromFile('src/app/api/openai-bot/system-message.txt');

const MAX_RETRIES = 3;
const INITIAL_TIMEOUT = 30000; // 30 seconds
const BACKOFF_FACTOR = 1.5;

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid or missing messages in request body' },
        { status: 400 }
      );
    }

    // Get the OpenAI client and create the response with streaming enabled
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
              text: SYSTEM_MESSAGE
            }
          ]
        },
        ...messages // Assuming messages are already in OpenAI format
      ],
      text: {
        format: {
          type: "text"
        }
      },
      reasoning: {}, // Empty reasoning object as required
      tools: [
        {
          type: "file_search",
          vector_store_ids: OPENAI_VECTOR_STORE_IDS
        }
      ],
      ...OPENAI_POST_BODY_PARAMS,
      stream: true
    }, { stream: true });

    // Handle the streaming response from Responses API
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Log for debugging
          console.log('Starting stream processing...');
          
          for await (const chunk of response) {
            // Log the event type for debugging
            console.log('Event received:', chunk.type);
            
            // Process response.output_text.delta events which contain the actual text increments
            if (chunk.type === 'response.output_text.delta') {
              console.log('Got text delta:', chunk.delta);
              
              // Format it to match the Anthropic format our frontend expects
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
                type: 'content_block_delta',
                delta: { type: 'text_delta', text: chunk.delta }
              })}\n\n`));
            }
          }
          
          console.log('Stream completed');
          controller.close();
        } catch (error) {
          console.error('Stream processing error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error
          ? error.message
          : 'An unknown error occurred'
      },
      { status: 500 }
    );
  }
}