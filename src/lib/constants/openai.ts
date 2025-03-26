export const OPENAI_VECTOR_STORE_IDS = [
    "vs_67e3e4dc86608191b9a30001e76567bf" // Replace with your actual vector store ID
  ];
  
  export const OPENAI_MODEL = "gpt-4o";
  
  export const OPENAI_MAX_TOKENS = 3120; // Match your current token limit
  
  export const OPENAI_POST_BODY_PARAMS = {
    temperature: 0,
    max_output_tokens: OPENAI_MAX_TOKENS,
    top_p: 1,
    store: true
  };
  
  // System message is now configured directly in the API call
  // with vector_store_ids for file search