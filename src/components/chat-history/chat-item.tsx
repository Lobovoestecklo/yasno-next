'use client';

import { memo } from 'react';
import Link from 'next/link';
import { MoreHorizontal, Trash } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { ChatHistory } from '@/lib/utils/chat-history';

interface ChatItemProps {
  chat: ChatHistory;
  isActive: boolean;
  onDelete: (chatId: string) => void;
  setOpenMobile: (open: boolean) => void;
}

const PureChatItem = ({
  chat,
  isActive,
  onDelete,
  setOpenMobile,
}: ChatItemProps) => {
  return (
    <SidebarMenuItem>
      <Link href={`/chat/${chat.id}`} onClick={() => setOpenMobile(false)} className="flex-1 min-w-0">
        <SidebarMenuButton isActive={isActive}>
          <span className="truncate">{chat.title}</span>
        </SidebarMenuButton>
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">More</span>
          </div>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent side="bottom" align="end">
          <DropdownMenuItem
            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
            onClick={() => onDelete(chat.id)}
          >
            <Trash className="mr-2 h-4 w-4" />
            <span>Удалить</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
};

export const ChatItem = memo(PureChatItem, (prevProps, nextProps) => {
  return prevProps.isActive === nextProps.isActive && 
         prevProps.chat.title === nextProps.chat.title &&
         prevProps.chat.id === nextProps.chat.id;
}); 