import { Card, CardContent, CardHeader } from "./card"
import { Skeleton } from "./skeleton"
import { SidebarToggle } from "@/components/chat-history/sidebar-toggle"

export function ChatLoading() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="w-[800px] max-w-[calc(100vw-2rem)] h-[calc(100vh-2rem)] mx-auto">
        <Card className="h-full flex flex-col bg-white shadow-lg">
          <CardHeader className="flex-none flex flex-row items-center justify-between bg-black text-white p-4 sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <SidebarToggle />
              <h1 className="text-xl font-semibold">Сценарный Коуч</h1>
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-4 space-y-4 overflow-y-auto min-h-0">
            <div className="flex justify-start">
              <Skeleton className="h-20 w-[85%] sm:w-[80%] rounded-2xl" />
            </div>
            <div className="flex justify-end">
              <Skeleton className="h-10 w-[70%] sm:w-[60%] rounded-2xl" />
            </div>
            <div className="flex justify-start">
              <Skeleton className="h-32 w-[85%] sm:w-[80%] rounded-2xl" />
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
} 