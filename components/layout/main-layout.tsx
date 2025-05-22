import type { ReactNode } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { useSidebarState } from "@/hooks/use-sidebar-state"
import { cn } from "@/lib/utils"

interface MainLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
}

export function MainLayout({ children, title, subtitle }: MainLayoutProps) {
  const { isCollapsed } = useSidebarState()
  
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className={cn(
        "flex flex-1 flex-col w-full transition-[margin] duration-300",
        isCollapsed ? "md:ml-[70px]" : "md:ml-[224px]"
      )}>
        <Header title={title} subtitle={subtitle} />
        <main className="flex-1 overflow-auto p-3 sm:p-6">{children}</main>
      </div>
    </div>
  )
}

