import * as fs from 'fs';
import * as path from 'path';

export function loadPdfAsBase64(pdfPath: string): string {
  const fullPath = path.join(process.cwd(), pdfPath);
  const pdfData = fs.readFileSync(fullPath);
  return pdfData.toString('base64');
}