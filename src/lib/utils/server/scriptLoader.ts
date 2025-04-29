import { readFileSync } from 'fs';
import { join } from 'path';

export function loadScriptFromFile(filePath: string): string {
  if (typeof process === 'undefined') {
    console.warn(`loadScriptFromFile was called in a non-server environment.`);
    return '';
  }

  try {
    const absolutePath = join(process.cwd(), filePath);
    return readFileSync(absolutePath, 'utf-8');
  } catch (error) {
    console.error(`❌ Error loading script from ${filePath}:`, error);
    return '';
  }
}
