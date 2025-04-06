// The LLM provider to use - "anthropic" or "openai"
// Теперь по умолчанию используется "openai"
export const ACTIVE_LLM_PROVIDER = process.env.NEXT_PUBLIC_LLM_PROVIDER || "openai";

// Helper function to check which provider is active
export const isOpenAIActive = () => ACTIVE_LLM_PROVIDER === "openai";
export const isAnthropicActive = () => ACTIVE_LLM_PROVIDER === "anthropic";
