import { readFileSync } from 'fs';
import { resolve } from 'path';

export function loadScriptFromFile(filePath: string): string {
    try {
      const absolutePath = resolve(filePath);
      return readFileSync(absolutePath, { encoding: 'utf-8' });
    } catch (error) {
      console.error(`Error loading the file: ${error}`);
      return '';
    }
  }