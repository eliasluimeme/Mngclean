"use client"

import { useState, useEffect } from "react"
import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend } from "chart.js"
import { Doughnut } from "react-chartjs-2"
import { useTheme } from "@/components/theme-provider"
import { ScrollArea } from "@/components/ui/scroll-area"

// Register ChartJS components
ChartJS.register(ArcElement, ChartTooltip, Legend)

interface Category {
  name: string
  percentage: number
  color: string
  darkColor?: string
}

interface ActivityOverviewProps {
  total: number
  categories: Category[]
}

export function ActivityOverview({ total, categories }: ActivityOverviewProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [chartSize, setChartSize] = useState({ width: 0, height: 0 })
  const [containerWidth, setContainerWidth] = useState(0)

  useEffect(() => {
    setMounted(true)

    // Function to handle resize
    const handleResize = () => {
      const width = window.innerWidth

      // Adjust chart size based on screen width
      if (width < 640) {
        // Mobile
        setChartSize({ width: width * 0.7, height: 160 })
        setContainerWidth(width - 40) // Accounting for padding
      } else {
        // Tablet and above
        setChartSize({ width: 160, height: 160 })
        setContainerWidth(width)
      }
    }

    // Initial size
    handleResize()

    // Add resize listener
    window.addEventListener("resize", handleResize)

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  const isDark = mounted && theme === "dark"

  // Doughnut chart data
  const doughnutChartData = {
    labels: categories.map((cat) => cat.name),
    datasets: [
      {
        data: categories.map((cat) => cat.percentage),
        backgroundColor: categories.map((cat) => (isDark ? cat.darkColor || cat.color : cat.color)),
        borderColor: "transparent",
        borderWidth: 0,
        hoverOffset: 5,
      },
    ],
  }

  // Responsive font sizes based on container width
  const getFontSize = () => {
    if (containerWidth < 300) return 9
    if (containerWidth < 500) return 10
    return 12
  }

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "75%",
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: isDark ? "rgba(30, 30, 30, 0.8)" : "rgba(255, 255, 255, 0.8)",
        padding: 10,
        cornerRadius: 4,
        displayColors: false,
        titleColor: isDark ? "#fff" : "#000",
        bodyColor: isDark ? "#fff" : "#000",
        titleFont: {
          size: getFontSize(),
          weight: 'bold' as const,
        },
        bodyFont: {
          size: getFontSize(),
        },
      },
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 800,
      easing: "easeOutQuart" as const,
    },
  }

  if (!mounted) {
    return (
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-md h-[300px]">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-medium">Activity Overview</CardTitle>
            <p className="text-xs text-muted-foreground">Category with high subscriptions rate.</p>
          </div>
          <div className="w-8 h-8 rounded-md bg-muted/50 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="h-[220px] w-full bg-muted/30 rounded-md animate-pulse"></div>
          <div className="mt-6 space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="w-24 h-4 bg-muted/50 rounded animate-pulse"></div>
                <div className="w-8 h-4 bg-muted/50 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-md h-auto sm:h-[360px]">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-medium">Activity Overview</CardTitle>
          <p className="text-xs text-muted-foreground">Category with high subscriptions rate.</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between">
          <div className="relative" style={{ width: chartSize.width, height: chartSize.height }}>
            <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{total.toLocaleString()}</p>
            </div>
          </div>

          <ScrollArea className="mt-4 sm:mt-0 h-[100px] sm:h-[160px] w-full sm:w-[calc(100%-180px)]">
            <div className="space-y-2 pr-4">
              {categories.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: isDark ? category.darkColor || category.color : category.color }}
                    ></div>
                    <p className="text-xs">{category.name}</p>
                  </div>
                  <p className="text-xs font-medium">{category.percentage}%</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
}

