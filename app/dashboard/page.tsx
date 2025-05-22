"use client"

import { useState, useEffect } from "react"
import { BarChart3, Calendar, CheckCircle2, DollarSign, FileText, Maximize2, Users, XCircle } from "lucide-react"
import { MainLayout } from "@/components/layout/main-layout"
import { StatsCard } from "@/components/dashboard/stats-card"
import { ExpensesChart } from "@/components/dashboard/expenses-chart"
import { QuickAction } from "@/components/dashboard/quick-action"
import { ActivityOverview } from "@/components/dashboard/activity-overview"
import { SubscriptionList } from "@/components/dashboard/subscription-list"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { addDays, format, isAfter, isBefore, isEqual } from "date-fns"


const activityCategories = [
  {
    name: "Grand Menage",
    percentage: 20,
    color: "rgba(124, 58, 237, 0.8)",
    darkColor: "rgba(147, 112, 219, 0.8)",
  },
  {
    name: "Menage Regulier",
    percentage: 20,
    color: "rgba(139, 92, 246, 0.8)",
    darkColor: "rgba(186, 156, 245, 0.8)",
  },
  {
    name: "Menage Residentiel",
    percentage: 20,
    color: "rgba(167, 139, 250, 0.8)",
    darkColor: "rgba(224, 209, 255, 0.8)",
  },
  {
    name: "Tapis",
    percentage: 20,
    color: "rgba(109, 40, 217, 0.8)",
    darkColor: "rgba(116, 90, 173, 0.8)",
  },
]

// Helper to format date as YYYY/MM/DD from ISO string
function formatUtcDate(dateStr: string) {
  if (!dateStr) return '-';
  const [year, month, day] = dateStr.slice(0, 10).split('-');
  return `${month}/${day}/${year}`;
}

// Helper to get start/end of month
function getMonthRange(date: Date) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999));
  return { start, end };
}

// Helper to check if a date is in a range
function isInRange(dateStr: string, start: Date, end: Date) {
  const d = new Date(dateStr);
  return d >= start && d <= end;
}

// Helper: Get all days in a month as YYYY-MM-DD strings (UTC)
function getDaysInMonth(year: number, month: number) {
  const days = [];
  const date = new Date(Date.UTC(year, month, 1));
  while (date.getUTCMonth() === month) {
    days.push(date.toISOString().slice(0, 10));
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return days;
}

// Helper: Get all days between two dates (inclusive, UTC)
function getDaysBetween(start: Date, end: Date) {
  const days = [];
  let date = new Date(start);
  while (date <= end) {
    days.push(date.toISOString().slice(0, 10));
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return days;
}

// Prepare chart data for AreaChart
const chartConfig = {
  orders: {
    label: "Orders",
    theme: {
      light: "hsl(var(--primary))",
      dark: "hsl(var(--primary))", // You can use a different variable if you want a different color in dark mode
    },
  },
} satisfies ChartConfig

function OrdersAreaChart({ chartDays, dailyCounts }: { chartDays: string[]; dailyCounts: number[] }) {
  const chartData = chartDays.map((day, idx) => ({
    date: day,
    orders: dailyCounts[idx] ?? 0,
  }))
  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="fillOrders" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-orders)" stopOpacity={0.8} />
            <stop offset="95%" stopColor="var(--color-orders)" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={32}
          tickFormatter={(value) => {
            const date = new Date(value)
            return date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          }}
        />
        {/* <YAxis domain={[0, 'auto']} tickLine={false} axisLine={false} /> */}
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(value) => {
                return new Date(value).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
              indicator="dot"
            />
          }
        />
        <Area
          dataKey="orders"
          type="monotone"
          fill="url(#fillOrders)"
          stroke="var(--color-orders)"
        />
        {/* <ChartLegend content={<ChartLegendContent />} /> */}
      </AreaChart>
    </ChartContainer>
  )
}

export default function Home() {
  const { isLoading } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [quickActionItems, setQuickActionItems] = useState([])
  const [loadingQuickActions, setLoadingQuickActions] = useState(true)
  const [subscriptions, setSubscriptions] = useState([])
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(true)
  // Orders stats card state
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  // Multi-month picker state
  const [selectedMonths, setSelectedMonths] = useState([
    { year: new Date().getFullYear(), month: new Date().getMonth() } // Default: current month
  ]);
  // --- Enhancement: Filtering state ---
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [timeRange, setTimeRange] = React.useState("30d"); // "7d", "30d", "90d", "custom"
  const [customRange, setCustomRange] = React.useState<{ start: Date, end: Date } | null>(null);

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    async function fetchUpcomingOrders() {
      setLoadingQuickActions(true)
      try {
        const res = await fetch('/api/orders/upcoming')
        if (!res.ok) throw new Error('Failed to fetch upcoming orders')
        const data = await res.json()
        // Map API data to ActionItem format
        const items = (data || []).map((order: any) => {
          // Find the next visit in the future or today
          const now = new Date()
          let nextVisit = null
          if (Array.isArray(order.visit_services_detailed)) {
            nextVisit = order.visit_services_detailed.find((visit: any) => {
              if (!visit.date || visit.completed) return false
              const visitDateStr = visit.date.slice(0, 10)
              const todayStr = now.getFullYear() + '-' +
                String(now.getMonth() + 1).padStart(2, '0') + '-' +
                String(now.getDate()).padStart(2, '0');
              return visitDateStr >= todayStr
            })
          }
          // Calculate dueIn (days until next visit)
          let dueIn = 0
          let dueDate = ''
          if (nextVisit && nextVisit.date) {
            const diff = (new Date(nextVisit.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            dueIn = Math.ceil(diff)
            dueDate = formatUtcDate(nextVisit.date)
          }
          return {
            name: order.service_title || 'Cleaning Service',
            company: order.client || '',
            logo: '/placeholder.svg?height=40&width=40',
            dueIn,
            dueDate,
            email: order.email || '',
            phone: order.phone || '',
            address: order.property || '',
            orderDetails: order.notes || '',
            amount: order.price ? `$${order.price}` : '',
            visit_services_detailed: order.visit_services_detailed || [],
          }
        })
        setQuickActionItems(items)
      } catch (err) {
        setQuickActionItems([])
      }
      setLoadingQuickActions(false)
    }
    fetchUpcomingOrders()
  }, [])

  useEffect(() => {
    async function fetchAllOrders() {
      setLoadingSubscriptions(true)
      try {
        const res = await fetch('/api/orders')
        if (!res.ok) throw new Error('Failed to fetch orders')
        const data = await res.json()
        // Map API data to Subscription type
        const items = (data || []).map((order: any) => {
          // Find the next due date (first date in order.dates or today)
          let dueDate = ''
          if (Array.isArray(order.dates) && order.dates.length > 0) {
            dueDate = formatUtcDate(order.dates[0])
          } else if (order.date) {
            dueDate = formatUtcDate(order.date)
          }
          // Use the real status string
          const status = order.status || ''
          // Compose Subscription object
          return {
            id: order.id,
            name: order.service_title || 'Cleaning Service',
            company: order.client || '',
            logo: '/placeholder.svg?height=40&width=40',
            amount: order.price ? `${order.price} Dhs` : '',
            dueDate: dueDate,
            status: status,
            email: order.email || '',
            phone: order.phone || '',
            address: order.property || '',
            orderDetails: order.notes || '',
            frequency: order.frequency || '',
            visit_services_detailed: order.visit_services_detailed || [],
          }
        })
        setSubscriptions(items)
      } catch (err) {
        setSubscriptions([])
      }
      setLoadingSubscriptions(false)
    }
    fetchAllOrders()
  }, [])

  useEffect(() => {
    async function fetchOrders() {
      setOrdersLoading(true);
      try {
        const res = await fetch('/api/orders');
        if (!res.ok) throw new Error('Failed to fetch orders');
        const data = await res.json();
        setOrders(data || []);
      } catch {
        setOrders([]);
      }
      setOrdersLoading(false);
    }
    fetchOrders();
  }, []);

  // --- Enhancement: Filter orders before calculations ---
  const filteredOrders = orders.filter((order) => {
    // Search by client or service title
    // const matchesSearch =
    //   (order.client?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    //     order.service_title?.toLowerCase().includes(searchQuery.toLowerCase()));
    // Status filter
    const status = (order.status || '').toLowerCase();
    const statusMatch = statusFilter === 'all' || status === statusFilter;
    return statusMatch;
  });

  // Calculate stats for selected months using filteredOrders
  // Build a list of all days in all selected months
  let chartDays: string[] = [];
  selectedMonths.forEach(({ year, month }) => {
    chartDays = chartDays.concat(getDaysInMonth(year, month));
  });
  chartDays = Array.from(new Set(chartDays)).sort();
  const chartLabel = selectedMonths.length === 1
    ? `Orders per day (${selectedMonths[0].year}-${String(selectedMonths[0].month + 1).padStart(2, '0')})`
    : `Orders per day (multiple months)`;

  // For stats: count orders in selected months
  const ordersInSelectedMonths = filteredOrders.filter(o => {
    if (!o.created_at) return false;
    const orderDate = new Date(o.created_at);
    return selectedMonths.some(({ year, month }) =>
      orderDate.getUTCFullYear() === year && orderDate.getUTCMonth() === month
    );
  });
  const displayedCount = ordersInSelectedMonths.length;

  // Growth: compare to previous period (previous month for each selected month)
  let growth = 0;
  let growthLabel = '';
  if (selectedMonths.length === 1) {
    const { year, month } = selectedMonths[0];
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const prevMonthCount = filteredOrders.filter(o => {
      if (!o.created_at) return false;
      const orderDate = new Date(o.created_at);
      return orderDate.getUTCFullYear() === prevYear && orderDate.getUTCMonth() === prevMonth;
    }).length;
    growth = prevMonthCount === 0 ? 100 : ((displayedCount - prevMonthCount) / prevMonthCount) * 100;
    growthLabel = growth >= 0 ? `+${growth.toFixed(1)}%` : `${growth.toFixed(1)}%`;
  } else {
    growthLabel = '';
  }

  // Build daily order counts array
  const dailyCounts = chartDays.map(day =>
    filteredOrders.filter(o => {
      if (!o.created_at) return false;
      // Always compare as UTC date string
      const orderDay = new Date(o.created_at).toISOString().slice(0, 10);
      return orderDay === day;
    }).length
  );

  // --- Filter chartDays and dailyCounts based on timeRange ---
  let filteredChartDays = chartDays;
  let filteredDailyCounts = dailyCounts;

  if (timeRange !== "custom") {
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days + 1);
    filteredChartDays = chartDays.filter(day => {
      const d = new Date(day);
      return d >= startDate && d <= endDate;
    });
    filteredDailyCounts = filteredChartDays.map(day =>
      dailyCounts[chartDays.indexOf(day)] ?? 0
    );
  } else if (customRange) {
    filteredChartDays = chartDays.filter(day => {
      const d = new Date(day);
      return (isAfter(d, customRange.start) || isEqual(d, customRange.start)) &&
             (isBefore(d, customRange.end) || isEqual(d, customRange.end));
    });
    filteredDailyCounts = filteredChartDays.map(day =>
      dailyCounts[chartDays.indexOf(day)] ?? 0
    );
  }

  // Get all orders in the selected time range
  const ordersInRange = filteredOrders.filter(order => {
    if (!order.created_at) return false;
    const orderDay = new Date(order.created_at).toISOString().slice(0, 10);
    return filteredChartDays.includes(orderDay);
  });

  // Compute metrics
  const totalOrders = ordersInRange.length;
  const completedOrders = ordersInRange.filter(o => (o.status || '').toLowerCase() === 'completed').length;
  const cancelledOrders = ordersInRange.filter(o => (o.status || '').toLowerCase() === 'cancelled').length;
  // Revenue: sum of total_price (fallback to price if missing)
  const revenue = ordersInRange.reduce((sum, o) => {
    let val = 0;
    if (typeof o.total_price === 'number') val = o.total_price;
    else if (typeof o.total_price === 'string') val = parseFloat(o.total_price) || 0;
    else if (typeof o.price === 'number') val = o.price;
    else if (typeof o.price === 'string') val = parseFloat(o.price) || 0;
    return sum + val;
  }, 0);

  // --- Calculate previous period for change% and sparkline ---
  function getPreviousPeriod(days: string[]) {
    if (!days.length) return [];
    const first = new Date(days[0]);
    const last = new Date(days[days.length - 1]);
    const diff = (last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24) + 1;
    const prevEnd = new Date(first);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - diff + 1);
    return getDaysBetween(prevStart, prevEnd);
  }

  const prevChartDays = getPreviousPeriod(filteredChartDays);

  // Helper: get orders in a set of days
  function getOrdersInDays(days: string[]) {
    return filteredOrders.filter(order => {
      if (!order.created_at) return false;
      const orderDay = new Date(order.created_at).toISOString().slice(0, 10);
      return days.includes(orderDay);
    });
  }

  // Helper: get daily metric array for a set of days
  function getDailyMetric(days: string[], fn: (orders: any[]) => number) {
    return days.map(day => {
      const ordersForDay = getOrdersInDays([day]);
      return fn(ordersForDay);
    });
  }

  // --- Metric: Total Orders ---
  const totalOrdersSpark = filteredChartDays.map(day => getOrdersInDays([day]).length);
  const prevTotalOrders = getOrdersInDays(prevChartDays).length;
  const totalOrdersChange = prevTotalOrders === 0 ? 100 : ((totalOrders - prevTotalOrders) / prevTotalOrders) * 100;
  const totalOrdersIsPositive = totalOrdersChange >= 0;
  const totalOrdersChangeLabel = `${totalOrdersChange >= 0 ? '+' : ''}${totalOrdersChange.toFixed(1)}%`;

  // --- Metric: Completed ---
  const completedOrdersSpark = filteredChartDays.map(day => getOrdersInDays([day]).filter(o => (o.status || '').toLowerCase() === 'completed').length);
  const prevCompletedOrders = getOrdersInDays(prevChartDays).filter(o => (o.status || '').toLowerCase() === 'completed').length;
  const completedOrdersChange = prevCompletedOrders === 0 ? 100 : ((completedOrders - prevCompletedOrders) / prevCompletedOrders) * 100;
  const completedOrdersIsPositive = completedOrdersChange >= 0;
  const completedOrdersChangeLabel = `${completedOrdersChange >= 0 ? '+' : ''}${completedOrdersChange.toFixed(1)}%`;

  // --- Metric: Cancelled ---
  const cancelledOrdersSpark = filteredChartDays.map(day => getOrdersInDays([day]).filter(o => (o.status || '').toLowerCase() === 'cancelled').length);
  const prevCancelledOrders = getOrdersInDays(prevChartDays).filter(o => (o.status || '').toLowerCase() === 'cancelled').length;
  const cancelledOrdersChange = prevCancelledOrders === 0 ? 0 : ((cancelledOrders - prevCancelledOrders) / prevCancelledOrders) * 100;
  const cancelledOrdersIsPositive = cancelledOrdersChange <= 0; // Down is good
  const cancelledOrdersChangeLabel = `${cancelledOrdersChange <= 0 ? '' : '+'}${cancelledOrdersChange.toFixed(1)}%`;

  // --- Metric: Revenue ---
  const revenueSpark = filteredChartDays.map(day => {
    const ordersForDay = getOrdersInDays([day]);
    return ordersForDay.reduce((sum, o) => {
      let val = 0;
      if (typeof o.total_price === 'number') val = o.total_price;
      else if (typeof o.total_price === 'string') val = parseFloat(o.total_price) || 0;
      else if (typeof o.price === 'number') val = o.price;
      else if (typeof o.price === 'string') val = parseFloat(o.price) || 0;
      return sum + val;
    }, 0);
  });
  const prevRevenue = getOrdersInDays(prevChartDays).reduce((sum, o) => {
    let val = 0;
    if (typeof o.total_price === 'number') val = o.total_price;
    else if (typeof o.total_price === 'string') val = parseFloat(o.total_price) || 0;
    else if (typeof o.price === 'number') val = o.price;
    else if (typeof o.price === 'string') val = parseFloat(o.price) || 0;
    return sum + val;
  }, 0);
  const revenueChange = prevRevenue === 0 ? 100 : ((revenue - prevRevenue) / prevRevenue) * 100;
  const revenueIsPositive = revenueChange >= 0;
  const revenueChangeLabel = `${revenueChange >= 0 ? '+' : ''}${revenueChange.toFixed(1)}%`;

  // --- Monthly Metrics for StatsCard ---
  // Get current and previous month (UTC)
  const now = new Date();
  const currentMonthYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth();
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevMonthYear = currentMonth === 0 ? currentMonthYear - 1 : currentMonthYear;

  // Get all days in current and previous month
  const currentMonthDays = getDaysInMonth(currentMonthYear, currentMonth);
  const prevMonthDays = getDaysInMonth(prevMonthYear, prevMonth);

  // Get orders in current and previous month
  const ordersCurrentMonth = filteredOrders.filter(o => {
    if (!o.created_at) return false;
    const d = new Date(o.created_at);
    return d.getUTCFullYear() === currentMonthYear && d.getUTCMonth() === currentMonth;
  });
  const ordersPrevMonth = filteredOrders.filter(o => {
    if (!o.created_at) return false;
    const d = new Date(o.created_at);
    return d.getUTCFullYear() === prevMonthYear && d.getUTCMonth() === prevMonth;
  });

  // Monthly Orders
  const monthlyOrders = ordersCurrentMonth.length;
  const prevMonthlyOrders = ordersPrevMonth.length;
  const monthlyOrdersChange = prevMonthlyOrders === 0 ? 100 : ((monthlyOrders - prevMonthlyOrders) / prevMonthlyOrders) * 100;
  const monthlyOrdersTrend = monthlyOrdersChange > 0 ? 'up' : monthlyOrdersChange < 0 ? 'down' : 'neutral';
  const monthlyOrdersLabel = monthlyOrdersTrend === 'up' ? 'More than last month' : monthlyOrdersTrend === 'down' ? 'Less than last month' : 'Same as last month';

  // Monthly Completed
  const monthlyCompleted = ordersCurrentMonth.filter(o => (o.status || '').toLowerCase() === 'completed').length;
  const prevMonthlyCompleted = ordersPrevMonth.filter(o => (o.status || '').toLowerCase() === 'completed').length;
  const monthlyCompletedChange = prevMonthlyCompleted === 0 ? 100 : ((monthlyCompleted - prevMonthlyCompleted) / prevMonthlyCompleted) * 100;
  const monthlyCompletedTrend = monthlyCompletedChange > 0 ? 'up' : monthlyCompletedChange < 0 ? 'down' : 'neutral';
  const monthlyCompletedLabel = monthlyCompletedTrend === 'up' ? 'More than last month' : monthlyCompletedTrend === 'down' ? 'Less than last month' : 'Same as last month';

  // Monthly Cancelled
  const monthlyCancelled = ordersCurrentMonth.filter(o => (o.status || '').toLowerCase() === 'cancelled').length;
  const prevMonthlyCancelled = ordersPrevMonth.filter(o => (o.status || '').toLowerCase() === 'cancelled').length;
  const monthlyCancelledChange = prevMonthlyCancelled === 0 ? 0 : ((monthlyCancelled - prevMonthlyCancelled) / prevMonthlyCancelled) * 100;
  const monthlyCancelledTrend = monthlyCancelledChange > 0 ? 'up' : monthlyCancelledChange < 0 ? 'down' : 'neutral';
  const monthlyCancelledLabel = monthlyCancelledTrend === 'up' ? 'More than last month' : monthlyCancelledTrend === 'down' ? 'Less than last month' : 'Same as last month';

  // Monthly Revenue
  const getOrderRevenue = (o: any) => {
    if (typeof o.total_price === 'number') return o.total_price;
    if (typeof o.total_price === 'string') return parseFloat(o.total_price) || 0;
    if (typeof o.price === 'number') return o.price;
    if (typeof o.price === 'string') return parseFloat(o.price) || 0;
    return 0;
  };
  const monthlyRevenue = ordersCurrentMonth.reduce((sum, o) => sum + getOrderRevenue(o), 0);
  const prevMonthlyRevenue = ordersPrevMonth.reduce((sum, o) => sum + getOrderRevenue(o), 0);
  const monthlyRevenueChange = prevMonthlyRevenue === 0 ? 100 : ((monthlyRevenue - prevMonthlyRevenue) / prevMonthlyRevenue) * 100;
  const monthlyRevenueTrend = monthlyRevenueChange > 0 ? 'up' : monthlyRevenueChange < 0 ? 'down' : 'neutral';
  const monthlyRevenueLabel = monthlyRevenueTrend === 'up' ? 'More than last month' : monthlyRevenueTrend === 'down' ? 'Less than last month' : 'Same as last month';

  if (!mounted || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <MainLayout title="Dashboard" subtitle="View your all subscription info on dashboard">
      {/* Top Metrics Row */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 mb-6">
        <MetricCard
          title="Total Orders"
          value={totalOrders.toLocaleString()}
          change={totalOrdersChangeLabel}
          isPositive={totalOrdersIsPositive}
          sparklineData={totalOrdersSpark}
          icon={<Calendar className="h-5 w-5 text-primary" />}
        />
        <MetricCard
          title="Completed"
          value={completedOrders.toLocaleString()}
          change={completedOrdersChangeLabel}
          isPositive={completedOrdersIsPositive}
          sparklineData={completedOrdersSpark}
          icon={<CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />}
        />
        <MetricCard
          title="Cancelled"
          value={cancelledOrders.toLocaleString()}
          change={cancelledOrdersChangeLabel}
          isPositive={cancelledOrdersIsPositive}
          sparklineData={cancelledOrdersSpark}
          icon={<XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />}
        />
        <MetricCard
          title="Revenue"
          value={`${revenue.toLocaleString()}MAD`}
          change={revenueChangeLabel}
          isPositive={revenueIsPositive}
          sparklineData={revenueSpark}
          icon={<DollarSign className="h-5 w-5 text-primary" />}
        />
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Monthly Orders"
          value={monthlyOrders.toLocaleString()}
          indicator={{ value: `${monthlyOrdersChange >= 0 ? '+' : ''}${monthlyOrdersChange.toFixed(1)}%`, label: monthlyOrdersLabel, trend: monthlyOrdersTrend }}
          icon={<BarChart3 className="h-5 w-5" />}
        />
        <StatsCard
          title="Monthly completed"
          value={monthlyCompleted.toLocaleString()}
          indicator={{ value: `${monthlyCompletedChange >= 0 ? '+' : ''}${monthlyCompletedChange.toFixed(1)}%`, label: monthlyCompletedLabel, trend: monthlyCompletedTrend }}
          icon={<Users className="h-5 w-5" />}
        />
        <StatsCard
          title="Monthly canceled"
          value={monthlyCancelled.toLocaleString()}
          indicator={{ value: `${monthlyCancelledChange >= 0 ? '+' : ''}${monthlyCancelledChange.toFixed(1)}%`, label: monthlyCancelledLabel, trend: monthlyCancelledTrend }}
          icon={<Calendar className="h-5 w-5" />}
        />
        <StatsCard
          title="Monthly Revenue"
          value={`${monthlyRevenue.toLocaleString()}MAD`}
          indicator={{ value: `${monthlyRevenueChange >= 0 ? '+' : ''}${monthlyRevenueChange.toFixed(1)}%`, label: monthlyRevenueLabel, trend: monthlyRevenueTrend }}
          icon={<FileText className="h-5 w-5" />}
        />
      </div>

      {/* Orders Card */}
      <Card className="col-span-1 shadow-sm border border-border bg-background mt-6">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            {/* <div className="mt-1 flex items-center gap-2">
              <span className={`ml-2 text-xs font-medium ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>{ordersLoading ? '' : growthLabel}</span>
            </div> */}
          </div>
          <Maximize2 className="h-4 w-4 text-muted-foreground cursor-pointer" />
        </CardHeader>
        <CardContent className="pt-0">
          {/* --- Enhancement: Filter UI --- */}
          <div className="flex flex-wrap gap-2 mb-2 items-center">
            <div className="flex items-center gap-2 flex-1">
              <select
                className="px-2 py-1 rounded text-xs border bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="contacted">Contacted</option>
                <option value="confirmed">Confirmed</option>
                <option value="paid">Paid</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <span className="text-xs text-muted-foreground ml-2">{filteredChartDays.reduce((sum, day, idx) => sum + (filteredDailyCounts[idx] ?? 0), 0)} orders</span>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              {timeRange === "custom" && (
                <div className="flex gap-2 items-center">
                  <input
                    type="date"
                    value={customRange?.start ? format(customRange.start, "yyyy-MM-dd") : ""}
                    onChange={e => {
                      const newStart = e.target.value ? new Date(e.target.value) : null;
                      setCustomRange(r => ({ start: newStart || r?.start || new Date(), end: r?.end || new Date() }));
                    }}
                    className="px-2 py-1 rounded text-xs border bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-xs">to</span>
                  <input
                    type="date"
                    value={customRange?.end ? format(customRange.end, "yyyy-MM-dd") : ""}
                    onChange={e => {
                      const newEnd = e.target.value ? new Date(e.target.value) : null;
                      setCustomRange(r => ({ start: r?.start || new Date(), end: newEnd || r?.end || new Date() }));
                    }}
                    className="px-2 py-1 rounded text-xs border bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[160px] rounded-lg" aria-label="Select a value">
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="90d" className="rounded-lg">Last 3 months</SelectItem>
                  <SelectItem value="30d" className="rounded-lg">Last 30 days</SelectItem>
                  <SelectItem value="7d" className="rounded-lg">Last 7 days</SelectItem>
                  <SelectItem value="custom" className="rounded-lg">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="h-[160px] w-full flex flex-col items-center justify-center">
            {ordersLoading ? (
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            ) : (
              <OrdersAreaChart chartDays={filteredChartDays} dailyCounts={filteredDailyCounts} />
            )}
            {/* Days of month below chart */}
            {/* {chartDays.length > 0 && (
              <div className="w-full flex justify-between mt-2 px-2">
                {chartDays.map((day, idx) => (
                  <span key={day} className="text-[10px] text-muted-foreground" style={{ minWidth: 0, flex: 1, textAlign: 'center' }}>
                    {parseInt(day.slice(-2), 10)}
                  </span>
                ))}
              </div>
            )} */}
          </div>
          {/* <div className="mt-4 pt-4 border-t">
            <div className="text-xs font-medium mb-2">Orders Growth</div>
            <div className="text-xs text-muted-foreground">
              {growthLabel && `Compared to previous period: ${growthLabel}`}
            </div>
          </div> */}
        </CardContent>
      </Card>

      <div className="mt-4 grid gap-4 md:grid-cols-1 lg:grid-cols-7">
        <div className="md:col-span-1 lg:col-span-4">
          {loadingSubscriptions ? (
            <div className="flex items-center justify-center h-[500px]">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : (
            <SubscriptionList subscriptions={subscriptions} />
          )}
        </div>
        <div className="md:col-span-1 lg:col-span-3">
          {loadingQuickActions ? (
            <div className="flex items-center justify-center h-[500px]">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : (
            <QuickAction items={quickActionItems} />
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-1 lg:grid-cols-7">
        <div className="md:col-span-1 lg:col-span-4">
          <ExpensesChart />
        </div>
        <div className="md:col-span-1 lg:col-span-3">
          <ActivityOverview total={8000} categories={activityCategories} />
        </div>
      </div>
    </MainLayout>
  )
}

function MetricCard({
  title,
  value,
  change,
  isPositive,
  sparklineData,
  icon,
}: {
  title: string
  value: string
  change: string
  isPositive: boolean
  sparklineData: number[]
  icon: React.ReactNode
}) {
  return (
    <Card className="shadow-sm border border-border bg-background transition-all duration-300 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-primary/10">{icon}</div>
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </div>
        <Maximize2 className="h-4 w-4 text-muted-foreground cursor-pointer" />
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-end">
          <div>
            <div className="text-2xl font-bold">{value}</div>
            <div
              className={`text-xs font-medium ${isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
            >
              {change}
            </div>
          </div>
          <div className="h-[40px]">
            <SparklineChart data={sparklineData} color={isPositive ? "#22c55e" : "#ef4444"} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Sparkline Chart Component
function SparklineChart(props: { data: number[]; color: string; showArea?: boolean }) {
  const { data, color, showArea = false } = props
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min

  const points = data
    .map((value: number, index: number) => {
      const x = (index / (data.length - 1)) * 100
      const y = 100 - ((value - min) / range) * 100
      return `${x},${y}`
    })
    .join(" ")

  return (
    <svg width="100" height="40" viewBox="0 0 100 100" preserveAspectRatio="none">
      {showArea && (
        <path d={`M0,${100 - ((data[0] - min) / range) * 100} ${points} L100,100 L0,100 Z`} fill={`${color}20`} />
      )}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}