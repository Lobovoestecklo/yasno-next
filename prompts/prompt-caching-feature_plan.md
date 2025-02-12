```markdown
# Summary
To incorporate the prompt caching feature from Anthropic (as noted in the [Anthropic documentation on prompt caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)) into your project, you can enhance your existing architecture by introducing a caching mechanism that stores previously used prompts/script snippets and retrieves them efficiently. This helps reduce redundant requests and ensures faster responses when script examples are reused.

Below is a suggested approach that introduces a new “promptCache” utility and modifies existing code to handle caching for the scenario and prompt scripts.

---

# New Files
## 1. src/lib/utils/promptCache.ts
Purpose: Provide functions to store and retrieve prompts from a cache. This cache could be either an in-memory cache (for quick proof-of-concept) or a more durable store like Redis, depending on your production requirements.

```typescript:src/lib/utils/promptCache.ts
export interface ICachedPrompt {
  id: string;
  promptString: string;
  response: string;
  timestamp: number;
}

/**
 * Simple in-memory cache for demonstration.
 * In production, replace this with a Redis or database implementation for persistence.
 */
const promptCache: Map<string, ICachedPrompt> = new Map();

/**
 * Retrieves a response from the cache if it exists.
 * @param promptString The string of the prompt to retrieve.
 * @returns {ICachedPrompt | null}
 */
export function getCachedPrompt(promptString: string): ICachedPrompt | null {
  const cacheEntry = [...promptCache.values()].find(
    (entry) => entry.promptString === promptString
  );
  if (cacheEntry) {
    return cacheEntry;
  }
  return null;
}

/**
 * Stores a prompt in the cache.
 * @param promptString The unique prompt string.
 * @param response The response from Anthropic or the chat.
 */
export function storePromptInCache(promptString: string, response: string) {
  const timestamp = Date.now();
  const id = `${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
  const newCacheEntry: ICachedPrompt = {
    id,
    promptString,
    response,
    timestamp,
  };
  promptCache.set(id, newCacheEntry);
}
```

---

# Modifications
Below are the primary integrations into your existing files. The goal is to incorporate a “check cache first” flow before sending requests to the Anthropic API, and store responses in the cache once retrieved.

## 1. src/lib/hooks/useAnthropicMessages/index.ts
Reason: Modify the existing logic that sends messages to Anthropic to leverage the new prompt cache. If the script-based prompt is found in the cache, immediately return the cached response rather than sending a new request.

```typescript:src/lib/hooks/useAnthropicMessages/index.ts
import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { 
  ANTHROPIC_HEADERS, 
  ANTHROPIC_POST_BODY_PARAMS, 
  ANTHROPIC_SYSTEM_MESSAGE, 
  SCENARIO_MESSAGE_PREFIX 
} from '@/lib/constants';
import { prepareMessagesForPost } from '@/lib/utils/anthropic';
import { getCachedPrompt, storePromptInCache } from '@/lib/utils/promptCache';
import { IMessage } from '@/types';

export const useAnthropicMessages = (
  setInputValue: (value: string) => void,
  localStorageMessages: IMessage[],
  saveMessages: (messages: IMessage[]) => void,
  getSavedMessages: () => IMessage[]
) => {
  const [messages, setMessages] = useState<IMessage[]>(localStorageMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedMessageId, setStreamedMessageId] = useState<string | null>(null);

  const submitScenario = useCallback(async (scenario: string) => {
    // no caching logic needed here, but you could incorporate it if needed
    const scenarioMessage: IMessage = {
      id: uuidv4(),
      is_scenario: true,
      role: 'user',
      content: `${SCENARIO_MESSAGE_PREFIX}\n${scenario}`,
    };
    setMessages((prev) => {
      const newMessages = [...prev, scenarioMessage];
      saveMessages(newMessages);
      return newMessages;
    });
  }, [messages]);

  const submitUserMessage = useCallback(async (message: string) => {
    const userMessage: IMessage = {
      id: uuidv4(),
      role: 'user',
      content: message,
    };
    setMessages((prev) => {
      const newMessages = [...prev, userMessage];
      saveMessages(newMessages);
      return newMessages;
    });
    setInputValue('');
    setIsStreaming(true);

    // Check the cache before sending to Anthropic
    const cacheKey = message.trim();
    const cached = getCachedPrompt(cacheKey);
    if (cached) {
      // If found in cache, create a new assistant message directly
      const assistantMessageId = uuidv4();
      const assistantMessage: IMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: cached.response,
      };
      setMessages((prev) => {
        const newMessages = [...prev, assistantMessage];
        saveMessages(newMessages);
        return newMessages;
      });
      setIsStreaming(false);
      return;
    }

    // Otherwise, proceed with sending request to Anthropic
    const messagesToPost = prepareMessagesForPost([...messages, userMessage]);

    try {
      const response = await fetch('/api/bot', {
        method: 'POST',
        headers: {
          ...ANTHROPIC_HEADERS,
        },
        body: JSON.stringify({
          ...ANTHROPIC_POST_BODY_PARAMS,
          messages: messagesToPost,
          system: ANTHROPIC_SYSTEM_MESSAGE,
        }),
      });

      if (!response.ok) {
        console.log(`HTTP error! status: ${response.status}`);
        alert('Что-то пошло не так, попробуйте еще раз!');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        console.log('Response body is not readable');
        alert('Что-то пошло не так, попробуйте еще раз!');
        return;
      }

      let assistantMessageId: string | null = null;
      let assistantMessageContent = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'message_stop' && assistantMessageId) {
              // store the full text of the assistant’s response in cache
              storePromptInCache(cacheKey, assistantMessageContent);

              saveMessages([
                ...getSavedMessages(),
                {
                  id: assistantMessageId,
                  role: 'assistant',
                  content: assistantMessageContent,
                },
              ]);
            }
            if (data.type === 'message_start') {
              assistantMessageId = data.message.id;
              setStreamedMessageId(assistantMessageId);
            } else if (
              data.type === 'content_block_delta' && 
              data.delta.type === 'text_delta'
            ) {
              assistantMessageContent += data.delta.text;
              setMessages((prev) => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage.role === 'assistant' && lastMessage.id === assistantMessageId) {
                  lastMessage.content = assistantMessageContent;
                } else {
                  newMessages.push({
                    id: assistantMessageId || uuidv4(),
                    role: 'assistant',
                    content: assistantMessageContent,
                  });
                }
                return newMessages;
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error submitting message:', error);
      alert('Что-то пошло не так, попробуйте еще раз!');
    } finally {
      setIsStreaming(false);
      setStreamedMessageId(null);
    }
  }, [messages, setInputValue]);

  useEffect(() => {
    setMessages(localStorageMessages);
  }, [localStorageMessages]);

  return {
    submitUserMessage,
    submitScenario,
    messages,
    isStreaming,
    streamedMessageId,
  };
};
```

---

# Testing Strategy
1. **Unit Tests**:  
   - Write tests for the new “promptCache” functions to ensure they correctly store and retrieve prompts.
   - Confirm that reading from the cache returns the correct entry when a matching prompt is found.

2. **Integration Tests**:  
   - Test the modified “useAnthropicMessages” hook to verify that, if the user message matches a cached prompt, the system immediately responds with the cached content without sending a fetch request to “/api/bot”.

3. **Manual Verification**:  
   - Save a script snippet or user prompt.
   - Send the same prompt again to confirm that the second response is instant and uses the cached data.

---

# Documentation Updates
1. **README**:  
   - Add a new section under “Features” titled “Prompt Caching.” Explain the benefits, how the cache is utilized, and any relevant configuration variables (e.g., switching from local in-memory to a backed store).
   - Describe how to run the tests (unit, integration) for prompt caching.

2. **Code Comments**:  
   - Keep thorough comments in both src/lib/utils/promptCache.ts and src/lib/hooks/useAnthropicMessages/index.ts to explain important logic points.

3. **Prompt Caching Guide**:  
   - Consider a short MD file (e.g., docs/prompt-caching.md) describing best practices and relevant environment variables if you move the cache to a cloud or database-backed store.

---

By following these recommendations, you can incorporate Anthropic’s prompt caching feature into your app. This will make it easy to reuse script snippets (from your local text files) and reduce calls to the API for repeated prompts.
```

