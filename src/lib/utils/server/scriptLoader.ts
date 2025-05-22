import { readFileSync } from 'fs';
import { join } from 'path';

export function loadScriptFromFile(filePath: string): string {
  if (typeof process === 'undefined') {
    console.warn(`loadScriptFromFile was called in a non-server environment.`);
    return '';
  }

  const possiblePaths = [
    // Try relative to current working directory
    join(process.cwd(), filePath),
    // Try relative to the file's directory
    join(__dirname, '..', '..', '..', filePath),
    // Try in the root directory
    join(process.cwd(), 'src', filePath),
    // Try in the public directory
    join(process.cwd(), 'public', filePath)
  ];

  console.log('Attempting to load script from paths:', possiblePaths);

  for (const path of possiblePaths) {
    try {
      console.log(`Trying to load from: ${path}`);
      const content = readFileSync(path, 'utf-8');
      
      if (!content) {
        console.error(`❌ File ${path} exists but is empty`);
        continue;
      }
      
      console.log(`✅ Successfully loaded script from ${path}`);
      return content;
    } catch (error) {
      console.error(`❌ Failed to load from ${path}:`, error);
    }
  }

  console.error(`❌ Failed to load script from any of the attempted paths: ${filePath}`);
  return '';
}
