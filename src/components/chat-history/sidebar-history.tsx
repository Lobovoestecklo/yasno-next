'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { isToday, isYesterday, subMonths, subWeeks } from 'date-fns';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import { ChatItem } from './chat-item';
import { ChatHistory, deleteChatHistory, getAllChatHistories } from '@/lib/utils/chat-history';
import { INITIAL_BOT_MESSAGE } from '@/lib/constants';

type GroupedChats = {
  today: ChatHistory[];
  yesterday: ChatHistory[];
  lastWeek: ChatHistory[];
  lastMonth: ChatHistory[];
  older: ChatHistory[];
};

export function SidebarHistory() {
  const { id } = useParams();
  const { setOpen } = useSidebar();
  const [mounted, setMounted] = React.useState(false);
  const [chats, setChats] = React.useState<ChatHistory[]>([]);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  // Load chat histories and set up refresh interval
  React.useEffect(() => {
    const loadChats = () => {
      const allChats = getAllChatHistories();
      // Only filter out empty chats or those with just the initial message
      const validChats = allChats.filter(chat => 
        chat.messages && 
        chat.messages.length > 1
      );
      setChats(validChats);
    };

    // Initial load
    setMounted(true);
    loadChats();

    // Set up periodic refresh
    const refreshInterval = setInterval(loadChats, 1000);

    return () => {
      clearInterval(refreshInterval);
    };
  }, []);

  // Don't render anything until mounted
  if (!mounted) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="px-2 text-muted-foreground text-sm text-center">
            Загрузка...
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  const handleDelete = () => {
    if (deleteId) {
      deleteChatHistory(deleteId);
      setChats(getAllChatHistories());
      setShowDeleteDialog(false);
    }
  };

  const groupChatsByDate = (chats: ChatHistory[]): GroupedChats => {
    const now = new Date();
    const oneWeekAgo = subWeeks(now, 1);
    const oneMonthAgo = subMonths(now, 1);

    return chats.reduce(
      (groups, chat) => {
        const chatDate = new Date(chat.createdAt);

        if (isToday(chatDate)) {
          groups.today.push(chat);
        } else if (isYesterday(chatDate)) {
          groups.yesterday.push(chat);
        } else if (chatDate > oneWeekAgo) {
          groups.lastWeek.push(chat);
        } else if (chatDate > oneMonthAgo) {
          groups.lastMonth.push(chat);
        } else {
          groups.older.push(chat);
        }

        return groups;
      },
      {
        today: [],
        yesterday: [],
        lastWeek: [],
        lastMonth: [],
        older: [],
      } as GroupedChats
    );
  };

  if (chats.length === 0) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="px-2 text-muted-foreground text-sm text-center">
            Ваша история чатов будет здесь
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  const groupedChats = groupChatsByDate(chats);

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {groupedChats.today.length > 0 && (
              <>
                <div className="px-2 py-1 text-xs text-muted-foreground">
                  Сегодня
                </div>
                {groupedChats.today.map((chat) => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    isActive={chat.id === id}
                    onDelete={(chatId) => {
                      setDeleteId(chatId);
                      setShowDeleteDialog(true);
                    }}
                    setOpenMobile={setOpen}
                  />
                ))}
              </>
            )}

            {groupedChats.yesterday.length > 0 && (
              <>
                <div className="px-2 py-1 text-xs text-muted-foreground mt-6">
                  Вчера
                </div>
                {groupedChats.yesterday.map((chat) => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    isActive={chat.id === id}
                    onDelete={(chatId) => {
                      setDeleteId(chatId);
                      setShowDeleteDialog(true);
                    }}
                    setOpenMobile={setOpen}
                  />
                ))}
              </>
            )}

            {groupedChats.lastWeek.length > 0 && (
              <>
                <div className="px-2 py-1 text-xs text-muted-foreground mt-6">
                  Прошлая неделя
                </div>
                {groupedChats.lastWeek.map((chat) => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    isActive={chat.id === id}
                    onDelete={(chatId) => {
                      setDeleteId(chatId);
                      setShowDeleteDialog(true);
                    }}
                    setOpenMobile={setOpen}
                  />
                ))}
              </>
            )}            
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить историю чатов?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Это удалит этот чат
              из вашей истории.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 