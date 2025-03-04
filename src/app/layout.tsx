import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/chat-history/app-sidebar';
import { TooltipProvider } from "@/components/ui/tooltip"

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'Scriptantino',
  description: 'Scriptantino',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className={`${inter.className} min-h-screen`}>
        <TooltipProvider>
          <SidebarProvider>
            <AppSidebar />
            <main className="min-h-screen overflow-hidden">
              {children}
            </main>
          </SidebarProvider>
        </TooltipProvider>
      </body>
    </html>
  )
}