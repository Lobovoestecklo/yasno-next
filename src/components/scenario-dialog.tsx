import React from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Button } from "@/components/ui/button";
import { Paperclip, FileText } from 'lucide-react';
import { Textarea } from './ui/textarea';
import * as pdfjs from 'pdfjs-dist';

// Set the workerSrc to the correct path
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

interface ScenarioDialogProps {
    onSubmit: (content: string) => void;
}

const ScenarioDialog: React.FC<ScenarioDialogProps> = ({ onSubmit }) => {
    const [content, setContent] = React.useState('');

    const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
            let extractedText = '';

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map((item: any) => item.str).join(' ');
                extractedText += pageText + '\n';
            }

            setContent(extractedText);
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild className="absolute top-[6px] right-[75px]">
                <Button type="submit" size="icon" className="h-[30px] w-[30px]" variant="secondary">
                    <Paperclip size={20} color="black" />
                    {content.trim().length > 0 ? (
                        <div className="absolute top-1 left-1 bg-purple-500 text-white rounded-full w-1 h-1 flex items-center justify-center">
                        </div>
                    ) : null}
                    <span className="sr-only">Отправить</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogTitle>Вставить сценарий</DialogTitle>
                <DialogDescription>
                    <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Вставьте сценарий.."
                        className="w-full h-64 p-2 border rounded resize-none"
                        rows={2}
                    />
                </DialogDescription>
                <div className="flex justify-end mt-4">
                    <input
                        type="file"
                        accept="application/pdf"
                        onChange={handlePdfUpload}
                        className="hidden"
                        id="pdf-upload"
                    />
                    <label htmlFor="pdf-upload" className="mr-2">
                        <Button size="icon" variant="secondary" onClick={(e) => {
                            e.preventDefault();
                            document.getElementById('pdf-upload')?.click();
                        }}>
                            <FileText size={20} color="black" />
                            <span className="sr-only">Загрузить PDF</span>
                        </Button>
                    </label>
                    <DialogClose asChild>
                        <Button
                            className="mr-2"
                            onClick={() => {
                                onSubmit(content);
                            }}
                        >
                            Вставить
                        </Button>
                    </DialogClose>
                    <DialogClose asChild>
                        <Button variant="secondary">Отмена</Button>
                    </DialogClose>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ScenarioDialog;