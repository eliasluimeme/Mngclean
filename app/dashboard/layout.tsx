import type React from "react"
import "@/app/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth-provider"
import { SidebarStateProvider } from "@/hooks/use-sidebar-state"

export const metadata = {
  title: 'MngClean - Dashboard',
  description: 'MngCleaning',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>;
}

