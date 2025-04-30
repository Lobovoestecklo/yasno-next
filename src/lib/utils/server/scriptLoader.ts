import { readFileSync } from 'fs';
import { join } from 'path';

export function loadScriptFromFile(filePath: string): string {
  if (typeof process === 'undefined') {
    console.warn(`loadScriptFromFile was called in a non-server environment.`);
    return '';
  }

  try {
    // Try to resolve the path relative to the current working directory
    const absolutePath = join(process.cwd(), filePath);
    const content = readFileSync(absolutePath, 'utf-8');
    
    if (!content) {
      console.error(`❌ File ${filePath} exists but is empty`);
      return '';
    }
    
    return content;
  } catch (error) {
    console.error(`❌ Error loading script from ${filePath}:`, error);
    
    // Try alternative path resolution for production
    try {
      const alternativePath = join(__dirname, '..', '..', '..', filePath);
      const content = readFileSync(alternativePath, 'utf-8');
      
      if (!content) {
        console.error(`❌ File ${filePath} exists but is empty (alternative path)`);
        return '';
      }
      
      return content;
    } catch (altError) {
      console.error(`❌ Error loading script from alternative path ${filePath}:`, altError);
      return '';
    }
  }
}
