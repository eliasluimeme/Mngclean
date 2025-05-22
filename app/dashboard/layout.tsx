import type React from "react"
import "@/app/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth-provider"
import { SidebarStateProvider } from "@/hooks/use-sidebar-state"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <SidebarStateProvider>
              {children}
            </SidebarStateProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

