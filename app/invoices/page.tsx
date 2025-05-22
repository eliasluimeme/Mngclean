"use client"

import { useState } from "react"
import { Download, FileText, Plus, Search } from "lucide-react"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/components/auth-provider"
import { ScrollArea } from "@/components/ui/scroll-area"

const invoices = [
  {
    id: "INV-2025-001",
    client: "Oakridge Apartments",
    amount: "$1,550.00",
    date: "2025-03-15",
    dueDate: "2025-04-15",
    status: "Paid",
  },
  {
    id: "INV-2025-002",
    client: "Nexus Office Tower",
    amount: "$2,800.00",
    date: "2025-03-15",
    dueDate: "2025-04-15",
    status: "Unpaid",
  },
  {
    id: "INV-2025-003",
    client: "Riverside Villas",
    amount: "$1,200.00",
    date: "2025-03-10",
    dueDate: "2025-04-10",
    status: "Paid",
  },
  {
    id: "INV-2025-004",
    client: "Horizon Mall",
    amount: "$3,500.00",
    date: "2025-03-05",
    dueDate: "2025-04-05",
    status: "Paid",
  },
  {
    id: "INV-2025-005",
    client: "Evergreen Residences",
    amount: "$950.00",
    date: "2025-03-01",
    dueDate: "2025-04-01",
    status: "Overdue",
  },
  {
    id: "INV-2025-006",
    client: "Pinnacle Business Park",
    amount: "$4,200.00",
    date: "2025-02-28",
    dueDate: "2025-03-28",
    status: "Unpaid",
  },
  {
    id: "INV-2025-007",
    client: "Sunset Apartments",
    amount: "$1,100.00",
    date: "2025-02-25",
    dueDate: "2025-03-25",
    status: "Overdue",
  },
  {
    id: "INV-2025-008",
    client: "Metro Corporate Center",
    amount: "$3,800.00",
    date: "2025-02-20",
    dueDate: "2025-03-20",
    status: "Paid",
  },
  {
    id: "INV-2025-009",
    client: "Lakeside Condos",
    amount: "$1,800.00",
    date: "2025-02-15",
    dueDate: "2025-03-15",
    status: "Paid",
  },
  {
    id: "INV-2025-010",
    client: "Central Hospital",
    amount: "$5,500.00",
    date: "2025-02-10",
    dueDate: "2025-03-10",
    status: "Paid",
  },
]

export default function InvoicesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const { isLoading } = useAuth()

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

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.id.toLowerCase().includes(searchQuery.toLowerCase())

    if (activeTab === "all") return matchesSearch
    if (activeTab === "paid") return matchesSearch && invoice.status === "Paid"
    if (activeTab === "unpaid") return matchesSearch && invoice.status === "Unpaid"
    if (activeTab === "overdue") return matchesSearch && invoice.status === "Overdue"

    return matchesSearch
  })

  const getStatusClass = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      case "Unpaid":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
      case "Overdue":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      default:
        return ""
    }
  }

  // Mobile card view for invoices
  const InvoiceCard = ({ invoice }: { invoice: (typeof invoices)[0] }) => (
    <div className="rounded-lg border border-border p-4 mb-3">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-medium">{invoice.id}</h3>
          <p className="text-sm text-muted-foreground">{invoice.client}</p>
        </div>
        <Badge className={getStatusClass(invoice.status)}>{invoice.status}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        <div>
          <p className="text-xs text-muted-foreground">Amount</p>
          <p className="font-medium">{invoice.amount}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Date</p>
          <p>{invoice.date}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Due Date</p>
          <p>{invoice.dueDate}</p>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
          <Download className="h-4 w-4" />
        </Button>
        <Button size="sm" className="h-8">
          View
        </Button>
      </div>
    </div>
  )

  return (
    <MainLayout title="Invoices" subtitle="Manage and track all your cleaning service invoices">
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <div className="text-3xl font-bold">{invoices.length}</div>
                <div className="text-xs text-muted-foreground">For current period</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Paid Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <div className="text-3xl font-bold">{invoices.filter((inv) => inv.status === "Paid").length}</div>
                <div className="text-xs text-muted-foreground">
                  $
                  {invoices
                    .filter((inv) => inv.status === "Paid")
                    .reduce((sum, inv) => sum + Number.parseFloat(inv.amount.replace(/[$,]/g, "")), 0)
                    .toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unpaid Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <div className="text-3xl font-bold">{invoices.filter((inv) => inv.status === "Unpaid").length}</div>
                <div className="text-xs text-muted-foreground">
                  $
                  {invoices
                    .filter((inv) => inv.status === "Unpaid")
                    .reduce((sum, inv) => sum + Number.parseFloat(inv.amount.replace(/[$,]/g, "")), 0)
                    .toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <div className="text-3xl font-bold">{invoices.filter((inv) => inv.status === "Overdue").length}</div>
                <div className="text-xs text-muted-foreground">
                  $
                  {invoices
                    .filter((inv) => inv.status === "Overdue")
                    .reduce((sum, inv) => sum + Number.parseFloat(inv.amount.replace(/[$,]/g, "")), 0)
                    .toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-medium">Invoices</CardTitle>
            <p className="text-xs text-muted-foreground">Manage and track all your cleaning service invoices</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search invoices..."
                className="w-full sm:w-[200px] rounded-lg bg-muted pl-8 text-sm border-none focus-visible:ring-1 focus-visible:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Tabs defaultValue="all" className="w-full sm:w-[300px]">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all" onClick={() => setActiveTab("all")}>
                  All
                </TabsTrigger>
                <TabsTrigger value="paid" onClick={() => setActiveTab("paid")}>
                  Paid
                </TabsTrigger>
                <TabsTrigger value="unpaid" onClick={() => setActiveTab("unpaid")}>
                  Unpaid
                </TabsTrigger>
                <TabsTrigger value="overdue" onClick={() => setActiveTab("overdue")}>
                  Overdue
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Mobile view - card layout */}
          <div className="md:hidden">
            {filteredInvoices.map((invoice) => (
              <InvoiceCard key={invoice.id} invoice={invoice} />
            ))}
          </div>

          {/* Desktop view - table layout */}
          <div className="hidden md:block rounded-lg overflow-hidden border border-border">
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader className="bg-muted/50 sticky top-0 z-10">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Invoice ID</TableHead>
                    <TableHead className="text-muted-foreground">Client</TableHead>
                    <TableHead className="text-muted-foreground">Amount</TableHead>
                    <TableHead className="text-muted-foreground">Date</TableHead>
                    <TableHead className="text-muted-foreground">Due Date</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id} className="hover:bg-muted/50 cursor-pointer transition-colors">
                      <TableCell className="font-medium">{invoice.id}</TableCell>
                      <TableCell>{invoice.client}</TableCell>
                      <TableCell>{invoice.amount}</TableCell>
                      <TableCell>{invoice.date}</TableCell>
                      <TableCell>{invoice.dueDate}</TableCell>
                      <TableCell>
                        <Badge className={getStatusClass(invoice.status)}>{invoice.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button size="sm" className="h-8">
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  )
}

