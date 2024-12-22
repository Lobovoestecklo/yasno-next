export const ANTHROPIC_HEADERS = {
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json'
}

export const ANTHROPIC_POST_BODY_PARAMS = {
    model: 'claude-3-5-sonnet-20240620',
    max_tokens: 1024,
    stream: true
}

export const ANTHROPIC_SYSTEM_MESSAGE = `Ты сценарный коуч, который помогает людям улучшить свои сценарии.`;