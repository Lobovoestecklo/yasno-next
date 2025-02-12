'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface SidebarContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SidebarContext = React.createContext<SidebarContextType>({
  open: false,
  setOpen: () => {},
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  return (
    <SidebarContext.Provider value={{ open, setOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return React.useContext(SidebarContext);
}

export function Sidebar({ children }: { children: React.ReactNode }) {
  const { open } = useSidebar();

  return (
    <aside
      className={cn(
        'absolute top-0 left-0 h-full w-64 bg-background border-r z-40 transition-transform duration-300 ease-in-out',
        open ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {children}
    </aside>
  );
}

export const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex h-14 items-center border-b px-4', className)}
    {...props}
  />
));
SidebarHeader.displayName = 'SidebarHeader';

export const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex-1 overflow-auto px-4', className)}
    {...props}
  />
));
SidebarContent.displayName = 'SidebarContent';

export const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex h-14 items-center border-t px-4', className)}
    {...props}
  />
));
SidebarFooter.displayName = 'SidebarFooter';

const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col gap-4', className)} {...props} />
));
SidebarGroup.displayName = 'SidebarGroup';

const SidebarGroupContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col gap-1', className)} {...props} />
));
SidebarGroupContent.displayName = 'SidebarGroupContent';

const SidebarMenu = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col gap-1', className)} {...props} />
));
SidebarMenu.displayName = 'SidebarMenu';

const SidebarMenuItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-center w-full rounded-md p-2 hover:bg-accent cursor-pointer',
      className
    )}
    {...props}
  />
));
SidebarMenuItem.displayName = 'SidebarMenuItem';

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    isActive?: boolean;
  }
>(({ className, isActive, children, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      'flex w-full items-center gap-2 rounded-md p-2 text-sm outline-none hover:bg-muted whitespace-nowrap overflow-hidden',
      'text-left',
      isActive && 'bg-muted font-medium',
      className
    )}
    {...props}
  >
    <span className="truncate">{children}</span>
  </button>
));
SidebarMenuButton.displayName = 'SidebarMenuButton';

const SidebarMenuAction = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    showOnHover?: boolean;
  }
>(({ className, showOnHover, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      'ml-auto flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent',
      showOnHover && 'opacity-0 group-hover:opacity-100',
      className
    )}
    {...props}
  />
));
SidebarMenuAction.displayName = 'SidebarMenuAction';

export {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
}; 