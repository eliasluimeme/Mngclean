"use client"

import { useState, useEffect, useRef } from "react"
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend } from "chart.js"
import { Doughnut } from "react-chartjs-2"
import { useTheme } from "@/components/theme-provider"

// Register ChartJS components
ChartJS.register(ArcElement, ChartTooltip, Legend)

export function ServiceTypeChart() {
  const { isDark } = useTheme()
  const [mounted, setMounted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    setMounted(true)

    // Function to handle resize
    const handleResize = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth
        const height = width < 500 ? 240 : 240 // Fixed height for consistency
        setContainerSize({ width, height })
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
  const colors = isDark
    ? ["rgba(167, 139, 250, 0.9)", "rgba(186, 156, 245, 0.9)", "rgba(224, 209, 255, 0.9)", "rgba(147, 112, 219, 0.9)"]
    : ["rgba(124, 58, 237, 0.8)", "rgba(139, 92, 246, 0.8)", "rgba(167, 139, 250, 0.8)", "rgba(109, 40, 217, 0.8)"]

  // Chart data
  const data = {
    labels: ["Residential", "Commercial", "Deep Cleaning", "Maintenance"],
    datasets: [
      {
        data: [40, 30, 15, 15],
        backgroundColor: colors,
        borderColor: "transparent",
        borderWidth: 0,
        hoverOffset: 5,
      },
    ],
  }

  // Responsive font sizes based on container width
  const getFontSize = () => {
    if (containerSize.width < 300) return 8
    if (containerSize.width < 500) return 9
    return 10
  }

  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "65%",
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          color: isDark ? "#FFFFFF" : "rgba(0, 0, 0, 0.7)",
          padding: 10,
          font: {
            size: getFontSize(),
            weight: isDark ? "600" : "400",
          },
          boxWidth: 8,
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      tooltip: {
        backgroundColor: isDark ? "rgba(45, 45, 45, 0.95)" : "rgba(255, 255, 255, 0.95)",
        padding: 8,
        cornerRadius: 4,
        displayColors: true,
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
          label: (context: any) => `${context.label}: ${context.parsed}%`,
        },
      },
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 800,
      easing: "easeOutQuart",
    },
  }

  if (!mounted) {
    return <div className="h-full w-full bg-muted/30 rounded-md animate-pulse"></div>
  }

  return (
    <div ref={containerRef} style={{ height: containerSize.height }} className="w-full">
      <Doughnut data={data} options={options} />
    </div>
  )
}

