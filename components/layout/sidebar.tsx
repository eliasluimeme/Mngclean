"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Calendar, ClipboardList, FileText, LogOut, Menu, Moon, Sun, Users, X, Settings, FileSpreadsheet } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useTheme } from "@/components/theme-provider"
import { useAuth } from "@/components/auth-provider"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useSidebarState } from "@/hooks/use-sidebar-state"

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  roles: ('admin' | 'staff')[]
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: BarChart3,
    roles: ["admin"],
  },
  {
    title: "Bookings",
    href: "/bookings",
    icon: Calendar,
    roles: ["admin", "staff"],
  },
  {
    title: "Orders",
    href: "/orders",
    icon: ClipboardList,
    roles: ["admin", "staff"],
  },
  // {
  //   title: "Invoices",
  //   href: "/invoices",
  //   icon: FileText,
  //   roles: ["admin", "staff"],
  // },
  {
    title: "Users",
    href: "/users",
    icon: Users,
    roles: ["admin", "staff"],
  },
  {
    title: "Staff",
    href: "/staff",
    icon: Users,
    roles: ["admin"],
  },
  {
    title: "Teams",
    href: "/teams",
    icon: Users,
    roles: ["admin"],
  },
  {
    title: "Services",
    href: "/services",
    icon: FileSpreadsheet,
    roles: ["admin"],
  },
  // {
  //   title: "Reports",
  //   href: "/reports",
  //   icon: FileSpreadsheet,
  //   roles: ["admin"],
  // },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["admin", "staff"],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isCollapsed, setIsCollapsed } = useSidebarState()
  const { theme, setTheme } = useTheme()
  const { logout, user } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  // Filter navigation items based on user role
  const filteredNavItems = navItems.filter((item) => {
    if (!user) return false
    return item.roles.includes(user.role as 'admin' | 'staff')
  })

  if (!mounted) {
    return (
      <div className="hidden md:flex h-screen w-56 flex-col border-r bg-background border-border">
        <div className="flex items-center gap-2 px-4 py-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <span className="text-lg font-medium text-primary">C</span>
          </div>
          <span className="text-lg font-medium text-primary">MngClean</span>
        </div>
      </div>
    )
  }

  // Mobile sidebar using Sheet component
  const MobileSidebar = () => (
    <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden fixed top-4 left-4 z-50">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-[250px]">
        <div className="flex h-full flex-col bg-background">
          <div className="flex items-center justify-between px-4 py-6 border-b">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <span className="text-lg font-medium text-primary">C</span>
              </div>
              <span className="text-lg font-medium text-primary">MngClean</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 px-2">
            {filteredNavItems.map((item) => {
              const isActive = pathname === item.href

              return (
                <Button
                  key={item.href}
                  variant="ghost"
                  className={cn(
                    "flex h-10 w-full items-center justify-start gap-3 rounded-lg text-muted-foreground transition-all hover:bg-muted hover:text-foreground mb-1",
                    isActive && "bg-primary/10 text-primary font-medium",
                  )}
                  asChild
                >
                  <Link href={item.href}>
                    <div className="flex items-center gap-3">
                      <div className="relative flex items-center">
                        {isActive && <div className="absolute -left-3 h-5 w-1 rounded-full bg-primary" />}
                        <item.icon className="h-5 w-5" />
                      </div>
                      <span>{item.title}</span>
                    </div>
                  </Link>
                </Button>
              )
            })}
          </nav>

          <div className="mt-auto border-t p-4 space-y-2">
            <Button
              variant="ghost"
              className="flex w-full items-center justify-start gap-3 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </Button>

            <Button
              variant="ghost"
              className="flex w-full items-center justify-start gap-3 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={logout}
            >
              <LogOut className="h-5 w-5" />
              <span>Log Out</span>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )

  // Desktop sidebar
  return (
    <>
      <MobileSidebar />

      <div
        className={cn(
          "fixed h-screen hidden md:flex flex-col border-r transition-all duration-300 z-30",
          isCollapsed ? "w-[70px]" : "w-56",
          "bg-background border-border",
        )}
      >
        <div className="flex items-center gap-2 px-4 py-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <span className="text-lg font-medium text-primary">C</span>
          </div>
          {!isCollapsed && <span className="text-lg font-medium text-primary">MngClean</span>}
        </div>

        <div className="relative mt-2 px-2">
          <Button
            variant="ghost"
            size="icon"
            className="absolute -right-3 top-0 h-6 w-6 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 hover:text-primary"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? "→" : "←"}
          </Button>
        </div>

        <TooltipProvider delayDuration={0}>
          <nav className="mt-6 flex flex-1 flex-col gap-1 px-2 overflow-y-auto">
            {filteredNavItems.map((item) => {
              const isActive = pathname === item.href

              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        "flex h-10 w-full items-center justify-start gap-3 rounded-lg text-muted-foreground transition-all hover:bg-muted hover:text-foreground",
                        isActive && "bg-primary/10 text-primary font-medium",
                        isCollapsed && "justify-center",
                      )}
                      asChild
                    >
                      <Link href={item.href}>
                        <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
                          <div className="relative flex items-center">
                            {isActive && <div className="absolute -left-3 h-5 w-1 rounded-full bg-primary" />}
                            <item.icon className="h-5 w-5" />
                          </div>
                          {!isCollapsed && <span>{item.title}</span>}
                        </div>
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  {isCollapsed && <TooltipContent side="right">{item.title}</TooltipContent>}
                </Tooltip>
              )
            })}
          </nav>
        </TooltipProvider>

        <div className="mt-auto px-2 pb-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "flex w-full items-center justify-start gap-3 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground",
                    isCollapsed && "justify-center",
                  )}
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  {!isCollapsed && <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
                </Button>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right">{theme === "dark" ? "Light Mode" : "Dark Mode"}</TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="px-2 pb-6">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "flex w-full items-center justify-start gap-3 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground",
                    isCollapsed && "justify-center",
                  )}
                  onClick={logout}
                >
                  <LogOut className="h-5 w-5" />
                  {!isCollapsed && <span>Log Out</span>}
                </Button>
              </TooltipTrigger>
              {isCollapsed && <TooltipContent side="right">Log Out</TooltipContent>}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </>
  )
}

