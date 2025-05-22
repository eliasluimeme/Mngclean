"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import {
  Filter,
  MoreVertical,
  Plus,
  Search,
  Trash,
  Edit,
  Clock,
  Check,
  Mail,
  DollarSign,
  CheckCircle,
  User,
  Building2,
  CalendarDays,
  ClipboardIcon,
} from "lucide-react"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/components/auth-provider"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

type UIOrder = {
  id: string
  client: string
  type: string
  frequency: string
  nextService: string
  lastService: string
  amount: string
  status: string
}

export default function ServicesPage() {
  const [orders, setOrders] = useState<UIOrder[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [startDate, setStartDate] = useState<Date>()
  const [selectedService, setSelectedService] = useState<UIOrder | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const { isLoading } = useAuth()

  // Add Order Modal State and Helpers
  const initialNewOrderState = {
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    propertyAddress: "",
    serviceType: "",
    date: new Date(),
    timeSlot: "",
    frequency: "one-time",
    superficy: "",
    notes: "",
    cleaningType: "regular",
    abonnement: false,
    cleaningTypes: ["regular", "regular", "regular", "regular"],
  };
  const [newOrder, setNewOrder] = useState({ ...initialNewOrderState });
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [newOrderUserMode, setNewOrderUserMode] = useState<'new' | 'search'>('search');
  const userSearchTimeout = useRef<NodeJS.Timeout | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [serviceFrequencies, setServiceFrequencies] = useState<string[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoadingOrders(true)
      setFetchError(null)
      try {
        const res = await fetch('/api/orders')
        if (!res.ok) throw new Error('Failed to fetch orders')
        const data = await res.json()
        const mapped = (data || []).map((order: any) => {
          // Flatten visit_services_detailed
          let visits: any[] = [];
          if (Array.isArray(order.visit_services_detailed)) {
            visits = order.visit_services_detailed.flat(Infinity).filter((v: any) => v && typeof v === 'object' && v.date)
          }
          // Next service: first with completed: false
          const nextVisit = visits.find((v: any) => v.completed === false)
          // Last service: last with completed: true
          const completedVisits = visits.filter((v: any) => v.completed === true)
          const lastVisit = completedVisits.length > 0 ? completedVisits[completedVisits.length - 1] : undefined
          // If all completed, nextService is '-'. If none completed, lastService is '-'.
          const nextService = nextVisit ? nextVisit.date?.split('T')[0] : '-'
          const lastService = lastVisit ? lastVisit.date?.split('T')[0] : '-'
          return {
            id: order.id,
            client: order.client || order.property || '',
            type: order.type || '',
            frequency: order.frequency || '',
            nextService,
            lastService,
            amount: order.price ? `$${order.price}` : '-',
            status: order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : '-',
          }
        })
        setOrders(mapped)
      } catch (err: any) {
        setFetchError(err.message)
        setOrders([])
      }
      setLoadingOrders(false)
    }
    fetchOrders()
  }, [])

  // Fetch services for select
  useEffect(() => {
    const fetchServices = async () => {
      setServicesLoading(true);
      try {
        const res = await fetch("/api/services");
        if (!res.ok) throw new Error("Failed to fetch services");
        const data = await res.json();
        setServices(data);
      } catch (err) {
        setServices([]);
      } finally {
        setServicesLoading(false);
      }
    };
    fetchServices();
  }, []);

  // When serviceType changes, update available frequencies
  useEffect(() => {
    const selected = services.find(s => s.id === newOrder.serviceType || s.name === newOrder.serviceType);
    if (selected && Array.isArray(selected.frequencies)) {
      setServiceFrequencies(selected.frequencies);
      if (!selected.frequencies.includes(newOrder.frequency)) {
        setNewOrder(prev => ({ ...prev, frequency: selected.frequencies[0] }));
      }
    } else {
      setServiceFrequencies([]);
    }
  }, [newOrder.serviceType, services]);

  // User search effect (debounced)
  useEffect(() => {
    if (newOrderUserMode !== 'search') return;
    if (!userSearch) {
      setUserSearchResults([]);
      setUserSearchLoading(false);
      return;
    }
    setUserSearchLoading(true);
    if (userSearchTimeout.current) clearTimeout(userSearchTimeout.current);
    userSearchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users?query=${encodeURIComponent(userSearch)}`);
        if (!res.ok) throw new Error('Failed to search users');
        const data = await res.json();
        setUserSearchResults(data);
      } catch {
        setUserSearchResults([]);
      } finally {
        setUserSearchLoading(false);
      }
    }, 300);
    return () => {
      if (userSearchTimeout.current) clearTimeout(userSearchTimeout.current);
    };
  }, [userSearch, newOrderUserMode]);

  // Helper to map UI cleaning type to DB price key
  const cleaningTypeToPriceKey = (type: string) => {
    if (type === 'deep' || type === 'Nettoyage Profond') return 'intensif';
    if (type === 'regular' || type === 'Nettoyage Régulier') return 'standard';
    return type;
  };

  const calculateOrderPrice = (() => {
    const selectedService = services.find(s => s.id === newOrder.serviceType || s.name === newOrder.serviceType);
    let price = 0;
    const superficy = isPositiveNumber(newOrder.superficy) ? Number(newOrder.superficy) : 0;
    if (selectedService && selectedService.prices && superficy > 0) {
      const freq = newOrder.frequency;
      const freqPrices = selectedService.prices[freq];
      if (Array.isArray(newOrder.cleaningTypes) && (freq === 'bi-weekly' || freq === 'monthly')) {
        price = newOrder.cleaningTypes.reduce((sum, visitType) => {
          const priceKey = cleaningTypeToPriceKey(visitType);
          if (typeof freqPrices === 'object' && freqPrices !== null) {
            const perMeter = freqPrices[priceKey] ?? 0;
            return sum + (perMeter * superficy);
          }
          return sum;
        }, 0);
      } else if (typeof freqPrices === 'object' && freqPrices !== null && newOrder.cleaningType) {
        const priceKey = cleaningTypeToPriceKey(newOrder.cleaningType);
        const perMeter = freqPrices[priceKey] ?? 0;
        price = perMeter * superficy;
      } else if (typeof freqPrices === 'number') {
        price = freqPrices * superficy;
      }
    }
    return Math.round(price);
  })();

  // Helper to get price per meter for a visit
  function getPricePerMeter(service: any, frequency: string, cleaningType: string) {
    if (!service || !service.prices) return null;
    const freqPrices = service.prices[frequency];
    const priceKey = cleaningTypeToPriceKey(cleaningType);
    if (typeof freqPrices === 'object' && freqPrices !== null) {
      return freqPrices[priceKey] ?? null;
    }
    return null;
  }

  // Handle Add Order submit
  async function handleNewOrderSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors: { [key: string]: string } = {};
    if (!newOrder.first_name) errors.first_name = "First name is required.";
    if (!newOrder.last_name) errors.last_name = "Last name is required.";
    if (!newOrder.email) errors.email = "Email is required.";
    if (!newOrder.phone) errors.phone = "Phone number is required.";
    else if (!isValidPhone(newOrder.phone)) errors.phone = "Enter a valid phone number.";
    if (!newOrder.propertyAddress) errors.propertyAddress = "Property address is required.";
    if (!newOrder.serviceType) errors.serviceType = "Service type is required.";
    if (!newOrder.date) errors.date = "Date is required.";
    if (!newOrder.timeSlot) errors.timeSlot = "Time slot is required.";
    if (!isValidEmail(newOrder.email)) errors.email = "Enter a valid email address.";
    if (newOrder.superficy && !isPositiveNumber(newOrder.superficy)) errors.superficy = "Enter a valid positive number.";
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setSubmitLoading(true);

    // Helper to create user if needed
    const createUser = async () => {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: newOrder.first_name,
          last_name: newOrder.last_name,
          email: newOrder.email,
          phone: newOrder.phone,
        }),
      });
      if (!res.ok) throw new Error('Failed to create user');
      return await res.json();
    };

    try {
      let userId = null;
      if (newOrderUserMode === 'new') {
        const user = await createUser();
        userId = user.id;
      } else if (newOrderUserMode === 'search' && selectedUser) {
        userId = selectedUser.id;
      }
      if (!userId) throw new Error('User not found or created');
      const selectedService = services.find(s => s.id === newOrder.serviceType || s.name === newOrder.serviceType);
      let visits: any[] = [];
      let dates: any[] = [];
      const baseDate = newOrder.date;
      if (newOrder.frequency === "one-time" || newOrder.frequency === "weekly") {
        visits = [{
          date: baseDate,
          time: newOrder.timeSlot,
          title: newOrder.cleaningType === "deep" ? "Nettoyage Profond" : "Nettoyage Régulier",
          completed: false,
          visitIndex: 0,
          serviceType: newOrder.cleaningType,
          pricePerMeter: getPricePerMeter(selectedService, newOrder.frequency, newOrder.cleaningType),
        }];
        dates = [baseDate];
      } else if (newOrder.frequency === "bi-weekly") {
        visits = newOrder.cleaningTypes.slice(0,2).map((type, idx) => ({
          date: new Date(baseDate.getTime() + idx * 14 * 24 * 60 * 60 * 1000),
          time: newOrder.timeSlot,
          title: type === "deep" ? "Nettoyage Profond" : "Nettoyage Régulier",
          completed: false,
          visitIndex: idx,
          serviceType: type,
          pricePerMeter: getPricePerMeter(selectedService, newOrder.frequency, type),
        }));
        dates = visits.map(v => v.date);
      } else if (newOrder.frequency === "monthly") {
        visits = newOrder.cleaningTypes.slice(0,4).map((type, idx) => ({
          date: new Date(baseDate.getTime() + idx * 7 * 24 * 60 * 60 * 1000),
          time: newOrder.timeSlot,
          title: type === "deep" ? "Nettoyage Profond" : "Nettoyage Régulier",
          completed: false,
          visitIndex: idx,
          serviceType: type,
          pricePerMeter: getPricePerMeter(selectedService, newOrder.frequency, type),
        }));
        dates = visits.map(v => v.date);
      }
      const basePrice = (() => {
        const selectedService = services.find(s => s.id === newOrder.serviceType || s.name === newOrder.serviceType);
        if (selectedService && selectedService.prices) {
          const freq = newOrder.frequency;
          const freqPrices = selectedService.prices[freq];
          if (typeof freqPrices === 'object' && freqPrices !== null && newOrder.cleaningType) {
            const priceKey = cleaningTypeToPriceKey(newOrder.cleaningType);
            return freqPrices[priceKey] ?? 0;
          } else if (typeof freqPrices === 'number') {
            return freqPrices;
          }
        }
        return 0;
      })();
      const pricePerMeter = 10; // Example, adjust as needed
      const frequencyLabels: Record<string, string> = {
        'one-time': 'Une visite',
        'weekly': 'Une visite par semaine',
        'bi-weekly': 'Deux visites par mois',
        'monthly': 'Quatre visites par mois',
      };
      const frequencyMultipliers: Record<string, number> = {
        'one-time': 1,
        'weekly': 1,
        'bi-weekly': 2,
        'monthly': 4,
      };
      const price_breakdown = {
        basePrice,
        pricePerMeter,
        frequencyLabel: frequencyLabels[newOrder.frequency] || newOrder.frequency,
        frequencyMultiplier: frequencyMultipliers[newOrder.frequency] || 1,
      };
      const order = {
        user_id: userId,
        service_id: selectedService?.id,
        service_title: selectedService?.title || selectedService?.name,
        selected_frequency: newOrder.frequency,
        abonnement: newOrder.frequency !== "one-time",
        visit_services_detailed: visits,
        surface: newOrder.superficy,
        dates: dates.map(d => d instanceof Date ? d.toISOString() : d),
        time: to24Hour(newOrder.timeSlot),
        address: newOrder.propertyAddress,
        addons: [],
        total_price: calculateOrderPrice,
        base_price: null,
        price_breakdown,
        images: [],
        notes: newOrder.notes,
        status: "pending",
        order_number: generateOrderNumber(),
        created_at: new Date().toISOString(),
        pending: true,
        contacted: false,
        confirmed: false,
        paid: false,
        completed: false,
      };
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });
      if (!res.ok) throw new Error('Failed to create order');
      setNewOrder({ ...initialNewOrderState, cleaningTypes: ["regular", "regular", "regular", "regular"] });
      setNewOrderOpen(false);
      setSubmitLoading(false);
      // Refresh orders
      setLoadingOrders(true);
      const refetch = await fetch('/api/orders');
      const refetchData = await refetch.json();
      const mapped = (refetchData || []).map((order: any) => {
        let visits: any[] = [];
        if (Array.isArray(order.visit_services_detailed)) {
          visits = order.visit_services_detailed.flat(Infinity).filter((v: any) => v && typeof v === 'object' && v.date)
        }
        const nextVisit = visits.find((v: any) => v.completed === false)
        const completedVisits = visits.filter((v: any) => v.completed === true)
        const lastVisit = completedVisits.length > 0 ? completedVisits[completedVisits.length - 1] : undefined
        const nextService = nextVisit ? nextVisit.date?.split('T')[0] : '-'
        const lastService = lastVisit ? lastVisit.date?.split('T')[0] : '-'
        return {
          id: order.id,
          client: order.client || order.property || '',
          type: order.type || '',
          frequency: order.frequency || '',
          nextService,
          lastService,
          amount: order.price ? `$${order.price}` : '-',
          status: order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : '-',
        }
      })
      setOrders(mapped)
    } catch (err: any) {
      setSubmitLoading(false);
      setFormErrors({ general: err.message || 'Failed to create order' });
    }
  }

  if (isLoading || loadingOrders) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-destructive">Error loading orders: {fetchError}</p>
        </div>
      </div>
    )
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.client?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.type?.toLowerCase().includes(searchQuery.toLowerCase())

    if (activeTab === "all") return matchesSearch
    if (activeTab === "pending") return matchesSearch && order.status.toLowerCase() === "pending"
    if (activeTab === "contacted") return matchesSearch && order.status.toLowerCase() === "contacted"
    if (activeTab === "confirmed") return matchesSearch && order.status.toLowerCase() === "confirmed"
    if (activeTab === "paid") return matchesSearch && order.status.toLowerCase() === "paid"
    if (activeTab === "completed") return matchesSearch && order.status.toLowerCase() === "completed"
    return matchesSearch
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission logic here
    setIsModalOpen(false)
    setIsEditing(false)
    setSelectedService(null)
  }

  const handleEdit = (service: UIOrder) => {
    setSelectedService(service)
    setIsEditing(true)
    setIsModalOpen(true)
  }

  const handleDelete = (service: UIOrder) => {
    setSelectedService(service)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = () => {
    // Handle delete logic here
    console.log(`Deleting service: ${selectedService?.id}`)
    setIsDeleteModalOpen(false)
    setSelectedService(null)
  }

  const openAddModal = () => {
    setIsEditing(false)
    setSelectedService(null)
    setNewOrderOpen(true)
  }

  // Mobile card view for services
  const ServiceCard = ({ service }: { service: UIOrder }) => (
    <div className="rounded-lg border border-border p-4 mb-3">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-medium">{service.client}</h3>
          <p className="text-sm text-muted-foreground">{service.type}</p>
        </div>
        <Badge className={`${getStatusClass(service.status)}`}>{service.status}</Badge>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        <div>
          <p className="text-xs text-muted-foreground">Frequency</p>
          <p>{service.frequency}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Amount</p>
          <p>{service.amount}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Next Service</p>
          <p>{service.nextService}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Last Service</p>
          <p>{service.lastService}</p>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => handleEdit(service)}>
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
        <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleDelete(service)}>
          <Trash className="h-4 w-4 mr-1" />
          Delete
        </Button>
      </div>
    </div>
  )

  const getStatusClass = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400"
      case "Contacted":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
      case "Confirmed":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      case "Paid":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
      case "Completed":
        return "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400"
      default:
        return ""
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pending":
        return <Clock className="h-4 w-4 text-slate-600 dark:text-slate-400" />
      case "Contacted":
        return <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      case "Confirmed":
        return <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
      case "Paid":
        return <DollarSign className="h-4 w-4 text-purple-600 dark:text-purple-400" />
      case "Completed":
        return <CheckCircle className="h-4 w-4 text-teal-600 dark:text-teal-400" />
      default:
        return null
    }
  }

  function to24Hour(time12h: string) {
    // Converts '08:00 AM' to '08:00', '01:00 PM' to '13:00', etc.
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    if (modifier === 'PM' && hours !== '12') hours = String(Number(hours) + 12);
    if (modifier === 'AM' && hours === '12') hours = '00';
    return `${hours.padStart(2, '0')}:${minutes}`;
  }

  function generateOrderNumber() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'LC';
    for (let i = 0; i < 7; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  return (
    <MainLayout title="All Services" subtitle="Manage and monitor all your cleaning services">
      <Card>
        <CardHeader className="flex flex-col space-y-3 sm:space-y-0 sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-base font-medium">Orders</CardTitle>
            <p className="text-xs text-muted-foreground">View and manage all your cleaning Orders contracts</p>
          </div>
          {/* Controls: Filters left, Add Order button right */}
          <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1 pt-3">
              <Tabs defaultValue="all" className="w-full sm:w-[500px]">
              <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="all" onClick={() => setActiveTab("all")}>All</TabsTrigger>
                  <TabsTrigger value="pending" onClick={() => setActiveTab("pending")}>Pending</TabsTrigger>
                  <TabsTrigger value="contacted" onClick={() => setActiveTab("contacted")}>Contacted</TabsTrigger>
                  <TabsTrigger value="confirmed" onClick={() => setActiveTab("confirmed")}>Confirmed</TabsTrigger>
                  <TabsTrigger value="paid" onClick={() => setActiveTab("paid")}>Paid</TabsTrigger>
                  <TabsTrigger value="completed" onClick={() => setActiveTab("completed")}>Completed</TabsTrigger>
              </TabsList>
            </Tabs>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuItem>Residential Cleaning</DropdownMenuItem>
                  <DropdownMenuItem>Commercial Cleaning</DropdownMenuItem>
                  <DropdownMenuItem>Deep Cleaning</DropdownMenuItem>
                  <DropdownMenuItem>Maintenance Services</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex justify-end w-full sm:w-auto">
              <Button size="sm" className="sm:ml-4" onClick={openAddModal}>
                <Plus className="mr-2 h-4 w-4" />
                Add Order
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Mobile view - card layout */}
          <div className="md:hidden">
            {filteredOrders.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>

          {/* Desktop view - table layout */}
          <div className="hidden md:block rounded-lg overflow-hidden border border-border">
            <ScrollArea className="h-[600px] lg:h-[900px]">
              <Table>
                <TableHeader className="bg-muted/50 sticky top-0 z-10">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Client</TableHead>
                    <TableHead className="text-muted-foreground">Service Type</TableHead>
                    <TableHead className="text-muted-foreground">Frequency</TableHead>
                    <TableHead className="text-muted-foreground">Next Service</TableHead>
                    <TableHead className="text-muted-foreground">Last Service</TableHead>
                    <TableHead className="text-muted-foreground">Amount</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground w-[60px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((service) => (
                    <TableRow key={service.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">{service.client}</TableCell>
                      <TableCell>{service.type}</TableCell>
                      <TableCell>{service.frequency}</TableCell>
                      <TableCell>{service.nextService}</TableCell>
                      <TableCell>{service.lastService}</TableCell>
                      <TableCell>{service.amount}</TableCell>
                      <TableCell>
                        <Badge className={`${getStatusClass(service.status)}`}>{service.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(service)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(service)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      {/* Add Order Modal */}
      <Dialog open={newOrderOpen} onOpenChange={setNewOrderOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] w-[95vw] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Order</DialogTitle>
            <DialogDescription>Enter the details for the new cleaning service order.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleNewOrderSubmit} className="space-y-6 py-4">
            {/* Client Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center">
                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                Client Information
              </h3>
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <div className="inline-flex rounded-lg bg-muted p-1 border border-border shadow-sm">
                    <button
                      type="button"
                      className={`px-4 py-1 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:z-10 text-sm font-medium ${newOrderUserMode === 'search' ? 'bg-primary text-white shadow' : 'text-muted-foreground hover:bg-accent'}`}
                      onClick={() => setNewOrderUserMode('search')}
                      aria-pressed={newOrderUserMode === 'search'}
                    >
                      Search Users
                    </button>
                    <button
                      type="button"
                      className={`px-4 py-1 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:z-10 text-sm font-medium ${newOrderUserMode === 'new' ? 'bg-primary text-white shadow' : 'text-muted-foreground hover:bg-accent'}`}
                      onClick={() => setNewOrderUserMode('new')}
                      aria-pressed={newOrderUserMode === 'new'}
                    >
                      New User
                    </button>
                  </div>
                </div>
                {newOrderUserMode === 'new' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                      <Label htmlFor="first_name">First Name <span className="text-red-500">*</span></Label>
                  <Input
                        id="first_name"
                        value={newOrder.first_name}
                        onChange={(e) => setNewOrder({ ...newOrder, first_name: e.target.value })}
                        placeholder="John"
                    required
                  />
                </div>
                <div className="space-y-2">
                      <Label htmlFor="last_name">Last Name <span className="text-red-500">*</span></Label>
                  <Input
                        id="last_name"
                        value={newOrder.last_name}
                        onChange={(e) => setNewOrder({ ...newOrder, last_name: e.target.value })}
                        placeholder="Smith"
                    required
                  />
                </div>
                <div className="space-y-2">
                      <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                  <Input
                    id="email"
                    type="email"
                        value={newOrder.email}
                        onChange={(e) => setNewOrder({ ...newOrder, email: e.target.value })}
                        placeholder="client@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
                  <Input
                        id="phone"
                        value={newOrder.phone}
                        onChange={(e) => setNewOrder({ ...newOrder, phone: e.target.value })}
                        placeholder="555-123-4567"
                    required
                  />
                </div>
              </div>
                ) : (
                  <div className="space-y-2 relative">
                    <Label htmlFor="userSearch">Search Users</Label>
                    <Input
                      id="userSearch"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search by name, email, or phone..."
                      autoComplete="off"
                    />
                    {userSearch && !selectedUser && (
                      <div className="absolute left-0 right-0 mt-1 bg-popover border border-border rounded shadow z-50 max-h-60 overflow-y-auto">
                        {userSearchLoading && (
                          <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
                            <span className="animate-spin inline-block h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></span>
                            Searching users...
                          </div>
                        )}
                        {!userSearchLoading && userSearchResults.length > 0 ? (
                          userSearchResults.map((user, idx) => (
                            <button
                              key={user.id || idx}
                              type="button"
                              className="w-full text-left px-3 py-2 hover:bg-accent focus:bg-accent focus:outline-none text-sm"
                              onClick={() => {
                                setNewOrder({
                                  ...newOrder,
                                  first_name: user.first_name,
                                  last_name: user.last_name,
                                  email: user.email,
                                  phone: user.phone,
                                });
                                setUserSearch("");
                                setSelectedUser(user);
                                setNewOrderUserMode('search');
                              }}
                            >
                              <span className="font-medium">{user.first_name} {user.last_name}</span>
                              <span className="block text-xs text-muted-foreground">{user.email} • {user.phone}</span>
                            </button>
                          ))
                        ) : null}
                        {!userSearchLoading && userSearchResults.length === 0 && (
                          <div className="px-3 py-2 text-xs text-muted-foreground">No users found</div>
                        )}
                      </div>
                    )}
                    {selectedUser && (
                      <div className="mt-2 p-3 rounded border bg-muted flex flex-col gap-1">
                        <div className="font-medium text-sm">{selectedUser.first_name} {selectedUser.last_name}</div>
                        <div className="text-xs text-muted-foreground">{selectedUser.email}</div>
                        <div className="text-xs text-muted-foreground">{selectedUser.phone}</div>
                        <button
                          type="button"
                          className="self-end text-xs text-primary hover:text-primary/80"
                          onClick={() => setSelectedUser(null)}
                        >
                          Clear selection
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            {/* Property Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center">
                <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                Property Information
              </h3>
              <div className="space-y-2">
                <Label htmlFor="propertyAddress">Property Address <span className="text-red-500">*</span></Label>
                <Input
                  id="propertyAddress"
                  value={newOrder.propertyAddress}
                  onChange={(e) => setNewOrder({ ...newOrder, propertyAddress: e.target.value })}
                  placeholder="123 Main Street, City, State, ZIP"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="serviceType">Service Type <span className="text-red-500">*</span></Label>
                  <Select
                    value={newOrder.serviceType}
                    onValueChange={(value) => setNewOrder({ ...newOrder, serviceType: value })}
                    required
                    disabled={servicesLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={servicesLoading ? "Loading..." : "Select service type"} />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map(service => (
                        <SelectItem key={service.id} value={service.id}>{service.title || service.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="superficy">Surface (m2)</Label>
                  <Input
                    id="superficy"
                    value={newOrder.superficy}
                    onChange={(e) => setNewOrder({ ...newOrder, superficy: e.target.value })}
                    placeholder="100"
                  />
                </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={newOrder.frequency}
                  onValueChange={(value) => {
                    setNewOrder((prev) => {
                      let cleaningTypes = ["regular", "regular", "regular", "regular"];
                      if (value === "bi-weekly") cleaningTypes = ["regular", "regular"];
                      else if (value === "monthly") cleaningTypes = ["regular", "regular", "regular", "regular"];
                      else cleaningTypes = ["regular"];
                      return { ...prev, frequency: value, cleaningTypes, cleaningType: "regular" };
                    });
                  }}
                >
                  <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                    {serviceFrequencies.map((freq) => (
                      <SelectItem key={freq} value={freq}>{freq}</SelectItem>
                    ))}
                    </SelectContent>
                  </Select>
                </div>
              {/* Cleaning Type Section - dynamic based on frequency */}
              {(newOrder.frequency === "one-time" || newOrder.frequency === "weekly") && (
                <div className="space-y-2">
                  <Label htmlFor="cleaningType">Cleaning Type</Label>
                  <RadioGroup
                    value={newOrder.cleaningType}
                    onValueChange={(value) => setNewOrder({ ...newOrder, cleaningType: value })}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="regular" id="regular" />
                      <Label htmlFor="regular" className="cursor-pointer">Nettoyage Régulier</Label>
              </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="deep" id="deep" />
                      <Label htmlFor="deep" className="cursor-pointer">Nettoyage Profond</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
              {newOrder.frequency === "bi-weekly" && (
                <div className="space-y-2">
                  <Label>Cleaning Type (2 Visits)</Label>
                  {[0, 1].map((idx) => (
                    <div key={idx} className="flex items-center space-x-4 mb-2">
                      <span className="text-xs">{idx + 1}.</span>
                      <RadioGroup
                        value={newOrder.cleaningTypes[idx]}
                        onValueChange={(value) => {
                          const updated = [...newOrder.cleaningTypes];
                          updated[idx] = value;
                          setNewOrder({ ...newOrder, cleaningTypes: updated });
                        }}
                        className="flex space-x-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="regular" id={`regular-${idx}`} />
                          <Label htmlFor={`regular-${idx}`} className="cursor-pointer">Nettoyage Régulier</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="deep" id={`deep-${idx}`} />
                          <Label htmlFor={`deep-${idx}`} className="cursor-pointer">Nettoyage Profond</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  ))}
                </div>
              )}
              {newOrder.frequency === "monthly" && (
                <div className="space-y-2">
                  <Label>Cleaning Type (4 Visits)</Label>
                  {[0, 1, 2, 3].map((idx) => (
                    <div key={idx} className="flex items-center space-x-4 mb-2">
                      <span className="text-xs">{idx + 1}.</span>
                      <RadioGroup
                        value={newOrder.cleaningTypes[idx]}
                        onValueChange={(value) => {
                          const updated = [...newOrder.cleaningTypes];
                          updated[idx] = value;
                          setNewOrder({ ...newOrder, cleaningTypes: updated });
                        }}
                        className="flex space-x-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="regular" id={`regular-m-${idx}`} />
                          <Label htmlFor={`regular-m-${idx}`} className="cursor-pointer">Nettoyage Régulier</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="deep" id={`deep-m-${idx}`} />
                          <Label htmlFor={`deep-m-${idx}`} className="cursor-pointer">Nettoyage Profond</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between mt-2">
                <Label htmlFor="abonnement" className="text-sm">Abonnement</Label>
                <button
                  type="button"
                  id="abonnement"
                  aria-pressed={!!newOrder.abonnement}
                  onClick={() => setNewOrder({ ...newOrder, abonnement: !newOrder.abonnement })}
                  className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none ${newOrder.abonnement ? 'bg-green-500' : 'bg-gray-300'}`}
                  style={{ minWidth: 48 }}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${newOrder.abonnement ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                  <span className="sr-only">Toggle abonnement</span>
                </button>
              </div>
            </div>
            {/* Schedule Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center">
                <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                Schedule Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date <span className="text-red-500">*</span></Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newOrder.date ? format(newOrder.date, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newOrder.date}
                        onSelect={(date) => setNewOrder({ ...newOrder, date: date || new Date() })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeSlot">Time Slot <span className="text-red-500">*</span></Label>
                  <Select
                    value={newOrder.timeSlot}
                    onValueChange={(value) => setNewOrder({ ...newOrder, timeSlot: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time slot" />
                  </SelectTrigger>
                  <SelectContent>
                      {["08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM"].map(slot => (
                        <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              </div>
            </div>
            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center">
                <ClipboardIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                Additional Information
              </h3>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newOrder.notes}
                  onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })}
                  placeholder="Special instructions or requirements..."
                  rows={3}
                />
              </div>
            </div>
            {Object.keys(formErrors).length > 0 && (
              <div className="text-red-500 text-xs mb-2">
                {Object.entries(formErrors).map(([field, msg]) => (
                  <div key={field}>{String(msg)}</div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between py-2">
              <span className="font-semibold text-base">Estimated Price:</span>
              <span className="font-bold text-lg">${calculateOrderPrice}</span>
            </div>
            <DialogFooter className="pt-4">
              <Button variant="outline" type="button" onClick={() => setNewOrderOpen(false)} disabled={submitLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitLoading}>
                {submitLoading ? "Creating..." : "Create Order"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent className="max-w-[500px] w-[95vw]">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the service order for{" "}
              <span className="font-medium">{selectedService?.client}</span>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  )
}

// Validation helpers
function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function isValidPhone(phone: string) {
  return /^\+?\d{7,15}$/.test(phone.replace(/\D/g, ""));
}
function isPositiveNumber(value: string) {
  return /^\d+$/.test(value) && Number(value) > 0;
}

