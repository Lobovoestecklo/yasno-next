export function loadScriptFromFile(filePath: string): string {
    try {
      const fs = require('fs');
      const path = require('path');
      const absolutePath = path.resolve(filePath);
      return fs.readFileSync(absolutePath, { encoding: 'utf-8' });
    } catch (error) {
      console.error(`Error loading the file: ${error}`);
      return '';
    }
  }