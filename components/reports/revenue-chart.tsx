"use client"

import { useState, useEffect, useRef } from "react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip as ChartTooltip,
  Legend,
  BarElement,
} from "chart.js"
import { Bar } from "react-chartjs-2"
import { useTheme } from "@/components/theme-provider"

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ChartTooltip, Legend)

export function RevenueChart() {
  const { isDark } = useTheme()
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

  // Colors based on theme - improved for dark mode visibility
  const primaryColor = isDark ? "rgb(167, 139, 250)" : "rgb(124, 58, 237)" // Lighter purple in dark mode
  const secondaryColor = isDark ? "rgba(186, 156, 245, 0.9)" : "rgba(109, 40, 217, 0.8)" // Brighter secondary color
  const gridColor = isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)" // Increased opacity for dark mode

  // Responsive font sizes based on container width
  const getFontSize = () => {
    if (chartWidth < 300) return 8
    if (chartWidth < 500) return 9
    return 10
  }

  // Chart data
  const data = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    datasets: [
      {
        label: "Revenue",
        data: [12500, 15900, 14500, 18200, 19800, 22400, 21100, 23800, 25300, 26600, 28000, 29500],
        backgroundColor: primaryColor,
        borderColor: primaryColor,
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: "Expenses",
        data: [8200, 9100, 8500, 10200, 11800, 12400, 11100, 13800, 14300, 15600, 16000, 17500],
        backgroundColor: secondaryColor,
        borderColor: secondaryColor,
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }

  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        align: "end" as const,
        labels: {
          boxWidth: 8,
          usePointStyle: true,
          pointStyle: "circle",
          color: isDark ? "#FFFFFF" : "rgba(0, 0, 0, 0.7)",
          font: {
            size: getFontSize(),
            weight: isDark ? "600" : "400",
          },
          padding: 10,
        },
      },
      tooltip: {
        backgroundColor: isDark ? "rgba(45, 45, 45, 0.95)" : "rgba(255, 255, 255, 0.95)",
        padding: 8,
        cornerRadius: 4,
        titleColor: isDark ? "#FFFFFF" : "#000",
        bodyColor: isDark ? "#FFFFFF" : "#000",
        titleFont: {
          size: getFontSize() + 1,
          weight: "bold",
        },
        bodyFont: {
          size: getFontSize(),
        },
        callbacks: {
          label: (context: any) => `$${context.parsed.y.toLocaleString()}`,
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
          color: isDark ? "#FFFFFF" : "rgba(0, 0, 0, 0.7)",
          font: {
            size: getFontSize(),
            weight: isDark ? "600" : "400",
          },
        },
      },
      y: {
        grid: {
          color: gridColor,
          drawBorder: false,
          lineWidth: isDark ? 0.8 : 1,
        },
        ticks: {
          color: isDark ? "#FFFFFF" : "rgba(0, 0, 0, 0.7)",
          padding: 8,
          font: {
            size: getFontSize(),
            weight: isDark ? "600" : "400",
          },
          callback: (value: any) => "$" + value,
          maxTicksLimit: 5,
        },
        beginAtZero: true,
      },
    },
    animation: {
      duration: 800,
      easing: "easeOutQuart",
    },
    barPercentage: 0.7,
    categoryPercentage: 0.7,
  }

  if (!mounted) {
    return <div className="h-full w-full bg-muted/30 rounded-md animate-pulse"></div>
  }

  return (
    <div className="h-full w-full" ref={containerRef}>
      <Bar data={data} options={options} />
    </div>
  )
}

