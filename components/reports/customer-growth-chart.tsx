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
} from "chart.js"
import { Line } from "react-chartjs-2"
import { useTheme } from "@/components/theme-provider"

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartTooltip, Legend)

export function CustomerGrowthChart() {
  const { isDark } = useTheme()
  const [mounted, setMounted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  useEffect(() => {
    setMounted(true)

    // Function to handle resize
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth)
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
    if (containerWidth < 300) return 8
    if (containerWidth < 500) return 9
    return 10
  }

  // Chart data
  const data = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    datasets: [
      {
        label: "Residential",
        data: [45, 52, 60, 65, 72, 78, 85, 92, 98, 105, 112, 120],
        borderColor: primaryColor,
        backgroundColor: "transparent",
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointBackgroundColor: isDark ? "#2d2d2d" : "#fff",
        pointHoverBackgroundColor: primaryColor,
        pointBorderWidth: 2,
        pointHoverBorderWidth: 2,
        pointBorderColor: primaryColor,
      },
      {
        label: "Commercial",
        data: [12, 15, 18, 20, 22, 25, 28, 30, 32, 34, 36, 38],
        borderColor: secondaryColor,
        backgroundColor: "transparent",
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointBackgroundColor: isDark ? "#2d2d2d" : "#fff",
        pointHoverBackgroundColor: secondaryColor,
        pointBorderWidth: 2,
        pointHoverBorderWidth: 2,
        pointBorderColor: secondaryColor,
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
          maxTicksLimit: 5,
        },
        beginAtZero: true,
      },
    },
    animation: {
      duration: 800,
      easing: "easeOutQuart",
    },
  }

  if (!mounted) {
    return <div className="h-full w-full bg-muted/30 rounded-md animate-pulse"></div>
  }

  return (
    <div className="h-full w-full" ref={containerRef}>
      <Line data={data} options={options} />
    </div>
  )
}

