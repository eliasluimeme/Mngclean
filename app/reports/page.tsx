"use client"

import { useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import {
  RefreshCcw,
  Maximize2,
  Calendar,
  MapPin,
  TrendingUp,
  Star,
  Clock,
  DollarSign,
  Users,
  BarChart4,
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Zap,
  Award,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ReportsPage() {
  const { isLoading } = useAuth()
  const [dateRange, setDateRange] = useState("Apr 1, 2025 - Apr 30, 2025")
  const [trafficView, setTrafficView] = useState("month")
  const [timeRange, setTimeRange] = useState("month")

  if (isLoading) {
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
    <MainLayout title="Reports" subtitle="View detailed analytics and performance reports">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-background shadow-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{dateRange}</span>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={timeRange} onValueChange={setTimeRange} className="w-full sm:w-[180px]">
            <SelectTrigger className="h-9 bg-background shadow-sm">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last 7 days</SelectItem>
              <SelectItem value="month">Last 30 days</SelectItem>
              <SelectItem value="quarter">Last quarter</SelectItem>
              <SelectItem value="year">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-9 bg-background shadow-sm">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" className="h-9 bg-primary hover:bg-primary/90 text-white shadow-sm">
            Create Campaign
          </Button>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 mb-6">
        <MetricCard
          title="Total Bookings"
          value="2,996"
          change="+20.8%"
          isPositive={true}
          sparklineData={[10, 15, 8, 20, 14, 12, 10, 18, 12, 16, 14, 22, 10, 15]}
          icon={<Calendar className="h-5 w-5 text-primary" />}
        />
        <MetricCard
          title="Completed Services"
          value="3,026"
          change="+22.4%"
          isPositive={true}
          sparklineData={[12, 18, 14, 10, 16, 14, 12, 10, 18, 22, 16, 14, 18, 22]}
          icon={<CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />}
        />
        <MetricCard
          title="Revenue"
          value="$31,142"
          change="+32.5%"
          isPositive={true}
          sparklineData={[8, 12, 10, 14, 16, 18, 16, 14, 18, 20, 22, 24, 22, 26]}
          icon={<DollarSign className="h-5 w-5 text-primary" />}
        />
        <MetricCard
          title="Cancellations"
          value="42"
          change="-5.2%"
          isPositive={true}
          sparklineData={[18, 15, 12, 14, 10, 8, 12, 10, 8, 6, 8, 7, 6, 5]}
          icon={<XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />}
        />
      </div>

      {/* Middle Row */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-6">
        {/* Traffic Source */}
        <Card className="col-span-1 shadow-sm border border-border bg-background">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Customer Source</CardTitle>
            <div className="flex items-center gap-2">
              <Tabs defaultValue="month" value={trafficView} onValueChange={setTrafficView}>
                <TabsList className="h-7 p-1">
                  <TabsTrigger value="month" className="text-xs px-2 py-1 h-5">
                    Month
                  </TabsTrigger>
                  <TabsTrigger value="week" className="text-xs px-2 py-1 h-5">
                    Week
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <Maximize2 className="h-4 w-4 text-muted-foreground cursor-pointer" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              <TrafficSourceBar label="Website" value={49215} maxValue={50000} color="bg-primary" />
              <TrafficSourceBar label="Referrals" value={28600} maxValue={50000} color="bg-yellow-500" />
              <TrafficSourceBar label="Direct Calls" value={22789} maxValue={50000} color="bg-green-500" />
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="text-xs font-medium mb-2">Key Insight</div>
              <div className="text-xs text-muted-foreground">
                Website traffic converts 28% better than other channels. Consider increasing digital marketing budget.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customers */}
        <Card className="col-span-1 shadow-sm border border-border bg-background">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-medium">Customers</CardTitle>
              <div className="mt-1">
                <span className="text-2xl font-bold">1,256</span>
                <span className="ml-2 text-xs text-green-600 font-medium">+8.5%</span>
              </div>
            </div>
            <Maximize2 className="h-4 w-4 text-muted-foreground cursor-pointer" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[160px] w-full">
              <CustomerChart />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>07:00</span>
              <span>09:00</span>
              <span>11:00</span>
              <span>13:00</span>
              <span>15:00</span>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="text-xs font-medium mb-2">Peak Hours</div>
              <div className="text-xs text-muted-foreground">
                Booking activity peaks between 9-11am. Consider additional staff support during these hours.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Profile */}
        <Card className="col-span-1 shadow-sm border border-border bg-background">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Customer Profile</CardTitle>
            <div className="flex items-center gap-1">
              <span className="text-xs text-primary cursor-pointer">See details</span>
              <Maximize2 className="h-4 w-4 text-muted-foreground cursor-pointer" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex justify-center mb-4">
              <CustomerProfileChart />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span className="text-xs">Residential</span>
                <span className="text-xs font-semibold ml-auto">58.8%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-xs">Commercial</span>
                <span className="text-xs font-semibold ml-auto">35.7%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-xs">Industrial</span>
                <span className="text-xs font-semibold ml-auto">5.5%</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="text-xs font-medium mb-2">Opportunity</div>
              <div className="text-xs text-muted-foreground">
                Commercial clients have 2.3x higher lifetime value. Focus on expanding this segment.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Performance */}
      <Card className="mb-6 shadow-sm border border-border bg-background">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium">Service Performance</CardTitle>
            <Badge variant="outline" className="text-xs font-normal">
              <Zap className="h-3 w-3 mr-1 text-primary" />
              Service Insights
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Breakdown of service types and their performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 font-medium text-xs text-muted-foreground">Service Type</th>
                  <th className="text-left py-2 px-2 font-medium text-xs text-muted-foreground">Bookings</th>
                  <th className="text-left py-2 px-2 font-medium text-xs text-muted-foreground">Avg. Revenue</th>
                  <th className="text-left py-2 px-2 font-medium text-xs text-muted-foreground">Satisfaction</th>
                  <th className="text-left py-2 px-2 font-medium text-xs text-muted-foreground">Growth</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-3 px-2">
                    <div className="font-medium">Standard Cleaning</div>
                    <div className="text-xs text-muted-foreground">Residential</div>
                  </td>
                  <td className="py-3 px-2">1,245</td>
                  <td className="py-3 px-2">$120</td>
                  <td className="py-3 px-2">
                    <div className="flex items-center">
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 mr-1" />
                      <span>4.7</span>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center text-green-600">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      <span>+18%</span>
                    </div>
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-2">
                    <div className="font-medium">Deep Cleaning</div>
                    <div className="text-xs text-muted-foreground">Residential</div>
                  </td>
                  <td className="py-3 px-2">842</td>
                  <td className="py-3 px-2">$220</td>
                  <td className="py-3 px-2">
                    <div className="flex items-center">
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 mr-1" />
                      <span>4.9</span>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center text-green-600">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      <span>+24%</span>
                    </div>
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-2">
                    <div className="font-medium">Office Cleaning</div>
                    <div className="text-xs text-muted-foreground">Commercial</div>
                  </td>
                  <td className="py-3 px-2">568</td>
                  <td className="py-3 px-2">$350</td>
                  <td className="py-3 px-2">
                    <div className="flex items-center">
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 mr-1" />
                      <span>4.8</span>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center text-green-600">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      <span>+32%</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-2">
                    <div className="font-medium">Warehouse Cleaning</div>
                    <div className="text-xs text-muted-foreground">Industrial</div>
                  </td>
                  <td className="py-3 px-2">124</td>
                  <td className="py-3 px-2">$780</td>
                  <td className="py-3 px-2">
                    <div className="flex items-center">
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 mr-1" />
                      <span>4.6</span>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center text-green-600">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      <span>+15%</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Row */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 mb-6">
        {/* Most Service Locations */}
        <Card className="col-span-1 shadow-sm border border-border bg-background">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-medium">Most service locations</CardTitle>
              <div className="mt-1">
                <span className="text-2xl font-bold">76,345</span>
                <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/30">
                  +5.4%
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">Compared to last month</div>
            </div>
            <Maximize2 className="h-4 w-4 text-muted-foreground cursor-pointer" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[180px] w-full bg-slate-100 dark:bg-slate-800 rounded-md flex items-center justify-center mb-4 relative overflow-hidden">
              <MapPin className="h-8 w-8 text-muted-foreground opacity-50" />

              {/* Map markers */}
              <div className="absolute top-[30%] left-[20%] bg-primary text-white text-xs rounded-full px-2 py-1 shadow-md">
                $34,432
              </div>
              <div className="absolute top-[60%] left-[40%] bg-blue-500 text-white text-xs rounded-full px-2 py-1 shadow-md">
                $22,215
              </div>
              <div className="absolute top-[40%] left-[70%] bg-yellow-500 text-white text-xs rounded-full px-2 py-1 shadow-md">
                $11,589
              </div>
            </div>
            <div className="space-y-3">
              <LocationItem name="Downtown" value="34,432" color="bg-primary" />
              <LocationItem name="Westside" value="22,215" color="bg-blue-500" />
              <LocationItem name="Northside" value="16,457" color="bg-yellow-500" />
              <LocationItem name="Eastside" value="11,589" color="bg-purple-500" />
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="text-xs font-medium mb-2">Location Strategy</div>
              <div className="text-xs text-muted-foreground">
                Downtown area shows 28% higher service frequency. Consider adding a satellite office in this area.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Rating */}
        <Card className="col-span-1 shadow-sm border border-border bg-background">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-medium">Team Rating</CardTitle>
              <CardDescription className="text-xs">Top performing team members by revenue</CardDescription>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-primary cursor-pointer">See details</span>
              <Maximize2 className="h-4 w-4 text-muted-foreground cursor-pointer" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              <TeamMember
                rank={1}
                name="Craig Philips"
                amount="$25,000"
                avatarUrl="/placeholder.svg?height=40&width=40"
                rating={4.9}
                completedJobs={124}
              />
              <TeamMember
                rank={2}
                name="Anika Culhane"
                amount="$19,000"
                avatarUrl="/placeholder.svg?height=40&width=40"
                rating={4.8}
                completedJobs={98}
              />
              <TeamMember
                rank={3}
                name="Brandon Mango"
                amount="$12,000"
                avatarUrl="/placeholder.svg?height=40&width=40"
                rating={4.7}
                completedJobs={76}
              />
              <TeamMember
                rank={4}
                name="Alfonso Mango"
                amount="$9,000"
                avatarUrl="/placeholder.svg?height=40&width=40"
                rating={4.6}
                completedJobs={62}
              />
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="text-xs font-medium mb-2">Team Insight</div>
              <div className="text-xs text-muted-foreground">
                Top performers average 22% more services per month. Consider implementing their best practices across
                all teams.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Business Insights */}
      <Card className="mb-6 shadow-sm border border-border bg-background">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium">Business Insights & Recommendations</CardTitle>
            <Badge variant="outline" className="text-xs font-normal">
              <Award className="h-3 w-3 mr-1 text-primary" />
              Strategic Insights
            </Badge>
          </div>
          <CardDescription className="text-xs">Actionable recommendations based on your business data</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="growth">
            <TabsList className="mb-4">
              <TabsTrigger value="growth">Growth</TabsTrigger>
              <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
              <TabsTrigger value="customers">Customers</TabsTrigger>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
            </TabsList>

            <TabsContent value="growth" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InsightCard
                  title="Market Expansion Opportunity"
                  description="Data shows 32% of your customers in Westside are willing to pay premium rates for deep cleaning services."
                  action="Consider introducing premium service tiers with specialized offerings."
                  icon={<TrendingUp className="h-5 w-5 text-primary" />}
                />
                <InsightCard
                  title="Service Bundling Potential"
                  description="Customers who bundle standard cleaning with deep cleaning spend 45% more annually."
                  action="Create promotional bundles combining complementary services."
                  icon={<Zap className="h-5 w-5 text-primary" />}
                />
                <InsightCard
                  title="Commercial Client Growth"
                  description="Commercial clients have 2.8x higher lifetime value but only represent 35.7% of your customer base."
                  action="Develop targeted marketing campaigns for small to medium businesses."
                  icon={<Users className="h-5 w-5 text-primary" />}
                />
                <InsightCard
                  title="Seasonal Opportunity"
                  description="Spring cleaning bookings increased 68% in April-May. You're currently at 42% capacity during this period."
                  action="Prepare seasonal promotions and increase staffing for spring demand."
                  icon={<Calendar className="h-5 w-5 text-primary" />}
                />
              </div>
            </TabsContent>

            <TabsContent value="efficiency" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InsightCard
                  title="Route Optimization"
                  description="Teams spend an average of 42 minutes in transit between jobs in Downtown area."
                  action="Implement route optimization to reduce transit time by up to 28%."
                  icon={<MapPin className="h-5 w-5 text-primary" />}
                />
                <InsightCard
                  title="Staff Utilization"
                  description="Team productivity varies by 24% across different shifts. Morning teams complete jobs 18% faster."
                  action="Analyze top-performing teams' workflows and standardize best practices."
                  icon={<Clock className="h-5 w-5 text-primary" />}
                />
                <InsightCard
                  title="Supply Management"
                  description="Inventory stockouts occurred 8 times last month, causing delays in 12 service appointments."
                  action="Implement automated inventory tracking with minimum stock alerts."
                  icon={<AlertCircle className="h-5 w-5 text-primary" />}
                />
                <InsightCard
                  title="Service Time Optimization"
                  description="Deep cleaning services take 35% longer than estimated, affecting scheduling accuracy."
                  action="Adjust service time estimates and implement better pre-service assessment."
                  icon={<Clock className="h-5 w-5 text-primary" />}
                />
              </div>
            </TabsContent>

            <TabsContent value="customers" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InsightCard
                  title="Retention Risk"
                  description="15% of long-term residential customers haven't booked in 60+ days, representing $42,000 in annual revenue."
                  action="Launch a targeted re-engagement campaign with special offers."
                  icon={<Users className="h-5 w-5 text-red-600 dark:text-red-400" />}
                />
                <InsightCard
                  title="Feedback Patterns"
                  description="Customers who rate services below 4 stars cite 'inconsistent cleaning quality' as the top reason."
                  action="Implement standardized quality checklists and follow-up inspections."
                  icon={<Star className="h-5 w-5 text-primary" />}
                />
                <InsightCard
                  title="Referral Opportunity"
                  description="Customers acquired through referrals have 34% higher retention and spend 22% more annually."
                  action="Enhance your referral program with better incentives and easier sharing."
                  icon={<ArrowUpRight className="h-5 w-5 text-primary" />}
                />
                <InsightCard
                  title="Communication Preference"
                  description="Customers who receive text confirmations are 28% more likely to be home on time for appointments."
                  action="Make text notifications the default communication method."
                  icon={<CheckCircle2 className="h-5 w-5 text-primary" />}
                />
              </div>
            </TabsContent>

            <TabsContent value="revenue" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InsightCard
                  title="Pricing Opportunity"
                  description="Your deep cleaning services are priced 15% below market average while maintaining high satisfaction."
                  action="Consider a strategic price increase for premium services."
                  icon={<DollarSign className="h-5 w-5 text-primary" />}
                />
                <InsightCard
                  title="Recurring Revenue"
                  description="Customers on subscription plans generate 3.2x more revenue than one-time bookings."
                  action="Promote subscription cleaning plans with first-month discounts."
                  icon={<BarChart4 className="h-5 w-5 text-primary" />}
                />
                <InsightCard
                  title="Upsell Performance"
                  description="Add-on services like carpet cleaning have 72% acceptance rate when offered at booking."
                  action="Train staff to consistently offer relevant add-on services."
                  icon={<ArrowUpRight className="h-5 w-5 text-primary" />}
                />
                <InsightCard
                  title="Payment Efficiency"
                  description="Invoices paid online are settled 8 days faster than traditional methods."
                  action="Incentivize online payments with small discounts or perks."
                  icon={<Zap className="h-5 w-5 text-primary" />}
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </MainLayout>
  )
}

// Metric Card Component
function MetricCard({ title, value, change, isPositive, sparklineData, icon }) {
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

// Insight Card Component
function InsightCard({ title, description, action, icon }) {
  return (
    <div className="rounded-lg border p-4 bg-slate-50 dark:bg-slate-900 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-full bg-primary/10">{icon}</div>
        <div>
          <h3 className="text-sm font-medium mb-1">{title}</h3>
          <p className="text-xs text-muted-foreground mb-2">{description}</p>
          <div className="flex items-center text-xs text-primary font-medium">
            <span>Recommendation:</span>
            <span className="ml-1">{action}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Sparkline Chart Component
function SparklineChart({ data, color, showArea = false }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min

  const points = data
    .map((value, index) => {
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

// Traffic Source Bar Component
function TrafficSourceBar({ label, value, maxValue, color }) {
  const percentage = (value / maxValue) * 100

  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">{value.toLocaleString()}</span>
      </div>
      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  )
}

// Customer Chart Component
function CustomerChart() {
  // This is a simplified representation of a line chart
  return (
    <svg width="100%" height="100%" viewBox="0 0 300 100" preserveAspectRatio="none">
      <path
        d="M0,80 C20,70 40,90 60,75 C80,60 100,80 120,70 C140,60 160,80 180,50 C200,20 220,40 240,30 C260,20 280,10 300,5"
        fill="none"
        stroke="#9370DB"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M0,80 C20,70 40,90 60,75 C80,60 100,80 120,70 C140,60 160,80 180,50 C200,20 220,40 240,30 C260,20 280,10 300,5 V100 H0 Z"
        fill="url(#gradient)"
        opacity="0.2"
      />
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#9370DB" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#9370DB" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// Customer Profile Chart Component
function CustomerProfileChart() {
  return (
    <svg width="120" height="120" viewBox="0 0 42 42">
      <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#e9ecef" strokeWidth="3"></circle>

      {/* Residential - 58.8% */}
      <circle
        cx="21"
        cy="21"
        r="15.91549430918954"
        fill="transparent"
        stroke="#9370DB"
        strokeWidth="3"
        strokeDasharray="58.8 41.2"
        strokeDashoffset="0"
      ></circle>

      {/* Commercial - 35.7% */}
      <circle
        cx="21"
        cy="21"
        r="15.91549430918954"
        fill="transparent"
        stroke="#eab308"
        strokeWidth="3"
        strokeDasharray="35.7 64.3"
        strokeDashoffset="-58.8"
      ></circle>

      {/* Industrial - 5.5% */}
      <circle
        cx="21"
        cy="21"
        r="15.91549430918954"
        fill="transparent"
        stroke="#3b82f6"
        strokeWidth="3"
        strokeDasharray="5.5 94.5"
        strokeDashoffset="-94.5"
      ></circle>
    </svg>
  )
}

// Location Item Component
function LocationItem({ name, value, color }) {
  return (
    <div className="flex items-center">
      <div className={`w-2 h-2 rounded-full ${color} mr-2`}></div>
      <span className="text-xs font-medium">{name}</span>
      <span className="text-xs text-muted-foreground ml-auto">{value}</span>
    </div>
  )
}

// Team Member Component
function TeamMember({ rank, name, amount, avatarUrl, rating, completedJobs }) {
  return (
    <div className="flex items-center">
      <div className="w-6 text-xs text-muted-foreground">{rank}</div>
      <div className="w-8 h-8 rounded-full overflow-hidden mr-3 bg-slate-200 dark:bg-slate-700">
        <img src={avatarUrl || "/placeholder.svg"} alt={name} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium">{name}</div>
        <div className="flex items-center">
          <div className="flex items-center mr-2">
            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 mr-0.5" />
            <span className="text-xs">{rating}</span>
          </div>
          <span className="text-xs text-muted-foreground">{completedJobs} jobs</span>
        </div>
      </div>
      <div
        className={`text-sm font-medium ${rank === 1 ? "text-green-600 dark:text-green-400" : rank === 2 ? "text-primary" : rank === 3 ? "text-amber-600 dark:text-amber-400" : "text-gray-600 dark:text-gray-400"}`}
      >
        {amount}
      </div>
    </div>
  )
}

