import { ThemeProvider } from "@/components/theme-provider"

export const metadata = {
  title: 'MngClean - Staff',
  description: 'MngCleaning',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>;
}
