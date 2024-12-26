import React from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Button } from "@/components/ui/button";
import { Paperclip } from 'lucide-react';
import { Textarea } from './ui/textarea';

interface ScenarioDialogProps {
    onSubmit: (content: string) => void;
}

const ScenarioDialog: React.FC<ScenarioDialogProps> = ({ onSubmit }) => {
    const [content, setContent] = React.useState('');

    return (
        <Dialog>
            <DialogTrigger asChild className="absolute top-[6px] right-[75px]">
                <Button type="submit" size="icon" className="h-[30px] w-[30px]" variant="secondary">
                    <Paperclip size={20} color="black" />
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