"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler } from "chart.js"
import { Line } from "react-chartjs-2"
import { useTheme } from "next-themes"

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

export function ExpensesChart() {
  const [activeTab, setActiveTab] = useState("monthly")
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const chartRef = useRef(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [chartWidth, setChartWidth] = useState(0)

  useEffect(() => {
    setMounted(true)

    // Function to handle resize
    const handleResize = () => {
      if (containerRef.current) {
        setChartWidth(containerRef.current.offsetWidth)
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

  // Colors based on theme - improved for dark mode visibility
  const primaryColor = isDark ? "rgb(167, 139, 250)" : "rgb(124, 58, 237)" // Lighter purple in dark mode
  const gradientTopColor = isDark ? "rgba(167, 139, 250, 0.3)" : "rgba(124, 58, 237, 0.3)"
  const gradientBottomColor = isDark ? "rgba(167, 139, 250, 0.02)" : "rgba(124, 58, 237, 0.02)"
  const gridColor = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)" // Increased opacity for dark mode
  const textColor = isDark ? "rgba(255, 255, 255, 0.85)" : "rgba(0, 0, 0, 0.7)" // Increased contrast for better visibility

  // Chart data
  const monthlyData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    datasets: [
      {
        label: "Expenses",
        data: [1200, 900, 1500, 2200, 1800, 2400, 2100, 1800, 2300, 2600, 3000, 3500],
        borderColor: primaryColor,
        backgroundColor: (context) => {
          const chart = context.chart
          const { ctx, chartArea } = chart
          if (!chartArea) return null

          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
          gradient.addColorStop(0, gradientTopColor)
          gradient.addColorStop(1, gradientBottomColor)
          return gradient
        },
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointBackgroundColor: isDark ? "#2d2d2d" : "#fff", // Darker point background in dark mode
        pointHoverBackgroundColor: primaryColor,
        pointBorderWidth: 2,
        pointHoverBorderWidth: 2,
        pointBorderColor: primaryColor,
      },
    ],
  }

  const yearlyData = {
    labels: ["2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025"],
    datasets: [
      {
        label: "Expenses",
        data: [15000, 22000, 18500, 25000, 32000, 38000, 45000, 52000],
        borderColor: primaryColor,
        backgroundColor: (context) => {
          const chart = context.chart
          const { ctx, chartArea } = chart
          if (!chartArea) return null

          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
          gradient.addColorStop(0, gradientTopColor)
          gradient.addColorStop(1, gradientBottomColor)
          return gradient
        },
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointBackgroundColor: isDark ? "#2d2d2d" : "#fff", // Darker point background in dark mode
        pointHoverBackgroundColor: primaryColor,
        pointBorderWidth: 2,
        pointHoverBorderWidth: 2,
        pointBorderColor: primaryColor,
      },
    ],
  }

  // Responsive font sizes based on container width
  const getFontSize = () => {
    if (chartWidth < 300) return 9
    if (chartWidth < 500) return 10
    return 11
  }

  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: isDark ? "rgba(45, 45, 45, 0.9)" : "rgba(255, 255, 255, 0.9)", // Darker background in dark mode
        titleColor: isDark ? "rgba(255, 255, 255, 0.95)" : "#000", // Brighter title in dark mode
        bodyColor: isDark ? "rgba(255, 255, 255, 0.9)" : "#000", // Brighter body text in dark mode
        padding: 12,
        cornerRadius: 4,
        displayColors: false,
        titleFont: {
          size: getFontSize() + 2,
          weight: "bold",
        },
        bodyFont: {
          size: getFontSize() + 1,
        },
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || ""
            if (label) {
              label += ": "
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(context.parsed.y)
            }
            return label
          },
          afterLabel: (context) => {
            const dataIndex = context.dataIndex
            const dataset = context.dataset
            if (dataIndex > 0) {
              const currentValue = dataset.data[dataIndex]
              const previousValue = dataset.data[dataIndex - 1]
              const percentChange = (((currentValue - previousValue) / previousValue) * 100).toFixed(1)
              const changeText = `Change: ${percentChange}%`
              return changeText
            }
            return ""
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: textColor,
          font: {
            size: getFontSize(),
            weight: isDark ? "500" : "400", // Slightly bolder in dark mode
          },
          maxRotation: 0,
          padding: 10,
        },
        border: {
          display: false,
        },
      },
      y: {
        grid: {
          color: gridColor,
          drawBorder: false,
          lineWidth: isDark ? 0.8 : 1, // Slightly thinner lines in dark mode
          drawTicks: false,
        },
        ticks: {
          color: textColor,
          padding: 10,
          font: {
            size: getFontSize(),
            weight: isDark ? "500" : "400", // Slightly bolder in dark mode
          },
          callback: (value) => "$" + value,
          maxTicksLimit: 5,
        },
        border: {
          display: false,
        },
        min: 0,
        suggestedMax: activeTab === "monthly" ? 4000 : 60000,
      },
    },
    elements: {
      line: {
        borderWidth: 2.5, // Slightly thicker line for better visibility
      },
    },
    animation: {
      duration: 800,
    },
  }

  if (!mounted) {
    return (
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-md h-[360px]">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-medium">Expenses Tracker</CardTitle>
            <p className="text-xs text-muted-foreground">Track your monthly and annual expenses.</p>
          </div>
          <div className="w-full sm:w-[160px] h-10 bg-muted/50 rounded-md animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full bg-muted/30 rounded-md animate-pulse"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-md h-auto sm:h-[360px]">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base font-medium">Expenses Tracker</CardTitle>
          <p className="text-xs text-muted-foreground">Track your monthly and annual expenses.</p>
        </div>
        <Tabs defaultValue="monthly" className="w-full sm:w-[160px] mt-2 sm:mt-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="monthly" onClick={() => setActiveTab("monthly")}>
              Monthly
            </TabsTrigger>
            <TabsTrigger value="yearly" onClick={() => setActiveTab("yearly")}>
              Yearly
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full" ref={containerRef}>
          <Line ref={chartRef} data={activeTab === "monthly" ? monthlyData : yearlyData} options={options} />
        </div>
        <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="text-xl font-bold">{activeTab === "monthly" ? "$2,200" : "$52,000"}</div>
            <div className="rounded-full bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/50 dark:text-green-300">
              +10.4%
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-1 sm:mt-0">
            {activeTab === "monthly" ? "vs last month" : "vs last year"}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

