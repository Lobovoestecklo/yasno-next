import React from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Button } from "@/components/ui/button";
import { ListRestart } from 'lucide-react';

interface ClearChatHistoryDialogProps {
    onAccept: () => void;
}

const ClearChatHistoryDialog: React.FC<ClearChatHistoryDialogProps> = ({ onAccept }) => {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <div role='button' onClick={() => { }} className="absolute right-[10px] top-[4px] w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                    <ListRestart size={24} color='white' />
                </div>
            </DialogTrigger>
            <DialogContent>
                <DialogTitle>Очистить историю сообщений</DialogTitle>
                <DialogDescription>
                    Все сообщения будут удалены и не будут доступны для восстановления.
                    Вы действительно хотите очистить историю сообщений?
                </DialogDescription>
                <div className="flex justify-end mt-4">
                    <DialogClose asChild>
                        <Button
                            className="mr-2"
                            onClick={() => {
                                onAccept();
                            }}
                        >
                            Очистить
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

export default ClearChatHistoryDialog;