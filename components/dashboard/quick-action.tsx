"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Phone, Mail, Send } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ActionItem {
  name: string
  company: string
  logo: string
  dueIn: number
  dueDate?: string
  address?: string
  email?: string
  phone?: string
  orderDetails?: string
  amount?: string
  visit_services_detailed?: any[]
  status?: string
}

interface QuickActionProps {
  items: ActionItem[]
}

// Helper to format date as YYYY/MM/DD from ISO string
function formatUtcDate(dateStr: string) {
  if (!dateStr) return '-';
  const [year, month, day] = dateStr.slice(0, 10).split('-');
  return `${month}/${day}/${year}`;
}

export function QuickAction({ items }: QuickActionProps) {
  const [selectedVisit, setSelectedVisit] = useState<any | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<ActionItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const getDueClass = (days: number) => {
    if (days <= 2) return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
    if (days <= 4) return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
    return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
  }

  const handleVisitClick = (visit: any, customer: ActionItem) => {
    setSelectedVisit(visit)
    setSelectedCustomer(customer)
    setIsModalOpen(true)
  }

  // Flatten and sort all visits from all items by date+time (soonest first)
  const allVisits: { visit: any, customer: ActionItem, dueIn: number, dueLabel: string }[] = [];
  const now = new Date();
  items.forEach((item) => {
    if (Array.isArray(item.visit_services_detailed)) {
      item.visit_services_detailed.forEach((visit: any) => {
        let dueIn = 0;
        let dueLabel = '';
        if (visit.date) {
          // Get UTC date parts for now and visit
          const nowUtc = new Date();
          const todayUtcStr = nowUtc.getUTCFullYear() + '-' +
            String(nowUtc.getUTCMonth() + 1).padStart(2, '0') + '-' +
            String(nowUtc.getUTCDate()).padStart(2, '0');
          const visitDate = new Date(visit.date);
          const visitDateUtcStr = visitDate.getUTCFullYear() + '-' +
            String(visitDate.getUTCMonth() + 1).padStart(2, '0') + '-' +
            String(visitDate.getUTCDate()).padStart(2, '0');
          if (visitDateUtcStr === todayUtcStr) {
            dueLabel = 'Due today';
            dueIn = 0;
          } else {
            // Calculate days difference based on UTC date only
            const nowDateOnly = new Date(todayUtcStr + 'T00:00:00Z');
            const visitDateOnly = new Date(visitDateUtcStr + 'T00:00:00Z');
            const diff = (visitDateOnly.getTime() - nowDateOnly.getTime()) / (1000 * 60 * 60 * 24);
            dueIn = Math.round(diff);
            dueLabel = `Due in ${dueIn} days`;
          }
        }
        allVisits.push({ visit, customer: item, dueIn, dueLabel });
      });
    }
  });
  allVisits.sort((a, b) => {
    const aDate = new Date(a.visit.date + (a.visit.time ? 'T' + a.visit.time : ''));
    const bDate = new Date(b.visit.date + (b.visit.time ? 'T' + b.visit.time : ''));
    return aDate.getTime() - bDate.getTime();
  });

  return (
    <>
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-md h-[500px]">
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <CardTitle className="text-base font-medium">Upcoming Visits</CardTitle>
            <span className="ml-2 text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{allVisits.length} total</span>
          </div>
          <p className="text-xs text-muted-foreground">Visits reminders</p>
        </CardHeader>
        <CardContent className="space-y-3 overflow-auto h-[400px]">
          {allVisits.map(({ visit, customer, dueIn, dueLabel }, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-lg group cursor-pointer transition-all duration-200 hover:bg-muted p-2"
              onClick={() => handleVisitClick(visit, customer)}
            >
              <div className="flex items-center gap-3">
                {/* <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted overflow-hidden">
                  <Image
                    src={customer.logo || "../../public/placeholder.svg"}
                    width={35}
                    height={35}
                    alt={customer.name}
                    className="rounded-md"
                  />
                </div> */}
                <div>
                  <p className="text-sm font-medium group-hover:text-primary transition-colors">{customer.name}</p>
                  <p className="text-xs text-muted-foreground">{customer.company}</p>
                </div>
              </div>
              <div className={`rounded-full px-2 py-1 text-xs font-medium ${getDueClass(dueIn)}`}>  {/*{visit.time || '-'}*/}
                {dueLabel}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>Information about the visit and customer</DialogDescription>
          </DialogHeader>

          {selectedVisit && selectedCustomer && (
            <div className="grid gap-6 py-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted overflow-hidden">
                  <Image
                    src={selectedCustomer.logo || "/placeholder.svg"}
                    width={64}
                    height={64}
                    alt={selectedCustomer.name}
                    className="rounded-md"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedCustomer.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.company}</p>
                  
                </div>
              </div>

              <div>
              <h3 className="text-sm font-medium mb-1">Order status</h3>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  (selectedCustomer.status || '').toLowerCase() === 'paid'
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                    : (selectedCustomer.status || '').toLowerCase() === 'confirmed'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : (selectedCustomer.status || '').toLowerCase() === 'contacted'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}>
                    {selectedCustomer.status ? selectedCustomer.status.charAt(0).toUpperCase() + selectedCustomer.status.slice(1) : 'Pending'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <h4 className="text-sm font-medium mb-1">Date</h4>
                  <p className="text-sm">{selectedVisit.date ? formatUtcDate(selectedVisit.date) : '-'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Time</h4>
                  <p className="text-sm">{selectedVisit.time || '-'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Type</h4>
                  <p className="text-sm">{selectedVisit.title || '-'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Completed</h4>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${selectedVisit.completed ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>{selectedVisit.completed ? 'Yes' : 'No'}</span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-1">Customer Information</h4>
                <div className="space-y-2 mt-2">
                  <p className="text-sm flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {selectedCustomer.email || "customer@example.com"}
                  </p>
                  <p className="text-sm flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {selectedCustomer.phone || "+1 (555) 123-4567"}
                  </p>
                  <p className="text-sm">{selectedCustomer.address || "123 Main St, Anytown, CA 94501"}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() =>
                window.open(`https://wa.me/${selectedCustomer?.phone?.replace(/\D/g, "") || "15551234567"}`, "_blank")
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

