```markdown
# Summary
To test Anthropic’s prompt caching with the entire content from “duglas.txt,” you can load its text into your prompt as a single or multiple “system” blocks with “cache_control” set to “ephemeral.” In practice, you’ll likely chunk the text if it’s very large (to avoid exceeding token limits and to create multiple cache breakpoints). Below is a step-by-step guide on how to load “duglas.txt” and mark it for caching.

---

## 1. Load “duglas.txt” from Disk
Use the same “loadScriptFromFile” approach in your server-side code. For example:

```typescript:src/lib/utils/scriptLoader.ts
export function loadScriptFromFile(filePath: string): string {
  try {
    const fs = require('fs');
    const path = require('path');
    const absolutePath = path.resolve(filePath);
    return fs.readFileSync(absolutePath, { encoding: 'utf-8' });
  } catch (error) {
    console.error(`Error loading the file: ${error}`);
    return '';
  }
}
```

Assuming “duglas.txt” resides somewhere in your repo, provide that path to the function on the server side.

---

## 2. Construct the Anthropic Request with Caching
In your API route (e.g., “route.ts” or “api/bot.ts”), read “duglas.txt” and embed it in the “system” array with “cache_control.” Note that for Claude 3.5 Sonnet, the minimum cacheable prompt length is 1024 tokens, so you should confirm that your included text meets or exceeds that threshold if you want it cached.

Below is a simplified example:

```typescript:path/to/yourApiRoute.ts
import { loadScriptFromFile } from '@/lib/utils/scriptLoader';

export async function POST(request: Request) {
  try {
    // 1. Load the full text from duglas.txt
    const duglasContent = loadScriptFromFile('public/scenario_examples/duglas.txt');

    // 2. Construct your request body with ephemeral caching for the entire text
    const requestBody = {
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 2100,
      system: [
        {
          type: 'text',
          text: 'You are an AI assistant specialized in analyzing textual content.',
        },
        {
          type: 'text',
          text: duglasContent,
          cache_control: { type: 'ephemeral' }
        }
      ],
      messages: [
        {
          role: 'user',
          content: 'Please summarize the main themes in the text I’ve provided.'
        }
      ]
    };

    // 3. Call Anthropic
    const response = await fetch(process.env.ANTHROPIC_API_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });

    // 4. Stream or parse the response
    // ...
  } catch (error) {
    console.error('Error in Anthropic API route:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
```

### Notes:
1. The “cache_control” property in that second system block means Anthropic will attempt to cache the entire text of “duglas.txt” for 5 minutes.  
2. If “duglas.txt” is significantly longer than the maximum token context size, you may need to split it into multiple segments or otherwise reduce it.  
3. If it is shorter than ~1024 tokens (for Claude 3.5 Sonnet), it will still work, but you won’t get a cached prefix directly since there is a minimum token limit for ephemeral caching to kick in.

---

## 3. Verify Prompt Caching
Anthropic includes usage fields in the response indicating whether a cache was created or read:

• cache_creation_input_tokens: # of tokens written to cache on new entry  
• cache_read_input_tokens: # of tokens read from cache on subsequent calls  
• input_tokens: # of input tokens which were not cached  

To confirm ephemeral caching:
1. Run your request.  
2. Check the usage fields in the first response. You should see “cache_creation_input_tokens” > 0.  
3. Re-run the same request (exact same text in the “system” blocks). If within 5 minutes, you should see “cache_read_input_tokens” > 0 and “cache_creation_input_tokens” = 0, meaning you got a cache hit.

---

## 4. (Optional) Chunking “duglas.txt” for Multiple Breakpoints
If you want to demonstrate extended caching or break the text into multiple sections, you can do this by splitting “duglas.txt” and adding multiple system blocks each with cache_control. For example:

```typescript
{
  model: 'claude-3-5-sonnet-20240620',
  system: [
    {
      type: 'text',
      text: chunk1,
      cache_control: { type: 'ephemeral' }
    },
    {
      type: 'text',
      text: chunk2,
      cache_control: { type: 'ephemeral' }
    }
    // ...
  ],
  messages: [...]
}
```

Each chunk can be up to the minimum token limit for ephemeral caching, letting you demonstrate how partial cache hits can occur if only some chunks match in subsequent requests.

---

## 5. Testing Strategy
1. **Functional Test:**  
   - Make one request with the full text and verify “cache_creation_input_tokens” in response.  
   - Within 5 minutes, send the same request again. Check that “cache_read_input_tokens” is > 0, indicating a cache hit.  

2. **Edge Cases:**  
   - Make minor changes to “duglas.txt” (e.g., add or remove punctuation) to show that 100% identical text is required for a cache hit.  
   - Wait more than 5 minutes and confirm that the text is no longer cached (Anthropic ephemeral cache TTL).

By following this approach, you’ll be able to test the updated app with “duglas.txt” included in your prompt and confirm that Anthropic ephemeral caching is reducing subsequent token usage for that large text.
