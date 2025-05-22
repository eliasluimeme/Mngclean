"use client"

import React, { useState, useEffect } from "react"
import { Building2, Home, Plus, Search, User } from "lucide-react"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/components/auth-provider"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"

const customers = [
  {
    id: "1",
    name: "John Smith",
    email: "john.smith@example.com",
    phone: "(555) 123-4567",
    address: "123 Oak Street, Anytown, CA 94501",
    type: "Residential",
    properties: 1,
    status: "Active",
    joinDate: "2024-01-15",
  },
  {
    id: "2",
    name: "Nexus Properties LLC",
    email: "info@nexusproperties.com",
    phone: "(555) 987-6543",
    address: "500 Business Ave, Commerce City, CA 94502",
    type: "Commercial",
    properties: 3,
    status: "Active",
    joinDate: "2023-11-20",
  },
  {
    id: "3",
    name: "Sarah Johnson",
    email: "sarah.j@example.com",
    phone: "(555) 234-5678",
    address: "456 Riverside Dr, Anytown, CA 94501",
    type: "Residential",
    properties: 1,
    status: "Active",
    joinDate: "2024-02-05",
  },
  {
    id: "4",
    name: "Horizon Mall Management",
    email: "management@horizonmall.com",
    phone: "(555) 876-5432",
    address: "1000 Shopping Center Blvd, Commerce City, CA 94502",
    type: "Commercial",
    properties: 1,
    status: "Active",
    joinDate: "2023-10-10",
  },
  {
    id: "5",
    name: "Robert Wilson",
    email: "rwilson@example.com",
    phone: "(555) 345-6789",
    address: "789 Evergreen Terrace, Anytown, CA 94501",
    type: "Residential",
    properties: 2,
    status: "Inactive",
    joinDate: "2023-09-15",
  },
  {
    id: "6",
    name: "Pinnacle Business Group",
    email: "contact@pinnaclebusiness.com",
    phone: "(555) 765-4321",
    address: "200 Corporate Park, Commerce City, CA 94502",
    type: "Commercial",
    properties: 2,
    status: "Active",
    joinDate: "2023-08-22",
  },
  {
    id: "7",
    name: "David Miller",
    email: "david.m@example.com",
    phone: "(555) 456-7890",
    address: "321 Sunset Blvd, Anytown, CA 94501",
    type: "Residential",
    properties: 1,
    status: "Active",
    joinDate: "2024-03-01",
  },
  {
    id: "8",
    name: "Metro Corporate Services",
    email: "info@metrocorp.com",
    phone: "(555) 654-3210",
    address: "800 Business Center Dr, Commerce City, CA 94502",
    type: "Commercial",
    properties: 4,
    status: "Active",
    joinDate: "2023-07-12",
  },
]

// Map category_id to icon
const categoryIcons: Record<string, React.ReactNode> = {
  residential: <Home className="h-5 w-5 text-primary" />, // adjust color as needed
  commercial: <Building2 className="h-5 w-5 text-primary" />,
}

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedService, setSelectedService] = useState<any>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editPrices, setEditPrices] = useState<any>({})
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    setLoading(true)
    const res = await fetch("/api/services")
    const data = await res.json()
    setServices(data || [])
    setLoading(false)
  }

  const openModal = (service: any) => {
    setSelectedService(service)
    setEditPrices(service.prices || {})
    setSaveError("")
    setSaveSuccess(false)
    setModalOpen(true)
  }

  const handlePriceChange = (freq: string, type: string, value: string) => {
    setEditPrices((prev: any) => ({
      ...prev,
      [freq]: {
        ...prev[freq],
        [type]: value === "" ? "" : Number(value)
      }
    }))
  }

  const handleSave = async () => {
    if (!selectedService) return
    setSaveLoading(true)
    setSaveError("")
    setSaveSuccess(false)
    const res = await fetch(`/api/services/${selectedService.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selectedService.id, prices: editPrices })
    })
    const json = await res.json()
    setSaveLoading(false)
    if (!res.ok) {
      setSaveError(json.error || "Failed to update prices")
      return
    }
    setSaveSuccess(true)
    fetchServices()
  }

  const filteredServices = services.filter((service) => {
    return (
      service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.category_id?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  if (loading) {
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
    <MainLayout title="Services Catalog" subtitle="View and manage all cleaning services">
      <Card>
        <CardHeader className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-medium">Services</CardTitle>
            <p className="text-xs text-muted-foreground">View and manage all cleaning services</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search services..."
                className="w-full sm:w-[250px] rounded-lg bg-muted pl-8 text-sm border-none focus-visible:ring-1 focus-visible:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredServices.map((service) => {
              // Pick icon based on category_id (case-insensitive)
              const iconRaw = categoryIcons[(service.category_id || '').toLowerCase()] || <User className="h-5 w-5 text-primary" />;
              const icon = React.isValidElement(iconRaw)
                ? React.cloneElement(
                    iconRaw as React.ReactElement<any>,
                    {
                      className: [
                        (iconRaw as React.ReactElement<any>).props.className,
                        'h-7 w-7 text-primary'
                      ].filter(Boolean).join(' ')
                    }
                  )
                : iconRaw;
              return (
                <Card
                  key={service.id}
                  className="group cursor-pointer transition-shadow hover:shadow-lg border border-border rounded-2xl bg-background/90 min-h-[140px]"
                  onClick={() => openModal(service)}
                >
                  <CardContent className="flex flex-col gap-3 p-6">
                    <div className="flex items-center gap-4 mb-1">
                      <span className="flex items-center justify-center rounded-full bg-muted w-12 h-12">
                        {/* Make icon larger */}
                        {icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold truncate text-foreground">{service.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{service.description}</p>
                      </div>
                    </div>
                      <Badge variant="outline" className="ml-auto text-sm px-3 py-1 rounded-full bg-accent/40 border-none font-semibold capitalize">
                        {service.category_id}
                      </Badge>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Service Details & Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden">
          {selectedService && (
            <>
              {/* Modal Header with gradient and category */}
              <div
                className="px-6 py-4 flex items-center gap-3"
                style={{
                  background: selectedService.gradient && selectedService.gradient.length === 2
                    ? `linear-gradient(90deg, ${selectedService.gradient[0]}, ${selectedService.gradient[1]})`
                    : undefined,
                  color: '#fff',
                }}
              >
                <div className="flex-1">
                  <DialogTitle className="text-lg font-semibold text-white drop-shadow">
                    {selectedService.title}
                  </DialogTitle>
                </div>
                <Badge variant="outline" className="bg-white/20 border-white/30 text-white text-xs mr-3">
                  {selectedService.category_id}
                </Badge>
              </div>

              {/* Description */}
              <div className="px-6 pt-4 pb-2 border-b text-sm text-muted-foreground">
                {selectedService.description}
              </div>

              {/* Frequencies & Prices Table */}
              <div className="px-6 py-4">
                <div className="font-semibold text-sm mb-2">Frequencies & Prices</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border rounded">
                    <thead>
                      <tr className="bg-muted">
                        <th className="px-2 py-2 text-left font-medium">Frequency</th>
                        <th className="px-2 py-2 text-left font-medium">Standard</th>
                        <th className="px-2 py-2 text-left font-medium">Intensif</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedService.frequencies?.map((freq: string, idx: number) => (
                        <tr key={freq} className={idx % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                          <td className="px-2 py-2 font-medium capitalize">{freq}</td>
                          <td className="px-2 py-2">
                            <Input
                              type="number"
                              className="w-24 h-8 text-xs"
                              value={editPrices?.[freq]?.standard ?? ""}
                              onChange={e => handlePriceChange(freq, "standard", e.target.value)}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <Input
                              type="number"
                              className="w-24 h-8 text-xs"
                              value={editPrices?.[freq]?.intensif ?? ""}
                              onChange={e => handlePriceChange(freq, "intensif", e.target.value)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Error/Success and Actions */}
              <div className="px-6 pb-4">
                {saveError && <div className="text-xs text-red-500 border border-red-300 bg-red-50 rounded p-2 mb-2">{saveError}</div>}
                {saveSuccess && <div className="text-xs text-green-600 border border-green-300 bg-green-50 rounded p-2 mb-2">Prices updated successfully!</div>}
                <div className="flex justify-end gap-2 mt-2">
                  <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={saveLoading}>Close</Button>
                  <Button type="button" onClick={handleSave} disabled={saveLoading}>{saveLoading ? "Saving..." : "Save"}</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}

