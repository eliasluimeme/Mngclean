import { BellIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface HeaderProps {
  title: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 bg-background px-4 sm:px-6">
      <div className="flex flex-1 items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold md:text-xl">{title}</h1>
          {subtitle && <p className="text-xs text-muted-foreground md:text-sm">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-[200px] rounded-lg bg-muted pl-8 text-sm border-none focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>

          <Button variant="ghost" size="icon" className="rounded-full">
            <BellIcon className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>

          <Avatar className="h-8 w-8 border border-border">
            <AvatarFallback className="bg-primary/10 text-primary">JD</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}

