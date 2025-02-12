import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/chat-history/app-sidebar';
import { TooltipProvider } from "@/components/ui/tooltip"

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'Сценарный Коуч',
  description: 'Сценарный коуч приложение',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <TooltipProvider>
          <SidebarProvider>
            <div className="relative min-h-screen">
              <AppSidebar />
              <div className="flex justify-center">
                <main className="w-full max-w-3xl">
                  {children}
                </main>
              </div>
            </div>
          </SidebarProvider>
        </TooltipProvider>
      </body>
    </html>
  )
}