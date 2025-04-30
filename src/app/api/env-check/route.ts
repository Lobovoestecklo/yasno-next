import { NextResponse } from 'next/server';

export async function GET() {
  // Создаем безопасный объект с информацией об окружении
  const envInfo = {
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    envVars: Object.keys(process.env).filter(key => 
      key.includes('OPENAI') || 
      key.includes('VERCEL') || 
      key.includes('NODE')
    ),
    // Проверяем наличие ключевых переменных (без значений)
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    openAIKeyLength: process.env.OPENAI_API_KEY?.length,
    // Проверяем путь к файлу system-message
    cwd: process.cwd(),
    // Проверяем доступность файловой системы
    canAccessFS: typeof process !== 'undefined' && typeof require !== 'undefined'
  };

  return NextResponse.json(envInfo);
} 