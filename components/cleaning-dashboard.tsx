"use client"

import { useState } from "react"
import { Bell, LogOut, MoreHorizontal, Package, Search, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
} from "chart.js"
import { Line, Doughnut } from "react-chartjs-2"
import Image from "next/image"

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, ChartTooltip, Legend)

export default function CleaningDashboard() {
  const [activeTab, setActiveTab] = useState("monthly")

  // Line chart data
  const lineChartData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    datasets: [
      {
        label: "Revenue",
        data: [1200, 1900, 1500, 2200, 1800, 2400, 2100, 2800, 2300, 2600, 3000, 3500],
        borderColor: "rgb(147, 112, 219)",
        backgroundColor: "rgba(147, 112, 219, 0.1)",
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointBackgroundColor: "#fff",
        pointHoverBackgroundColor: "rgb(147, 112, 219)",
        pointBorderWidth: 2,
        pointHoverBorderWidth: 2,
        pointBorderColor: "rgb(147, 112, 219)",
      },
    ],
  }

  // Doughnut chart data
  const doughnutChartData = {
    labels: ["Residential", "Commercial", "Deep Cleaning", "Maintenance"],
    datasets: [
      {
        data: [20, 20, 20, 20],
        backgroundColor: [
          "rgba(147, 112, 219, 0.8)",
          "rgba(186, 156, 245, 0.8)",
          "rgba(224, 209, 255, 0.8)",
          "rgba(116, 90, 173, 0.8)",
        ],
        borderColor: "transparent",
        borderWidth: 0,
        hoverOffset: 5,
      },
    ],
  }

  // Chart options
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(30, 30, 30, 0.8)",
        padding: 10,
        cornerRadius: 4,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: "rgba(255, 255, 255, 0.6)",
          font: {
            size: 10,
          },
        },
      },
      y: {
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
          drawBorder: false,
        },
        ticks: {
          color: "rgba(255, 255, 255, 0.6)",
          padding: 10,
          font: {
            size: 10,
          },
          callback: (value) => "$" + value,
        },
        min: 0,
        max: 4000,
        stepSize: 1000,
      },
    },
    elements: {
      line: {
        borderWidth: 2,
      },
    },
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
        backgroundColor: "rgba(30, 30, 30, 0.8)",
        padding: 10,
        cornerRadius: 4,
        displayColors: false,
      },
    },
  }

  return (
    <div className="flex min-h-screen bg-[#0f0f10]">
      {/* Sidebar */}
      <div className="hidden w-56 flex-col bg-[#18181b] p-4 md:flex">
        <div className="flex items-center gap-2 px-2 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#27272a]">
            <span className="text-lg font-medium text-purple-400">C</span>
          </div>
          <span className="text-lg font-medium text-purple-400">CleanPro</span>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          <Button
            variant="ghost"
            className="flex w-full items-center justify-start gap-3 rounded-lg bg-purple-500/20 text-purple-400"
            asChild
          >
            <div>
              <div className="h-4 w-1 rounded-full bg-purple-500"></div>
              <span className="ml-2">Dashboard</span>
            </div>
          </Button>
          <Button
            variant="ghost"
            className="flex w-full items-center justify-start gap-3 rounded-lg text-zinc-400 hover:text-purple-400"
            asChild
          >
            <div>
              <div className="h-4 w-1 rounded-full bg-transparent"></div>
              <span className="ml-2">All Services</span>
            </div>
          </Button>
          <Button
            variant="ghost"
            className="flex w-full items-center justify-start gap-3 rounded-lg text-zinc-400 hover:text-purple-400"
            asChild
          >
            <div>
              <div className="h-4 w-1 rounded-full bg-transparent"></div>
              <span className="ml-2">Bookings</span>
            </div>
          </Button>
          <Button
            variant="ghost"
            className="flex w-full items-center justify-start gap-3 rounded-lg text-zinc-400 hover:text-purple-400"
            asChild
          >
            <div>
              <div className="h-4 w-1 rounded-full bg-transparent"></div>
              <span className="ml-2">Invoices</span>
            </div>
          </Button>
          <Button
            variant="ghost"
            className="flex w-full items-center justify-start gap-3 rounded-lg text-zinc-400 hover:text-purple-400"
            asChild
          >
            <div>
              <div className="h-4 w-1 rounded-full bg-transparent"></div>
              <span className="ml-2">Customer Catalog</span>
            </div>
          </Button>
          <Button
            variant="ghost"
            className="flex w-full items-center justify-start gap-3 rounded-lg text-zinc-400 hover:text-purple-400"
            asChild
          >
            <div>
              <div className="h-4 w-1 rounded-full bg-transparent"></div>
              <span className="ml-2">Reports</span>
            </div>
          </Button>
          <Button
            variant="ghost"
            className="flex w-full items-center justify-start gap-3 rounded-lg text-zinc-400 hover:text-purple-400"
            asChild
          >
            <div>
              <div className="h-4 w-1 rounded-full bg-transparent"></div>
              <span className="ml-2">Users</span>
            </div>
          </Button>
        </nav>

        <div className="mt-auto flex items-center">
          <Button
            variant="ghost"
            className="flex w-full items-center justify-start gap-3 rounded-lg text-zinc-400 hover:text-purple-400"
            asChild
          >
            <div>
              <LogOut className="h-4 w-4" />
              <span className="ml-2">Log Out</span>
            </div>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex h-16 items-center justify-between px-6">
          <div>
            <h1 className="text-lg font-medium text-white">Welcome, Sanket</h1>
            <p className="text-xs text-zinc-400">View your all cleaning services info on dashboard</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                type="search"
                placeholder="Search..."
                className="w-[200px] rounded-full bg-[#27272a] pl-8 text-sm text-zinc-300 border-none focus-visible:ring-1 focus-visible:ring-purple-500"
              />
            </div>
            <Button variant="ghost" size="icon" className="rounded-full text-zinc-400">
              <Bell className="h-5 w-5" />
            </Button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#27272a]">
              <Image src="/placeholder-user.jpg" width={32} height={32} alt="User" className="rounded-full" />
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Services Card */}
            <Card className="bg-[#18181b] border-none shadow-sm rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-sm font-medium text-zinc-400">
                  Total Services
                  <Button variant="ghost" size="icon" className="ml-auto h-4 w-4 text-zinc-500">
                    <Settings className="h-3 w-3" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">24</div>
                <div className="mt-1 flex items-center text-xs">
                  <span className="rounded-full bg-green-900/30 px-1.5 py-0.5 text-xs font-medium text-green-400">
                    12.7%
                  </span>
                  <span className="ml-2 text-zinc-400">More than last month</span>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Services Card */}
            <Card className="bg-[#18181b] border-none shadow-sm rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-sm font-medium text-zinc-400">
                  Upcoming Renewals
                  <Button variant="ghost" size="icon" className="ml-auto h-4 w-4 text-zinc-500">
                    <Settings className="h-3 w-3" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">23</div>
                <div className="mt-1 flex items-center text-xs">
                  <span className="rounded-full bg-amber-900/30 px-1.5 py-0.5 text-xs font-medium text-amber-400">
                    12
                  </span>
                  <span className="ml-2 text-zinc-400">Overdue this month</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-7">
            {/* Revenue Chart */}
            <Card className="bg-[#18181b] border-none shadow-sm rounded-xl lg:col-span-4">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-base font-medium text-white">Expenses Tracker</CardTitle>
                  <p className="text-xs text-zinc-400">Track your monthly and annual expenses.</p>
                </div>
                <Tabs defaultValue="monthly" className="w-[160px]">
                  <TabsList className="grid w-full grid-cols-2 bg-[#27272a]">
                    <TabsTrigger
                      value="monthly"
                      className="data-[state=active]:bg-purple-500 data-[state=active]:text-white"
                      onClick={() => setActiveTab("monthly")}
                    >
                      Monthly
                    </TabsTrigger>
                    <TabsTrigger
                      value="yearly"
                      className="data-[state=active]:bg-purple-500 data-[state=active]:text-white"
                      onClick={() => setActiveTab("yearly")}
                    >
                      Yearly
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent>
                <div className="h-[220px] w-full">
                  <Line data={lineChartData} options={lineChartOptions} />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="text-xl font-bold text-white">2,200</div>
                    <div className="rounded-full bg-green-900/30 px-1.5 py-0.5 text-xs font-medium text-green-400">
                      +10.4%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Action Panel */}
            <Card className="bg-[#18181b] border-none shadow-sm rounded-xl lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-base font-medium text-white">Quick Action</CardTitle>
                <p className="text-xs text-zinc-400">Upcoming reminders for renewals</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#27272a]">
                      <Image
                        src="/placeholder.svg?height=40&width=40"
                        width={40}
                        height={40}
                        alt="Figma"
                        className="rounded-md"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Figma</p>
                      <p className="text-xs text-zinc-400">Figma.com</p>
                    </div>
                  </div>
                  <div className="rounded-full bg-red-900/30 px-2 py-1 text-xs font-medium text-red-300">
                    Due in 2 days
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#27272a]">
                      <Image
                        src="/placeholder.svg?height=40&width=40"
                        width={40}
                        height={40}
                        alt="Webflow"
                        className="rounded-md"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Webflow</p>
                      <p className="text-xs text-zinc-400">Webflow.io</p>
                    </div>
                  </div>
                  <div className="rounded-full bg-orange-900/30 px-2 py-1 text-xs font-medium text-orange-300">
                    Due in 3 days
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#27272a]">
                      <Image
                        src="/placeholder.svg?height=40&width=40"
                        width={40}
                        height={40}
                        alt="Freepik"
                        className="rounded-md"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Freepik</p>
                      <p className="text-xs text-zinc-400">Freepik.com</p>
                    </div>
                  </div>
                  <div className="rounded-full bg-green-900/30 px-2 py-1 text-xs font-medium text-green-300">
                    Due in 8 days
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#27272a]">
                      <Image
                        src="/placeholder.svg?height=40&width=40"
                        width={40}
                        height={40}
                        alt="AWS"
                        className="rounded-md"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">AWS</p>
                      <p className="text-xs text-zinc-400">AWScloud.com</p>
                    </div>
                  </div>
                  <div className="rounded-full bg-green-900/30 px-2 py-1 text-xs font-medium text-green-300">
                    Due in 5 days
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#27272a]">
                      <Image
                        src="/placeholder.svg?height=40&width=40"
                        width={40}
                        height={40}
                        alt="After Effects"
                        className="rounded-md"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">After effects</p>
                      <p className="text-xs text-zinc-400">aftereffects.com</p>
                    </div>
                  </div>
                  <div className="rounded-full bg-green-900/30 px-2 py-1 text-xs font-medium text-green-300">
                    Due in 4 days
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-7">
            {/* Service List */}
            <Card className="bg-[#18181b] border-none shadow-sm rounded-xl lg:col-span-4">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-medium text-white">Subscription List</CardTitle>
                  <p className="text-xs text-zinc-400">Organize and manage all subscriptions.</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input
                      type="search"
                      placeholder="Search"
                      className="w-[150px] rounded-lg bg-[#27272a] pl-8 text-sm text-zinc-300 border-none focus-visible:ring-1 focus-visible:ring-purple-500"
                    />
                  </div>
                  <Button variant="outline" size="sm" className="border-zinc-700 bg-transparent text-zinc-400">
                    All time
                  </Button>
                  <Button variant="ghost" size="icon" className="text-zinc-400">
                    <Package className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800 hover:bg-transparent">
                      <TableHead className="text-zinc-400">Company</TableHead>
                      <TableHead className="text-zinc-400">Amount</TableHead>
                      <TableHead className="text-zinc-400">Due Date</TableHead>
                      <TableHead className="text-zinc-400">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="border-zinc-800 hover:bg-[#27272a]/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#27272a]">
                            <span className="text-blue-400">Ps</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">Photoshop</p>
                            <p className="text-xs text-zinc-400">Photoshop.com</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-white">₹ 1550 /month</TableCell>
                      <TableCell className="text-white">25-11-2024</TableCell>
                      <TableCell>
                        <span className="rounded-full bg-green-900/30 px-2 py-1 text-xs font-medium text-green-400">
                          Paid
                        </span>
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-zinc-800 hover:bg-[#27272a]/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#27272a]">
                            <Image
                              src="/placeholder.svg?height=40&width=40"
                              width={40}
                              height={40}
                              alt="Figma"
                              className="rounded-md"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">Figma</p>
                            <p className="text-xs text-zinc-400">Figma.com</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-white">₹ 1550 /month</TableCell>
                      <TableCell className="text-white">25-11-2024</TableCell>
                      <TableCell>
                        <span className="rounded-full bg-red-900/30 px-2 py-1 text-xs font-medium text-red-400">
                          Unpaid
                        </span>
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-zinc-800 hover:bg-[#27272a]/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#27272a]">
                            <span className="text-blue-400">Ae</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">After effects</p>
                            <p className="text-xs text-zinc-400">Adobeaftereffects.com</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-white">₹ 1550 /month</TableCell>
                      <TableCell className="text-white">25-11-2024</TableCell>
                      <TableCell>
                        <span className="rounded-full bg-green-900/30 px-2 py-1 text-xs font-medium text-green-400">
                          Paid
                        </span>
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-zinc-800 hover:bg-[#27272a]/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#27272a]">
                            <Image
                              src="/placeholder.svg?height=40&width=40"
                              width={40}
                              height={40}
                              alt="Webflow"
                              className="rounded-md"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">Webflow</p>
                            <p className="text-xs text-zinc-400">Webflow.io</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-white">₹ 1550 /month</TableCell>
                      <TableCell className="text-white">25-11-2024</TableCell>
                      <TableCell>
                        <span className="rounded-full bg-red-900/30 px-2 py-1 text-xs font-medium text-red-400">
                          Unpaid
                        </span>
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-zinc-800 hover:bg-[#27272a]/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#27272a]">
                            <Image
                              src="/placeholder.svg?height=40&width=40"
                              width={40}
                              height={40}
                              alt="Freepik"
                              className="rounded-md"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">Freepik</p>
                            <p className="text-xs text-zinc-400">Freepik.com</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-white">₹ 1550 /month</TableCell>
                      <TableCell className="text-white">25-11-2024</TableCell>
                      <TableCell>
                        <span className="rounded-full bg-green-900/30 px-2 py-1 text-xs font-medium text-green-400">
                          Paid
                        </span>
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-zinc-800 hover:bg-[#27272a]/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#27272a]">
                            <Image
                              src="/placeholder.svg?height=40&width=40"
                              width={40}
                              height={40}
                              alt="AWS"
                              className="rounded-md"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">AWS</p>
                            <p className="text-xs text-zinc-400">AWScloud.com</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-white">₹ 1550 /month</TableCell>
                      <TableCell className="text-white">25-11-2024</TableCell>
                      <TableCell>
                        <span className="rounded-full bg-red-900/30 px-2 py-1 text-xs font-medium text-red-400">
                          Unpaid
                        </span>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Activity Overview */}
            <Card className="bg-[#18181b] border-none shadow-sm rounded-xl lg:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-medium text-white">Activity Overview</CardTitle>
                  <p className="text-xs text-zinc-400">Category with high subscriptions rate.</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="relative h-[220px] w-full">
                  <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-xs text-zinc-400">Total</p>
                    <p className="text-2xl font-bold text-white">8,000</p>
                  </div>
                </div>
                <div className="mt-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                      <p className="text-xs text-zinc-300">Entertainment</p>
                    </div>
                    <p className="text-xs font-medium">20%</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-purple-400"></div>
                      <p className="text-xs text-zinc-300">Other</p>
                    </div>
                    <p className="text-xs font-medium">20%</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-purple-300"></div>
                      <p className="text-xs text-zinc-300">Health</p>
                    </div>
                    <p className="text-xs font-medium">20%</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-purple-600"></div>
                      <p className="text-xs text-zinc-300">Productivity</p>
                    </div>
                    <p className="text-xs font-medium">20%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

