'use client';

import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';

export function SidebarToggle() {
  const { open, setOpen } = useSidebar();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-white hover:bg-white/10"
      onClick={() => setOpen(!open)}
    >
      <Menu className="h-5 w-5" />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
} 