'use client';

import { useRouter } from 'next/navigation';
import { Plus, X } from 'lucide-react';
import Link from 'next/link';
import { clearMessagesAndReload } from '@/lib/utils/local-storage-chat-messages';

import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { SidebarHistory } from './sidebar-history';

export function AppSidebar() {
  const router = useRouter();
  const { setOpen } = useSidebar();

  const handleNewChat = () => {
    setOpen(false);
    router.push('/chat/new');
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex flex-row justify-between items-center">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="flex flex-row gap-3 items-center"
            >
              <span className="text-lg font-semibold px-2 hover:bg-muted rounded-md cursor-pointer">
                История чатов
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleNewChat}
                  >
                    <Plus className="h-4 w-4" />
                    <span className="sr-only">Новый чат</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Новый чат</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setOpen(false)}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Закрыть</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Закрыть</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarHistory />
      </SidebarContent>
    </Sidebar>
  );
} 