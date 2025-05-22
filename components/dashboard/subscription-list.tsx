"use client"

import { useState } from "react"
import { Package, Search, Mail, Phone, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import Image from "next/image"

interface Subscription {
  id: string
  name: string
  company: string
  logo: string
  amount: string
  dueDate: string
  status: string
  email?: string
  phone?: string
  address?: string
  orderDetails?: string
  startDate?: string
  frequency?: string
}

interface SubscriptionListProps {
  subscriptions: Subscription[]
}

// Helper to format date as YYYY/MM/DD from ISO string
function formatUtcDate(dateStr: string) {
  if (!dateStr) return '-';
  const [year, month, day] = dateStr.slice(0, 10).split('-');
  return `${month}/${day}/${year}`;
}

export function SubscriptionList({ subscriptions }: SubscriptionListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState("All time")
  const [selectedItem, setSelectedItem] = useState<Subscription | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const filteredSubscriptions = subscriptions.filter(
    (sub) =>
      sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.company.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleRowClick = (subscription: Subscription) => {
    setSelectedItem(subscription)
    setIsModalOpen(true)
  }

  return (
    <>
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-md h-[500px]">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-medium">Orders List</CardTitle>
            <p className="text-xs text-muted-foreground">Organize and manage all orders.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search"
                className="w-[150px] rounded-lg bg-muted pl-8 text-sm border-none focus-visible:ring-1 focus-visible:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {filter}
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-muted">
              <Package className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg overflow-hidden border border-border h-[380px] overflow-y-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Company</TableHead>
                  <TableHead className="text-muted-foreground">Amount</TableHead>
                  <TableHead className="text-muted-foreground">Due Date</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.map((subscription) => (
                  <TableRow
                    key={subscription.id}
                    className="hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleRowClick(subscription)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {/* <div className="flex h-10 w-10 items-center justify-center rounded-lg overflow-hidden">
                          <Image
                            src={subscription.logo || "/placeholder.svg"}
                            width={20}
                            height={20}
                            alt={subscription.name}
                            className="rounded-md"
                          />
                        </div> */}
                        <div>
                          <p className="text-sm font-medium">{subscription.name}</p>
                          <p className="text-xs text-muted-foreground">{subscription.company}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{subscription.amount}</TableCell>
                    <TableCell>{subscription.dueDate}</TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          subscription.status.toLowerCase() === "paid"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : subscription.status.toLowerCase() === "completed"
                            ? "bg-green-300 text-green-800 dark:bg-green-900/70 dark:text-green-500"
                          : subscription.status.toLowerCase() === "pending"
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          : subscription.status.toLowerCase() === "contacted"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : subscription.status.toLowerCase() === "confirmed"
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                          : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                        }`}
                      >
                        {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>Information about the order and customer</DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="grid gap-6 py-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted overflow-hidden">
                  <Image
                    src={selectedItem.logo || "/placeholder.svg"}
                    width={64}
                    height={64}
                    alt={selectedItem.name}
                    className="rounded-md"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedItem.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedItem.company}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Amount</h4>
                  <p className="text-sm">{selectedItem.amount}</p>
                </div>
                {/* <div>
                  <h4 className="text-sm font-medium mb-1">Due Date</h4>
                  <p className="text-sm">{selectedItem.dueDate}</p>
                </div> */}
                <div>
                  <h4 className="text-sm font-medium mb-1">Status</h4>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      selectedItem.status.toLowerCase() === "paid"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : selectedItem.status.toLowerCase() === "completed"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-500"
                      : selectedItem.status.toLowerCase() === "pending"
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                      : selectedItem.status.toLowerCase() === "contacted"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : selectedItem.status.toLowerCase() === "confirmed"
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                      : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                    }`}
                  >
                    {selectedItem.status.charAt(0).toUpperCase() + selectedItem.status.slice(1)}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Frequency</h4>
                  <p className="text-sm">{selectedItem.frequency || "Weekly"}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-1">Order Details</h4>
                <p className="text-sm">
                  {selectedItem.orderDetails || "Regular cleaning service with full coverage of all areas"}
                </p>
              </div>

              {/* Visits Section */}
              <div>
                <h4 className="text-sm font-medium mb-1 mt-4">Visits</h4>
                {Array.isArray((selectedItem as any).visit_services_detailed) && (selectedItem as any).visit_services_detailed.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs border mt-2">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="px-2 py-1 text-left">Date</th>
                          <th className="px-2 py-1 text-left">Time</th>
                          <th className="px-2 py-1 text-left">Type</th>
                          {/* <th className="px-2 py-1 text-left">Type</th> */}
                          <th className="px-2 py-1 text-left">Completed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedItem as any).visit_services_detailed.map((visit: any, idx: number) => (
                          <tr key={idx} className="border-t">
                            <td className="px-2 py-1">{visit.date ? formatUtcDate(visit.date) : '-'}</td>
                            <td className="px-2 py-1">{visit.time || '-'}</td>
                            <td className="px-2 py-1">{visit.title || '-'}</td>
                            {/* <td className="px-2 py-1 capitalize">{visit.serviceType || '-'}</td> */}
                            <td className="px-2 py-1">
                              {visit.completed ? (
                                <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Yes</span>
                              ) : (
                                <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">No</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-2">No visits scheduled.</p>
                )}
              </div>

              <div>
                <h4 className="text-sm font-medium mb-1">Customer Information</h4>
                <div className="space-y-2 mt-2">
                  <p className="text-sm flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {selectedItem.email || `contact@${selectedItem.company.toLowerCase().replace(/\s+/g, "")}.com`}
                  </p>
                  <p className="text-sm flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {selectedItem.phone || "+1 (555) 123-4567"}
                  </p>
                  <p className="text-sm">{selectedItem.address || "123 Business Ave, Commerce City, CA 94502"}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() =>
                window.open(`https://wa.me/${selectedItem?.phone?.replace(/\D/g, "") || ""}`, "_blank")
              }
            >
              Contact via WhatsApp
            </Button>
            {/* <Button className="w-full sm:w-auto">
              <Send className="mr-2 h-4 w-4" />
              Send Invoice
            </Button> */}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

