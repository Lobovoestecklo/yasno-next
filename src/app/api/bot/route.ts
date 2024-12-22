import { NextResponse } from 'next/server';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

const SYSTEM_MESSAGE = `Ты сценарный коуч, который помогает людям улучшить свои сценарии.`;

export async function POST(request: Request) {
    try {
        const { messages } = await request.json();

        console.log(messages);

        console.log(ANTHROPIC_API_KEY);

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json(
                { error: 'Invalid or missing messages in request body' },
                { status: 400 }
            );
        }

        const cleanedMessages = messages.map(({ role, content }) => ({ role, content }));

        // Create a new ReadableStream for the response
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    const response = await fetch(ANTHROPIC_API_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-API-Key': ANTHROPIC_API_KEY!,
                            'anthropic-version': '2023-06-01',
                        },
                        body: JSON.stringify({
                            messages: cleanedMessages,
                            model: 'claude-3-5-sonnet-20240620',
                            max_tokens: 1024,
                            system: SYSTEM_MESSAGE,
                            stream: true,
                        }),
                    });

                    if (!response.ok) {
                        console.log(response);
                        throw new Error(`Anthropic API error: ${response.statusText}`);
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
                } catch (error) {
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
        console.error('Error in chat API:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'An unknown error occurred' },
            { status: 500 }
        );
    }
}
