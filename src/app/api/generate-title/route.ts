import { IMessage } from '@/types';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    if (!process.env.OPENAI_API_KEY) {
      console.log('OPENAI_API_KEY is not set, using fallback title');
      return Response.json({ title: 'Новый чат' });
    }

    // Фильтруем сообщения: оставляем только валидные объекты IMessage
    const validMessages = messages.filter((msg: IMessage | null): msg is IMessage => 
      msg !== null && msg.role !== undefined && msg.content !== undefined
    );

    if (validMessages.length === 0) {
      return Response.json({ title: 'Новый чат' });
    }

    // Находим первое сообщение пользователя для использования в качестве запасного заголовка
    const firstUserMessage = validMessages.find((msg: IMessage) => msg.role === 'user');
    const fallbackTitle = firstUserMessage 
      ? firstUserMessage.content.length > 30
        ? `${firstUserMessage.content.substring(0, 30)}...`
        : firstUserMessage.content
      : 'Новый чат';

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo', // Выберите нужную модель
          max_tokens: 100,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that generates concise, descriptive titles for chat conversations. Create a title in Russian that captures the main topic or intent of the conversation in 5-7 words.'
            },
            {
              role: 'user',
              content: `Generate a short title in Russian language for this chat conversation:\n\n${validMessages.map((msg: IMessage) => `${msg.role}: ${msg.content}`).join('\n')}`
            }
          ]
        })
      });

      if (!response.ok) {
        console.log('OpenAI API error, using fallback title');
        return Response.json({ title: fallbackTitle });
      }

      const data = await response.json();
      const title = data.choices && data.choices.length > 0 
        ? data.choices[0].message.content 
        : fallbackTitle;
      return Response.json({ title });
    } catch (error) {
      console.log('Error calling OpenAI API, using fallback title:', error);
      return Response.json({ title: fallbackTitle });
    }
  } catch (error) {
    console.log('Error in generate-title route, using fallback title:', error);
    return Response.json({ title: 'Новый чат' });
  }
}
