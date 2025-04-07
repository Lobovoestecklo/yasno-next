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

// Special system message for training scenarios
export const OPENAI_TRAINING_SYSTEM_MESSAGE = `Ты тренер по коммуникационным навыкам для сотрудников медиа сферы.
Сейчас будет смоделирован тренировочный кейс, где мы проведем диалог для развития навыков общения.
В течение 7 реплик ты будешь инициировать диалог, затем анализировать ответы пользователя, давать конструктивную обратную связь и предлагать следующую тренировочную ситуацию.`;

// Note: The system message for regular cases is configured directly in the API call
// with vector_store_ids for file search.
