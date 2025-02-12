```markdown
Below is an example of how you can modify your existing “route.ts” to incorporate Anthropic prompt caching using the “scriptLoader.ts” utility. The key change is constructing the request body with a “system” array, attaching your loaded text via “cache_control” to enable ephemeral caching.

````typescript:src/app/api/bot/route.ts
import { NextResponse } from 'next/server';
import { loadScriptFromFile } from '@/lib/utils/scriptLoader';

const ANTHROPIC_API_URL = process.env.ANTHROPIC_API_URL!;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;

// Optionally create a helper to load text from public/scenario_examples/duglas.txt
function loadDuglasText() {
  return loadScriptFromFile('public/scenario_examples/duglas.txt'); // Adjust path as needed
}

// Example system instructions you already have
const SYSTEM_MESSAGE = `You are an AI assistant specialized in analyzing textual content.`;
const INITIAL_INSTRUCTION = `Follow all user instructions carefully.`;

export async function POST(request: Request) {
  try {
    // 1. Parse incoming JSON
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid or missing messages in request body' },
        { status: 400 }
      );
    }

    // 2. Load your .txt book content for ephemeral caching
    const duglasContent = loadDuglasText();

    // 3. Construct a system array with ephemeral caching for the large text.
    // If your text is extremely large, consider chunking it into smaller blocks.
    const systemBlocks = [
      {
        type: 'text',
        text: `${SYSTEM_MESSAGE}\n\n${INITIAL_INSTRUCTION}`,
      },
      {
        type: 'text',
        text: duglasContent,
        cache_control: { type: 'ephemeral' }, // Mark for caching
      },
    ];

    // 4. Create a streaming response from Anthropic with ephemeral caching
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await fetch(ANTHROPIC_API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': ANTHROPIC_API_KEY,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: 'claude-3-5-sonnet-20240620',
              max_tokens: 2096,
              // NOTE: The "system" key here is now an array instead of a single string
              system: systemBlocks,
              messages,
              stream: true,
              temperature: 0.0,
            }),
          });

          if (!response.ok) {
            console.error(response);
            throw new Error(`Anthropic API error: ${response.statusText}`);
          }

          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('Response body is null');
          }

          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              controller.close();
              break;
            }
            controller.enqueue(value);
          }
        } catch (err) {
          controller.error(err);
        }
      },
    });

    // 5. Return the streaming SSE response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Ошибка в API чата:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
      },
      { status: 500 }
    );
  }
}
````

## Explanation of Key Changes

1. import { loadScriptFromFile } from '@/lib/utils/scriptLoader';
   • Reads the local .txt file into a string. In the snippet, we load “public/scenario_examples/duglas.txt.”  
   
2. Construct system as an array instead of a single string:  
   • First system block: Your existing system or initial instruction.  
   • Second system block: Contains the loaded text from “duglas.txt” with "cache_control": { type: 'ephemeral' }.  
   • This allows Anthropic’s ephemeral caching to store and reuse your large text content for repeated requests within a short window (generally ~5 minutes).  

3. JSON Body:  
   • "model": Set to "claude-3-5-sonnet-20240620" (you can change to the version you prefer).  
   • "system": systemBlocks (the new array).  
   • "messages": The same user/assistant messages you receive from the front end.  
   • "stream": true for chunked SSE responses.  

4. SSE Response  
   • The code streams Anthropic’s response (token-by-token) to the user.  

5. Chunking (Optional)  
   • If “duglas.txt” exceeds the token limit, you can divide it into multiple blocks, each with its own “cache_control.” This creates multiple cache breakpoints so that any repeated block of text that exactly matches a previously cached segment will be pulled from ephemeral cache.  

With this approach, you can now test ephemeral cache hits when sending the same “duglas.txt” portion repeatedly to Claude 3.5 Sonnet, which should reduce future token usage and improve performance for repeated requests.
