```markdown
# Summary
You want to replace the current text-based prompt caching mechanism (using "duglas.txt") with a PDF-based approach using Anthropic’s new vision (PDF) support. This involves:
1. Removing references to "duglas.txt" and the function `loadDuglasText()`.
2. Loading the "Breaking Bad Pilot Screenplay" PDF from the “scenario_examples” folder.
3. Encoding the PDF as Base64 and sending it to Anthropic as a “document” content block with ephemeral caching.
4. Preserving the rest of the streaming structure so the final system can still respond via SSE.

This report outlines the recommended file changes to implement PDF support with prompt caching, along with testing strategies and documentation updates.

---

# New Files

## 1. pdfLoader.ts

Create a new file to handle reading the PDF and returning it as Base64. This helps keep the code in “route.ts” clean. For instance:

```ts:src/lib/utils/pdfLoader.ts
import * as fs from 'fs';
import * as path from 'path';

export function loadPdfAsBase64(pdfFileName: string): string {
  const pdfPath = path.join(process.cwd(), 'public', 'scenario_examples', pdfFileName);
  const pdfData = fs.readFileSync(pdfPath);
  return pdfData.toString('base64');
}
```

• Purpose: Centralize logic for loading a PDF and converting it to Base64.  
• Structure: A simple function that reads the file synchronously from “scenario_examples” and returns its Base64-encoded data.

---

# Modifications

Below are the recommended modifications to the existing “route.ts”.  

1. Remove the “loadDuglasText()” function and references to “duglas.txt”.  
2. Import and use your new “pdfLoader.ts” to load the “Breaking Bad Pilot Screenplay” PDF instead.  
3. Replace the ephemeral text chunk logic for “duglas.txt” with a single ephemeral “document” block.  
4. Continue to build a “system” block for your instructions, but do not chunk the PDF as text. Anthropic’s PDF support automatically handles converting and analyzing the PDF content.

Here’s a possible reference diff showing how you might implement these changes:

```ts:src/app/api/bot/route.ts
// ...
import { NextResponse } from 'next/server';
// REMOVE this import:
// import { loadScriptFromFile } from '@/lib/utils/scriptLoader';
// NEW import for PDF loading:
import { loadPdfAsBase64 } from '@/lib/utils/pdfLoader';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

// REMOVE this function:
// function loadDuglasText() {
//   return loadScriptFromFile('public/scenario_examples/duglas.txt');
// }

const SYSTEM_MESSAGE = `Вы — элитный коуч для русскоязычных сценаристов. ...`;
const INITIAL_INSTRUCTION = `При анализе сценария и предоставлении обратной связи...`;

// OPTIONAL: If you are not using chunkString or mergeChunksToMaxFour anymore,
//           you can remove those helper methods. Otherwise, keep them if needed.
/*
function chunkString(...) { ... }
function mergeChunksToMaxFour(...) { ... }
*/

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

    // 2. Load the Breaking Bad Pilot PDF as Base64
    const pdfBase64 = loadPdfAsBase64('breaking_bad_pilot.pdf'); // Example name

    // 3. Build up the system array. We pass two blocks:
    //    a. "document" block for the PDF (ephemeral caching)
    //    b. "text" block for system instructions
    const systemBlocks = [
      {
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: pdfBase64,
        },
        cache_control: { type: 'ephemeral' },
      },
      {
        type: 'text',
        text: SYSTEM_MESSAGE + '\n\n' + INITIAL_INSTRUCTION,
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
              'X-API-Key': ANTHROPIC_API_KEY!,
              'anthropic-version': '2023-06-01',
              'anthropic-beta': 'prompt-caching-2024-07-31'
            },
            body: JSON.stringify({
              model: 'claude-3-5-sonnet-20241022',
              max_tokens: 2096,
              system: systemBlocks,
              messages: messages.map(msg => ({
                role: 'user',
                content: msg.content
              })),
              stream: true,
              temperature: 0.0,
            }),
          });

          if (!response.ok) {
            const errorBody = await response.text();
            console.error('Anthropic API error details:', errorBody);
            throw new Error(`Anthropic API error: ${response.statusText} - ${errorBody}`);
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
```

---

# Testing Strategy

1. **Unit Tests for pdfLoader**  
   - Confirm the function correctly reads the PDF file and returns a Base64 string.  
   - Check edge cases (e.g., file not found, empty file).

2. **Integration Tests for /bot Endpoint**  
   - Send a request with minimal user messages, ensuring the system loads the PDF.  
   - Verify that Anthropic streaming responses come back with references to the PDF content (questions about “Breaking Bad Pilot Screenplay”).  
   - Confirm ephemeral caching is working by repeating requests and observing consistent performance.

3. **Regression Checks**  
   - Ensure removing “duglas.txt” references does not break existing SSE functionality.  
   - Testing normal chat usage flows that do not rely on the PDF.  

---

# Documentation Updates

1. **README / Developer Docs**  
   - Add a section describing the new PDF-based approach.  
   - Point out that “duglas.txt” is no longer in use.  
   - Explain the new ephemeral caching with “type: 'document'” blocks, referencing Anthropic’s PDF support docs.

2. **Comments in route.ts**  
   - Provide inline comments for the new “document” blocks to ensure future maintainers understand the ephemeral caching with PDFs.  
   - Reference the official Anthropic PDF documentation link.

3. **pdfLoader.ts**  
   - Brief description near the top about how to add or swap out PDFs in the “scenario_examples” folder.

---

**Reference**  
- [Anthropic: PDF Support](https://docs.anthropic.com/en/docs/build-with-claude/pdf-support)

With these changes, your chat bot can successfully load and cache the “Breaking Bad Pilot Screenplay” PDF, leveraging Anthropic’s ephemeral caching feature for efficient prompt usage while maintaining your existing SSE functionality. 
```

