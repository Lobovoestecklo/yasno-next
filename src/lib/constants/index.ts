import { IMessage } from "@/types";

export const OPENAI_HEADERS = {
    'Content-Type': 'application/json'
};

export const OPENAI_POST_BODY_PARAMS = {
    model: 'gpt-4',
    max_tokens: 3120,
    stream: true
};

export const OPENAI_SYSTEM_MESSAGE = `Ты сценарный коуч, который помогает людям улучшить свои сценарии.`;

export const LOCAL_STORAGE_CHAT_MESSAGES_KEY = 'scenario-chat-messages';

export const INITIAL_BOT_MESSAGE: IMessage = {
    id: 'assistant-initial',
    role: 'assistant',
    content: `Здравствуйте! Я ваш коммуникационный коуч-редактор, и я здесь, чтобы помочь вам улучшить письменную коммуникацию. Я могу:
  
  - Проанализировать и улучшить ваши письма и сообщения
  - Адаптировать тон под конкретного получателя
  - Предложить готовые шаблоны для типичных ситуаций
  - Дать рекомендации по структуре и стилю текста
  
  Просто отправьте мне текст, который хотите улучшить, или опишите ситуацию, для которой нужно составить сообщение. Я также могу объяснить причины каждой предложенной правки, чтобы вы развивали свои навыки письменной коммуникации.
  
  С чем я могу вам помочь?`
};
