import { ArrowDown, ArrowUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface ReportSummaryCardProps {
  title: string
  value: string
  change: string
  trend: "up" | "down" | "neutral"
  period: string
}

export function ReportSummaryCard({ title, value, change, trend, period }: ReportSummaryCardProps) {
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
      <CardHeader className="pb-1 pt-3">
        <CardTitle className="text-xs font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="text-lg font-bold">{value}</div>
        <div className="mt-1 flex items-center text-xs">
          <span
            className={cn(
              "flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium",
              trend === "up" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
              trend === "down" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
              trend === "neutral" && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
            )}
          >
            {trend === "up" && <ArrowUp className="mr-1 h-3 w-3" />}
            {trend === "down" && <ArrowDown className="mr-1 h-3 w-3" />}
            {change}
          </span>
          <span className="ml-2 text-muted-foreground">{period}</span>
        </div>
      </CardContent>
    </Card>
  )
}

