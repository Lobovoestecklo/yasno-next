import { NextResponse } from 'next/server';
import { loadScriptFromFile } from '@/lib/utils/server/scriptLoader';

// Define Anthropic API credentials and endpoint. t
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

// Load static context files for building the system prompt.
const scriptAdvices = loadScriptFromFile('src/lib/scenario-examples/script-advices.txt');
const trueDetectivePitch = loadScriptFromFile('src/lib/scenario-examples/true-detective-pitch-example.txt');
const typicalProblems = loadScriptFromFile('src/lib/scenario-examples/typical-problems-in-scripts.txt');
const breakingBadPilot = loadScriptFromFile('src/lib/scenario-examples/breaking-bad-pilot.txt');

// Define the base system message and instructions.
const SYSTEM_MESSAGE = `Вы — элитный коуч для русскоязычных сценаристов. Ваша задача — помочь пользователям анализировать и улучшать их сценарии или части сценариев, основываясь на контексте диалога и примерах из сценариев и советов, предоставленных вам в виде документов.`;

const INITIAL_INSTRUCTION = `При анализе сценария и предоставлении обратной связи, учитывайте следующие моменты:

1. Тщательно проанализируйте сценарий, уделяя особое внимание:
- Структуре сюжета
- Развитию персонажей
- Диалогам
- Темпу повествования
- Мотивации героев
- Тематическим элементам
- Авторскому голосу и стилю

2. Опирайтесь на материалы из следующих документов:
- breaking-bad-pilot.txt: используйте данный пилот как пример удачной драматургии и проработки вступительной серии.
- script-advices.txt: применяйте эти базовые советы для написания и редактирования сценариев.
- true-detective-pitch-example.txt: ориентируйтесь на этот пример для демонстрации, как можно эффективно презентовать и «пропитчить» свою идею.
- typical-problems-in-scripts.txt: изучайте типичные сценарные проблемы и их решения, чтобы заранее избегать распространённых ошибок.
Важно: не упоминайте названия файлов в вашем ответе.

3. Предоставьте конструктивную обратную связь и предложения по улучшению, основываясь на лучших практиках сценарного мастерства, учитывая примеры и рекомендации из перечисленных выше документов.

4. Приводите конкретные примеры или альтернативы для иллюстрации ваших идей, придерживаясь оригинального замысла автора, а также опирайтесь на описанные модели удачных решений из breaking_bad_pilot.pdf и true_detective_pitch_example.txt.

5. Будьте поддерживающим и вдохновляющим, сохраняя при этом высокий уровень профессионализма и экспертности.

6. Адаптируйте свои советы под конкретные потребности и уровень навыков русскоязычного сценариста. В этом вам помогут практические рекомендации из script-advices.txt.

7. Помогайте развивать идею сценария, задавая наводящие вопросы и предлагая методы её расширения в полноценный проект, а также указывайте, с какими типичными проблемами (из typical-problems-in-scripts.txt) пользователь может столкнуться на этом пути.

8. Рекомендуйте способы улучшения описания персонажей, атмосферы и деталей в разработке сцен, обращая внимание на преимущества пилотного формата, продемонстрированные в breaking_bad_pilot.pdf.

9. При анализе авторского голоса и стиля:
- Определите уникальные стилистические особенности текста
- Выявите характерные приемы повествования
- Укажите, на каких известных сценаристов/режиссеров похож авторский стиль, обосновывая сходства конкретными примерами

Перед тем, как дать окончательный ответ, проведите тщательный анализ сценария или запроса пользователя. Оберните этот процесс в тег <разбор_сценария>. В рамках этого разбора:

1. Разделите сценарий или запрос на конкретные элементы (сюжет, персонажи, диалоги, темы).
2. Для каждого элемента перечислите ключевые сильные стороны и области для улучшения.
3. Оцените, насколько хорошо сценарий соответствует отраслевым стандартам и лучшим практикам российского сценарного мастерства.

После завершения анализа, структурируйте ваш ответ следующим образом:

1. <разбор_сценария>
Подробный анализ сценария или запроса пользователя, выделяющий его сильные стороны и области для улучшения по каждому элементу.
</разбор_сценария>

2. <предложения>
Детальные предложения по улучшению сценария, включая конкретные техники, примеры или альтернативы.
</предложения>

3. <объяснение>
Объяснение логики ваших предложений, ссылаясь на соответствующие принципы сценарного мастерства или отраслевые стандарты.
</объяснение>

4. <поддержка>
Заключительные слова поддержки и одобрения усилий сценариста, подчеркивающие его потенциал.
</поддержка>

Важные рекомендации:
- Поддерживайте высокий уровень владения русским языком в ваших ответах. Используйте уместную русскую терминологию сценарного мастерства и идиоматические выражения.
- Если вам нужно больше информации для предоставления исчерпывающего ответа, задайте уточняющие вопросы в рамках вашего ответа.
- Всегда стремитесь давать советы, которые одновременно практичны и креативны, помогая сценаристу улучшить свою работу, оставаясь верным своему видению.
- Если ваш ответ получается длинным, разделите его на логические части и в конце каждой части спрашивайте у пользователя "Мне продолжить?"

Ваша задача — использовать информацию из перечисленных документов по максимуму, помогая анализировать и дорабатывать сценарии на высоком профессиональном уровне.`;

// === Combine all static context into a single system content block for caching ===
const staticSystemContent = `
Script Writing Advice:
${scriptAdvices}

True Detective Pitch Example:
${trueDetectivePitch}

Common Script Problems:
${typicalProblems}

Breaking Bad Pilot:
${breakingBadPilot}

${SYSTEM_MESSAGE}

${INITIAL_INSTRUCTION}
`;

const MAX_RETRIES = 3;
const INITIAL_TIMEOUT = 30000; // 30 seconds
const BACKOFF_FACTOR = 1.5;

async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES, timeout = INITIAL_TIMEOUT): Promise<Response> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying request. Attempts remaining: ${retries - 1}`);
      // Exponential backoff
      const nextTimeout = timeout * BACKOFF_FACTOR;
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
      return fetchWithRetry(url, options, retries - 1, nextTimeout);
    }
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid or missing messages in request body' },
        { status: 400 }
      );
    }

    const response = await fetchWithRetry(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'prompt-caching-2024-07-31'
      },
      body: JSON.stringify({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 3120,
        system: [
          {
            type: 'text',
            text: staticSystemContent,
            cache_control: { type: 'ephemeral' }
          }
        ],
        messages: messages,
        stream: true,
        temperature: 0.0,
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Anthropic API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorBody
      });
      throw new Error(`Anthropic API error: ${response.statusText} (${response.status})`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is null');
    }

    let buffer = '';
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = new TextDecoder().decode(value);
            buffer += chunk;
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('event:')) continue;
              if (line.startsWith('data: ')) {
                if (line.trim() === 'data: [DONE]') continue;
                try {
                  const jsonData = JSON.parse(line.slice(6));
                  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(jsonData)}\n\n`));
                } catch {
                  controller.enqueue(new TextEncoder().encode(`${line}\n\n`));
                }
              }
            }
          }
          
          controller.close();

        } catch (error) {
          console.error('Stream processing error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
    
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error
          ? error.message
          : 'An unknown error occurred'
      },
      { status: 500 }
    );
  }
}