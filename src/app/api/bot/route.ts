import { NextResponse } from 'next/server';
import { loadScriptFromFile } from '@/lib/utils/scriptLoader';
import { loadPdfAsBase64 } from '@/lib/utils/pdfLoader';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

// Load all text files for the system prompt
const scriptAdvices = loadScriptFromFile('public/scenario_examples/script_advices.txt');
const trueDetectivePitch = loadScriptFromFile('public/scenario_examples/true_detective_pitch_example.txt');
const typicalProblems = loadScriptFromFile('public/scenario_examples/typical_problems_in_scripts.txt');

const SYSTEM_MESSAGE = `Вы — элитный коуч для русскоязычных сценаристов. Ваша задача — помочь пользователям анализировать и улучшать их сценарии или части сценариев, основываясь на контексте диалога и примерах из сценариев и советов, предоставленных вам в виде документов.`;

const INITIAL_INSTRUCTION = `При анализе сценария и предоставлении обратной связи, учитывайте следующие моменты:

1. Тщательно проанализируйте сценарий, уделяя особое внимание:
- Структуре сюжета
- Развитию персонажей
- Диалогам
- Темпу повествования
- Мотивации героев
- Тематическим элементам

2. Опирайтесь на материалы из следующих документов:
- breaking_bad_pilot.pdf: используйте данный пилот как пример удачной драматургии и проработки вступительной серии.
- script_advices.txt: применяйте эти базовые советы для написания и редактирования сценариев.
- true_detective_pitch_example.txt: ориентируйтесь на этот пример для демонстрации, как можно эффективно презентовать и «пропитчить» свою идею.
- typical_problems_in_scripts.txt: изучайте типичные сценарные проблемы и их решения, чтобы заранее избегать распространённых ошибок.

3. Предоставьте конструктивную обратную связь и предложения по улучшению, основываясь на лучших практиках сценарного мастерства, учитывая примеры и рекомендации из перечисленных выше документов.

4. Приводите конкретные примеры или альтернативы для иллюстрации ваших идей, придерживаясь оригинального замысла автора, а также опирайтесь на описанные модели удачных решений из breaking_bad_pilot.pdf и true_detective_pitch_example.txt.

5. Будьте поддерживающим и вдохновляющим, сохраняя при этом высокий уровень профессионализма и экспертности.

6. Адаптируйте свои советы под конкретные потребности и уровень навыков русскоязычного сценариста. В этом вам помогут практические рекомендации из script_advices.txt.

7. Помогайте развивать идею сценария, задавая наводящие вопросы и предлагая методы её расширения в полноценный проект, а также указывайте, с какими типичными проблемами (из typical_problems_in_scripts.txt) пользователь может столкнуться на этом пути.

8. Рекомендуйте способы улучшения описания персонажей, атмосферы и деталей в разработке сцен, обращая внимание на преимущества пилотного формата, продемонстрированные в breaking_bad_pilot.pdf.

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

Ваша задача — использовать информацию из перечисленных документов по максимуму, помогая анализировать и дорабатывать сценарии на высоком профессиональном уровне.`;

// function chunkString(str: string, maxSize: number): string[] {
//   const chunks: string[] = [];
//   let index = 0;
//   while (index < str.length) {
//     chunks.push(str.slice(index, index + maxSize));
//     index += maxSize;
//   }
//   return chunks;
// }

/**
 * Merge an array of text chunks so that the total ephemeral blocks do NOT exceed 4.
 * If the array is length <= 4, do nothing. Otherwise, combine them into 4 total chunks.
 *
 * You can adapt this approach if you need more nuanced merging logic.
 */
function mergeChunksToMaxFour(chunks: string[]): string[] {
  if (chunks.length <= 4) {
    return chunks;
  }
  // We have more than 4 chunks. Let's merge them so we only end up with 4.
  // A simple approach is to distribute them roughly evenly across 4 buckets.
  const merged: string[] = [ '', '', '', '' ];
  // E.g., each iteration adds a chunk to whichever ephemeral block is "current"
  let currentIndex = 0;

  for (let i = 0; i < chunks.length; i++) {
    merged[currentIndex] += chunks[i];
    // Move to next block, but do not exceed index 3
    if (currentIndex < 3) {
      currentIndex++;
    } else {
      currentIndex = 0; 
    }
  }

  return merged.filter(block => block.trim().length > 0);
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

    // Load PDF file
    const breakingBadPdfBase64 = loadPdfAsBase64('breaking_bad_pilot.pdf');
    // const lostPdfBase64 = loadPdfAsBase64('lost_series_pilot_script_example.pdf');
    const gameOfThronesPdfBase64 = loadPdfAsBase64('game_of_thrones_pilot_script.pdf');

    // 3. Create a streaming response from Anthropic
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
              max_tokens: 1024,
              system: [
                {
                  type: 'text',
                  text: SYSTEM_MESSAGE + '\n\n' + INITIAL_INSTRUCTION
                },
                {
                  type: 'text',
                  text: `Script Writing Advice:\n${scriptAdvices}`,
                  cache_control: { type: 'ephemeral' }
                },
                {
                  type: 'text',
                  text: `True Detective Pitch Example:\n${trueDetectivePitch}`,
                  cache_control: { type: 'ephemeral' }
                },
                  {
                    type: 'text',
                    text: `Common Script Problems:\n${typicalProblems}`,
                    cache_control: { type: 'ephemeral' }
                  }
              ],
              messages: [
                {
                  role: 'user',
                  content: [
                    {
                      type: 'document',
                      source: {
                        type: 'base64',
                        media_type: 'application/pdf',
                        data: breakingBadPdfBase64,
                      },
                      cache_control: { type: 'ephemeral' },
                    },
                    // {
                    //   type: 'document',
                    //   source: {
                    //     type: 'base64',
                    //       media_type: 'application/pdf',
                    //       data: gameOfThronesPdfBase64,
                    //     },
                    //     cache_control: { type: 'ephemeral' },
                    // },                    
                    {
                      type: 'text',
                      text: messages[0].content,
                    },
                  ],
                },
                ...messages.slice(1).map(msg => ({
                  role: 'user',
                  content: msg.content
                }))
              ],
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




// export async function POST(request: Request) {
//   try {
//     // 1. Parse incoming JSON
//     const { messages } = await request.json();

//     if (!messages || !Array.isArray(messages)) {
//       return NextResponse.json(
//         { error: 'Invalid or missing messages in request body' },
//         { status: 400 }
//       );
//     }

//     // 2. Load potentially large text (e.g. from "duglas.txt")
//     const duglasContent = loadDuglasText() ?? '';

//     // 3. Break the loaded text into smaller chunks so we don't exceed 200k token limit in a single block.
//     //    Adjust as needed. This is a rough guess to keep us safely under the max token limit.
//     const CHUNK_SIZE = 45000; // You can tune this based on your actual token usage
//     let textChunks = chunkString(duglasContent, CHUNK_SIZE);

//     // 4. If we have more than 4 chunks, merge them so ephemeral blocks do not exceed 4.
//     textChunks = mergeChunksToMaxFour(textChunks);

//     // Build up the system array with ephemeral blocks for each chunk
//     const systemBlocks = [
//       {
//         type: 'text',
//         text: SYSTEM_MESSAGE + '\n\n' + INITIAL_INSTRUCTION
//       },
//       ...textChunks.map(chunk => ({
//         type: 'text',
//         text: chunk,
//         // Using ephemeral caching
//         cache_control: { type: 'ephemeral' }
//       }))
//     ];

//     // 5. Create a streaming response from Anthropic with ephemeral caching
//     const stream = new ReadableStream({
//       async start(controller) {
//         try {
//           const response = await fetch(ANTHROPIC_API_URL, {
//             method: 'POST',
//             headers: {
//               'Content-Type': 'application/json',
//               'X-API-Key': ANTHROPIC_API_KEY!,
//               // The "anthropic-beta: prompt-caching-2024-07-31" header indicates usage of the new caching system
//               'anthropic-version': '2023-06-01',
//               'anthropic-beta': 'prompt-caching-2024-07-31'
//             },
//             body: JSON.stringify({
//               model: 'claude-3-5-sonnet-20241022',
//               max_tokens: 2096,
//               // Pass in our newly constructed system blocks (now chunked with ephemeral caching)
//               system: systemBlocks,
//               messages: messages.map(msg => ({
//                 role: 'user',
//                 content: msg.content
//               })),
//               stream: true,
//               temperature: 0.0,
//             }),
//           });

//           if (!response.ok) {
//             const errorBody = await response.text();
//             console.error('Anthropic API error details:', errorBody);
//             throw new Error(`Anthropic API error: ${response.statusText} - ${errorBody}`);
//           }

//           const reader = response.body?.getReader();
//           if (!reader) {
//             throw new Error('Response body is null');
//           }

//           while (true) {
//             const { done, value } = await reader.read();
//             if (done) {
//               controller.close();
//               break;
//             }
//             controller.enqueue(value);
//           }
//         } catch (err) {
//           controller.error(err);
//         }
//       },
//     });

//     // 6. Return the streaming SSE response
//     return new Response(stream, {
//       headers: {
//         'Content-Type': 'text/event-stream',
//         'Cache-Control': 'no-cache',
//         'Connection': 'keep-alive',
//       },
//     });
//   } catch (error) {
//     console.error('Ошибка в API чата:', error);
//     return NextResponse.json(
//       {
//         error: error instanceof Error ? error.message : 'Неизвестная ошибка',
//       },
//       { status: 500 }
//     );
//   }
// }
