import * as fs from 'fs';
import * as path from 'path';

export function loadPdfAsBase64(pdfFileName: string): string {
  const pdfPath = path.join(process.cwd(), 'public', 'scenario_examples', pdfFileName);
  const pdfData = fs.readFileSync(pdfPath);
  return pdfData.toString('base64');
}