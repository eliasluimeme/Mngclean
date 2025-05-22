import type { ReactNode } from "react"
import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  title: string
  value: string | number
  indicator?: {
    value: string | number
    label: string
    trend?: "up" | "down" | "neutral"
  }
  icon?: ReactNode
  className?: string
}

export function StatsCard({ title, value, indicator, icon, className }: StatsCardProps) {
  return (
    <Card
      className={cn("overflow-hidden transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]", className)}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-sm font-medium text-muted-foreground">
          {title}
          <Button variant="ghost" size="icon" className="ml-auto h-4 w-4 text-muted-foreground hover:text-foreground">
            <Settings className="h-3 w-3" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          {icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
          )}
          <div>
            <div className="text-3xl font-bold text-foreground">{value}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

