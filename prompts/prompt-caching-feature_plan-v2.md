# Summary
With Anthropic’s prompt caching feature and the newly available “cache_control” parameter, you can include large or frequently reused scripts (from your local text files) and significantly improve performance by caching these script examples as part of your system or messages prompt. When you make repeated requests containing the same script text within a 5-minute period, Anthropic can reuse the cached prompt prefix, reducing token consumption and latency. Below is a step-by-step plan integrating your local script files with Anthropic’s partial caching (“cache_control”) support.

---

# New Files

## 1. src/lib/utils/scriptLoader.ts
This module is responsible for loading script content from your local filesystem on the server side (or from another source if purely in the browser). You may need special handling in Next.js if you want server-only or client-only reading.

````typescript:src/lib/utils/scriptLoader.ts
export function loadScriptFromFile(filePath: string): string {
  try {
    // If reading from local file system on the server:
    const fs = require('fs');
    const path = require('path');
    const absolutePath = path.resolve(filePath);
    const fileContents = fs.readFileSync(absolutePath, { encoding: 'utf-8' });
    return fileContents;
  } catch (error) {
    console.error(`Error loading script from file: ${error}`);
    return '';
  }
}
````

---

# Modifications

## 1. Include Script Examples in Prompt with Cache Annotations

To leverage prompt caching, place your script content in either the “system” array or “messages” array of the Anthropic request, and add the “cache_control” property. Below is an example snippet showing how you could modify the request body in your “route.ts” or wherever you call the Anthropic API:

````typescript:src/app/api/bot/route.ts
async function buildAnthropicRequest(messages: IMessage[], scriptContent: string) {
  // We can place the scriptContent in a system block or in messages.
  // Example: placing it in the system block for partial caching.
  const requestBody = {
    model: 'claude-3-5-sonnet-20240620',
    max_tokens: 2100,
    stream: true,
    system: [
      {
        type: 'text',
        text: 'You are an AI assistant that helps with scripts. Below is a reused script snippet to reference:',
      },
      {
        type: 'text',
        text: scriptContent,
        // Mark for ephemeral caching if including large repeated script
        cache_control: { type: 'ephemeral' },
      }
    ],
    messages: messages.map(({ role, content }) => ({
      role,
      content,
      // (Optionally add cache_control to user or assistant content if you want repeated user messages cached)
    })),
    temperature: 0.0,
  };

  return requestBody;
}

export async function POST(request: Request) {
  try {
    const { messages, scriptFilePath } = await request.json();
    // 1. Load script content from file
    let scriptContent = '';
    if (scriptFilePath) {
      scriptContent = loadScriptFromFile(scriptFilePath);
    }

    // 2. Construct request with partial caching
    const requestBody = await buildAnthropicRequest(messages, scriptContent);

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });

    // 3. Stream or parse the response
    // ...
  } catch (err) {
    console.error('Error in Anthropic API route:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
````

Key Points:
1. For large or repeated scripts, attach them to the “system” array or “messages” array with “cache_control”.  
2. If you want multiple cache breakpoints, you can add more “cache_control” objects in different blocks.  
3. Anthropic will cache identical prefix blocks (with 100% textual match including spacing and presence of images/tool calls if any).  

## 2. Prompt Cache Utility
If you haven’t already, create or enhance a utility to keep track of local prompt caching. You can wrap the local cache around the “scriptContent + userMessage” combination. For instance:

````typescript:src/lib/utils/promptCache.ts
export function getCachedPrompt(promptKey: string): string | null {
  // e.g., from an in-memory or Redis-based store
  // For ephemeral caching synergy with Anthropic, store a short-lifetime entry
  // Return cached response if found
  return null;
}

export function storePromptInCache(promptKey: string, response: string) {
  // Store the prompt + response in your local store
}
````

You might combine these with the external ephemeral cache that Anthropic provides, so you can confirm local usage or for additional fallback.

## 3. Updating useAnthropicMessages to Dynamically Include Script
When a user submits a message, optionally pass in a “scriptFilePath”. Then gather the script content, combine it with the user messages, and attempt local or ephemeral caching checks. If no local match, call the Anthropic API.

````typescript:src/lib/hooks/useAnthropicMessages/index.ts
import { loadScriptFromFile } from '@/lib/utils/scriptLoader';
import { getCachedPrompt, storePromptInCache } from '@/lib/utils/promptCache';

export const useAnthropicMessages = (
  ...
) => {
  const submitUserMessage = useCallback(async (message: string, scriptFilePath?: string) => {
    // 1. Load script content (server side or via API)
    let scriptContent = '';
    if (scriptFilePath) {
      scriptContent = loadScriptFromFile(scriptFilePath);
    }

    // 2. Create the prompt key
    const promptKey = scriptContent + message;
    const cached = getCachedPrompt(promptKey);
    if (cached) {
      // Return cached
      // ...
      return;
    }

    // 3. Not cached, call your Anthropic route
    const response = await fetch('/api/bot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [...getSavedMessages(), { role: 'user', content: message }],
        scriptFilePath: scriptFilePath,
      })
    });

    // 4. Store in local prompt cache if needed
    // storePromptInCache(promptKey, ...);

  }, [/* dependencies */]);

  return { submitUserMessage, ... };
};
````

## 4. UI for Selecting Scripts (Optional)
If you want a UI so users can pick which local script to include, modify “ScenarioDialog” or other UI components. On file pick, store the path or read the file content in state, then pass it into “submitUserMessage.”

```typescript:src/components/scenario-dialog.tsx
// Pseudocode for letting a user choose a local file, read it, pass to your submit function
```

---

# Testing Strategy

1. **Unit Tests**  
   - Test “scriptLoader.ts” to confirm your local script reading logic works if your Next.js setup allows server-side fs access.  
   - Test “promptCache.ts” with various script keys and responses to confirm caching.

2. **Integration Tests**  
   - Test the entire flow: pick/enter a script, submit user prompt, and see if the local ephemeral caching is triggered.  
   - Confirm that subsequent calls with the same script + user prompt triggers a cache hit from Anthropic (the usage fields in the response will show cache_read_input_tokens > 0).

3. **Manual Verification**  
   - Include a large script text in your system block and confirm the response usage fields from Anthropic.  
   - Re-run the same request within 5 minutes and confirm you see the ephemeral cache usage in the response.  
   - Adjust your script content or spacing to simulate a cache miss, verifying exact text match is required.

---

# Documentation Updates

1. **README**  
   - Add a “Prompt Caching with Anthropic” section explaining ephemeral caching, your “scriptLoader.ts,” and how to pass “scriptFilePath.”

2. **Prompt Caching Guide** (if exists)  
   - Document how you set up or structure the “system” array with the “cache_control” property.  
   - Explain the importance of identical text for cache hits, the 5-minute cache TTL, and the best practices for partial caching.

3. **Comments and Code Examples**  
   - Comment around the “route.ts” Anthropic request to highlight “cache_control”.  
   - Describe how you handle local vs ephemeral caching synergy.

With these updates, you’ll benefit from Anthropic’s ephemeral prompt caching to reuse your script examples for Claude 3.5 Sonnet. By storing large repeated scripts as a “system” block (or in “messages”) with cache_control, subsequent calls within five minutes reuse that prefix, reducing token costs and latency.
