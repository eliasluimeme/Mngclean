"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import React from "react"
import {
  CalendarIcon,
  Check,
  Clock,
  Plus,
  Search,
  X,
  DollarSign,
  CheckCircle2,
  MessageCircle,
  Receipt,
  Download,
  Printer,
  Phone,
  Mail,
  Copy,
  CreditCard,
  ArrowDown,
  ArrowUp,
  User,
  Building2,
  CalendarDays,
  ClipboardIcon,
  AlertTriangle,
  Filter as FilterIcon,
  XCircle,
} from "lucide-react"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Calendar as CalendarUI } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, parseISO, isValid, isSameDay } from "date-fns"
import { useAuth } from "@/components/auth-provider"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "@/components/ui/use-toast"

// Import for PDF generation
import { jsPDF } from "jspdf"

// Add custom styles for hiding scrollbars while allowing scrolling
const noScrollbarStyles = `
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`

// Sample data
const users = [
  {
    id: "1",
    name: "John Smith",
    email: "john.smith@example.com",
    phone: "555-123-4567",
    type: "Residential",
    address: "123 Oakridge Lane",
  },
  {
    id: "2",
    name: "Sarah Johnson",
    email: "sarah.j@nexuscorp.com",
    phone: "555-987-6543",
    type: "Commercial",
    address: "456 Business Park Ave",
  },
  {
    id: "3",
    name: "Michael Brown",
    email: "m.brown@riverside.com",
    phone: "555-456-7890",
    type: "Residential",
    address: "789 Riverside Dr",
  },
  {
    id: "4",
    name: "Emily Davis",
    email: "emily@horizonmall.com",
    phone: "555-789-0123",
    type: "Commercial",
    address: "101 Shopping Center Blvd",
  },
]

const timeSlots = [
  "08:00 AM",
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
]

const initialNewBookingState = {
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

const teams = [
  { id: "team-a", name: "Team A", phone: "555-111-2222", members: 3 },
  { id: "team-b", name: "Team B", phone: "555-333-4444", members: 4 },
  { id: "team-c", name: "Team C", phone: "555-555-6666", members: 3 },
  { id: "team-d", name: "Team D", phone: "555-777-8888", members: 2 },
]

// Helper functions
const handleAssignTeam = (bookingId: string, teamId: string) => {
  console.log(`Assigning booking ${bookingId} to team ${teamId}`)
}

const handleSendTeamReminder = (booking: any, teamId: string) => {
  const team = teams.find((t) => t.id === teamId)
  if (!team) return

  const phoneNumber = team.phone.replace(/\D/g, "")
  const message = encodeURIComponent(
    `Service Assignment: ${booking.type}\n\nClient: ${booking.client}\nLocation: ${booking.property}\nDate: ${booking.date}\nTime: ${booking.time}\n\nSurface Area: ${booking.superficy}\nNotes: ${booking.notes}\n\nPlease confirm receipt of this assignment.`,
  )
  window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank")
  console.log(`Team reminder sent via WhatsApp`, booking.id)
}

const handleSendPdfQuote = (booking: any) => {
  console.log("Generating PDF quote in French")
  const phoneNumber = booking.phone.replace(/\D/g, "")
  const message = encodeURIComponent(
    `*DEVIS DE NETTOYAGE*\n\nClient: ${booking.client}\nAdresse: ${booking.property}\nDate: ${booking.date}\nHeure: ${booking.time}\n\nType de service: ${booking.type}\nFréquence: ${booking.frequency}\nSurface: ${booking.superficy}\n\nPrix: ${booking.price}€\n\nMerci de confirmer ce devis en répondant à ce message.\n\nCordialement,\nL'équipe MngClean`,
  )
  window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank")
  console.log(`PDF Quote sent via WhatsApp`, booking.id)
}

const handleSendEmail = (booking: any, template: string) => {
  console.log(`Sending email to ${booking.email}, template: ${template}`)
  console.log(`Email sent to ${booking.client} (${booking.email})`)
}

const handleCopyClientInfo = (booking: any, type: string) => {
  let textToCopy = ""
  switch (type) {
    case "name":
      textToCopy = booking.client
      break
    case "phone":
      textToCopy = booking.phone
      break
    case "email":
      textToCopy = booking.email
      break
    case "address":
      textToCopy = booking.address
      break
  }
  navigator.clipboard.writeText(textToCopy)
  console.log(`Copied ${type} to clipboard: ${textToCopy}`)
}

// Utility to load an image from public and convert to base64
async function getBase64FromUrl(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject('Failed to convert image to base64');
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

const handleDownloadInvoice = async (booking: any) => {
  if (!booking.invoice) return;

  try {
    const doc = new jsPDF();
    let y = 20;

    // Header: Devis and logo
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    // doc.text('Devis', 20, y);

    const logoBase64 = await getBase64FromUrl('/logo.png');
    doc.addImage(logoBase64, 'PNG', 20, y + 8, 30, 20);

    // Right column: date, number, recipient
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Invoice Date', 180, y, { align: 'right' });
    doc.text(format(new Date(), 'dd/MM/yyyy'), 180, y + 4, { align: 'right' });
    doc.text(`Devis n°${booking.invoice.number}`, 180, y + 8, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.text("À L'ATTENTION DE", 180, y + 24, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(booking.client || '', 180, y + 32, { align: 'right' });
    // doc.text((booking.property || '').split(',')[0] || '', 180, y + 40, { align: 'right' });

    // Company info (left column, below logo)
    let leftY = y + 45;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('MNG NETTOYAGE', 20, leftY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text([
      'Bd Moulay Ismail, Immeuble J1 office center n702 étage 7, Casablanca Maroc',
      'ICE : 003581298000083',
      'RC : 646773',
      'Email : mngclean1@gmail.com',
      'Tel : 0616090788',
    ], 20, leftY + 7);

    // Service details section
    let detailsY = leftY + 38;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Détails de la prestation', 20, detailsY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    // Format the date to be human-readable
    let readableDate = booking.date;
    try {
      if (typeof booking.date === 'string' && booking.date.length > 10) {
        readableDate = format(parseISO(booking.date), 'PPP');
      } else {
        readableDate = format(new Date(booking.date), 'PPP');
      }
    } catch {
      // fallback to raw date
      readableDate = booking.date;
    }
    doc.text(`Type: ${booking.type}`, 20, detailsY + 6);
    doc.text(`Date: ${readableDate}`, 20, detailsY + 12);
    doc.text(`Heure: ${booking.time}`, 20, detailsY + 18);
    doc.text(`Surface: ${booking.superficy} m²`, 20, detailsY + 24);

    // Table header and rows (declare colWidths/startX only once)
    let tableY = detailsY + 32;
    const colWidths = [70, 25, 35, 35];
    const startX = 20;
    doc.setFillColor(44, 62, 80);
    doc.setTextColor(255, 255, 255);
    doc.rect(startX, tableY, colWidths.reduce((a, b) => a + b), 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Description', startX + 3, tableY + 7);
    doc.text('Surface', startX + colWidths[0] + 3, tableY + 7);
    doc.text('Unit Price', startX + colWidths[0] + colWidths[1] + 3, tableY + 7);
    doc.text('Total', startX + colWidths[0] + colWidths[1] + colWidths[2] + 3, tableY + 7);

    // Table rows
    let rowY = tableY + 10;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    booking.invoice.items.forEach((item: InvoiceItem, itemIdx: number) => {
      doc.setDrawColor(220, 220, 220);
      doc.rect(startX, rowY, colWidths.reduce((a, b) => a + b), 10);
      doc.text(item.description, startX + 3, rowY + 7);
      doc.text(item.quantity.toString(), startX + colWidths[0] + 3, rowY + 7);
      // doc.text(`$${item.unitPrice}`, startX + colWidths[0] + colWidths[1] + 3, rowY + 7);
      // doc.text(`$${item.total}`, startX + colWidths[0] + colWidths[1] + colWidths[2] + 3, rowY + 7);
      rowY += 10;
      // Render visits as sub-rows under the main service row
      if (itemIdx === 0 && booking.visit_services_detailed && booking.visit_services_detailed.length > 0) {
        booking.visit_services_detailed.forEach((visit: any, vIdx: number) => {
          const superficy = Number(booking.superficy) || 0;
          const total = visit.pricePerMeter && superficy ? visit.pricePerMeter * superficy : 0;
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 100, 100);
          doc.rect(startX, rowY, colWidths.reduce((a, b) => a + b), 8);
          doc.text(`   Visit ${visit.visitIndex + 1}: ${visit.serviceType}`, startX + 3, rowY + 6);
          doc.text('-', startX + colWidths[0] + 3, rowY + 6);
          doc.text(`${visit.pricePerMeter || 0} MAD`, startX + colWidths[0] + colWidths[1] + 3, rowY + 6);
          doc.text(`${total} MAD`, startX + colWidths[0] + colWidths[1] + colWidths[2] + 3, rowY + 6);
          rowY += 8;
        });
        doc.setTextColor(0, 0, 0);
      }
    });

    // Totals (right-aligned)
    let totalsY = rowY + 10;
    doc.setFont('helvetica', 'normal');
    // doc.text(`Subtotal: ${booking.invoice.subtotal} MAD`, 180, totalsY, { align: 'right' });
    // doc.text(`Tax: ${booking.invoice.tax} MAD`, 180, totalsY + 6, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`Total: ${booking.invoice.subtotal} MAD`, 180, totalsY + 14, { align: 'right' });

    // Payment status
    // let payY = totalsY + 26;
    // doc.setFont('helvetica', 'normal');
    // doc.setFontSize(11);
    // doc.text(`Payment Status: ${booking.invoice.paymentStatus}`, 20, payY);
    // if (booking.invoice.paymentDate) {
    //   doc.text(`Payment Date: ${booking.invoice.paymentDate}`, 20, payY + 6);
    // }

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text('Merci pour votre confiance!', 20, 275);
    doc.text('Pour toute question, veuillez contacter mngclean1@gmail.com', 20, 280);

    doc.save(`Invoice-${booking.invoice.number}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('There was an error generating the PDF. Please try again.');
  }
};

const handlePrintInvoice = (booking: any) => {
  if (!booking.invoice) return

  // Create a new window for printing
  const printWindow = window.open("", "_blank")
  if (!printWindow) {
    alert("Please allow popups to print the invoice")
    return
  }

  // Generate HTML content for the invoice
  const invoiceHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice ${booking.invoice.number}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .company-name { font-size: 24px; font-weight: bold; color: #2c3e50; }
        .invoice-details { margin-bottom: 20px; }
        .client-details { margin-bottom: 20px; }
        .section-title { font-size: 16px; font-weight: bold; margin-bottom: 5px; color: #2c3e50; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background-color: #2c3e50; color: white; text-align: left; padding: 8px; }
        td { border: 1px solid #ddd; padding: 8px; }
        .totals { text-align: right; margin-top: 20px; }
        .total-row { font-weight: bold; font-size: 16px; }
        .footer { margin-top: 50px; font-size: 12px; color: #777; text-align: center; }
        @media print {
          body { margin: 0; }
          button { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">MngClean</div>
        <div>
          <div><strong>Invoice #:</strong> ${booking.invoice.number}</div>
          <div><strong>Date:</strong> ${booking.invoice.date}</div>
          <div><strong>Due Date:</strong> ${booking.invoice.dueDate}</div>
        </div>
      </div>
      
      <div class="client-details">
        <div class="section-title">Bill To:</div>
        <div>${booking.client}</div>
        <div>${booking.property}</div>
        <div>${booking.email}</div>
        <div>${booking.phone}</div>
      </div>
      
      <div class="service-details">
        <div class="section-title">Service Details:</div>
        <div><strong>Service Type:</strong> ${booking.type}</div>
        <div><strong>Date:</strong> ${booking.date}</div>
        <div><strong>Time:</strong> ${booking.time}</div>
        <div><strong>Surface Area:</strong> ${booking.superficy} m²</div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Unit Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${booking.invoice.items
            .map(
              (item: InvoiceItem) => `
              <tr>
                <td>${item.description}</td>
                <td>${item.quantity}</td>
                <td>$${item.unitPrice}</td>
                <td>$${item.total}</td>
              </tr>
            `,
            )
            .join("")}
          </tbody>
        </table>
        
        <div class="totals">
          <div><strong>Subtotal:</strong> $${booking.invoice.subtotal}</div>
          <div><strong>Tax:</strong> $${booking.invoice.tax}</div>
          <div class="total-row"><strong>Total:</strong> $${booking.invoice.total}</div>
          <div><strong>Payment Status:</strong> ${booking.invoice.paymentStatus}</div>
          ${booking.invoice.paymentDate ? `<div><strong>Payment Date:</strong> ${booking.invoice.paymentDate}</div>` : ""}
        </div>
        
        <div class="footer">
          <p>Thank you for your business!</p>
          <p>For questions about this invoice, please contact support@mngclean.com</p>
        </div>
        
        <button onclick="window.print(); window.close();" style="margin-top: 20px; padding: 10px; background-color: #2c3e50; color: white; border: none; cursor: pointer;">
          Print Invoice
        </button>
      </body>
      </html>
    `

  // Write the HTML to the new window and trigger print
  printWindow.document.open()
  printWindow.document.write(invoiceHTML)
  printWindow.document.close()
}

const handleUpdateProgress = (bookingId: string, field: 'contacted' | 'confirmed' | 'paid', value: boolean) => {
  console.log(`Updating booking ${bookingId}, ${field}: ${value}`)
  console.log(`Booking ${bookingId} updated: ${field} set to ${value}`)
}

const handleServiceCompletion = (bookingId: string, status: boolean) => {
  console.log(`Marking service ${bookingId} as ${status ? "completed" : "incomplete"}`)
}

const handleSendReminder = (booking: any, type: string) => {
  console.log(`Sending ${type} reminder to ${booking.client}`)
  console.log(`Reminder sent to ${booking.client} (${booking.email})`)
}

const handleRequestFeedback = (booking: Booking) => {
  console.log(`Requesting feedback from ${booking.client}`)
  const phoneNumber = booking.phone.replace(/\D/g, "")
  const message = encodeURIComponent(
    `Hello ${booking.client},\n\nThank you for choosing MngClean for your recent cleaning service. We hope you're satisfied with our work!\n\nWe'd appreciate your feedback to help us improve our service. Please rate your experience from 1-5 stars and let us know any comments you have.\n\nThank you,\nMngClean Team`,
  )
  window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank")
}

const handleContactClient = (booking: Booking, method: string) => {
  if (method === "whatsapp") {
    const phoneNumber = booking.phone.replace(/\D/g, "")
    window.open(`https://wa.me/${phoneNumber}`, "_blank")
  } else {
    window.open(`tel:${booking.phone}`, "_blank")
  }
  console.log(`Client contacted via ${method}`, booking.id)
}

const handleSendQuote = (booking: Booking) => {
  const phoneNumber = booking.phone.replace(/\D/g, "")
  const message = encodeURIComponent(
    `Hello ${booking.client},\n\nHere is your quote for ${booking.type} on ${booking.date} at ${booking.time}.\n\nTotal: $${booking.price}\n\nPlease confirm if this works for you.\n\nThank you!`,
  )
  window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank")
  console.log(`Quote sent via WhatsApp`, booking.id)
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Booking {
  id: string;
  client: string;
  property: string;
  type: string;
  date: string;
  time: string;
  status: BookingStatus;
  notes: string;
  frequency: string;
  superficy: string;
  assignedTo: string;
  price: number;
  pending: boolean;
  contacted: boolean;
  confirmed: boolean;
  paid: boolean;
  completed: boolean;
  reminded: boolean;
  phone: string;
  email: string;
  history: Array<{ date: string; action: string; user: string }>;
  invoice?: {
    number: string;
    date: string;
    dueDate: string;
    items: InvoiceItem[];
    subtotal: number;
    tax: number;
    total: number;
    paymentMethod: string;
    paymentStatus: string;
    paymentDate?: string;
  };
  communications?: Array<{
    date: string;
    type: string;
    message: string;
    status: string;
    sentBy: string;
  }>;
  // Add optional visit_services_detailed
  visit_services_detailed?: Array<{
    date: string;
    time: string;
    title: string;
    completed: boolean;
    visitIndex: number;
    serviceType: string;
    pricePerMeter: number;
  }>;
  canceled?: boolean; // <-- add this line
}

type BookingStatus = 'Confirmed' | 'Pending' | 'Cancelled'

const handleSendWhatsApp = async (booking: Booking, method: string): Promise<void> => {
  try {
    console.log(`Sending WhatsApp ${method} to ${booking.client}`)
    console.log(`WhatsApp ${method} sent to ${booking.client} (${booking.phone})`)
  } catch (error) {
    console.error('Error sending WhatsApp:', error)
  }
}

const handleSendSMS = async (booking: Booking): Promise<void> => {
  try {
    console.log(`Sending SMS to ${booking.client}`)
    console.log(`SMS sent to ${booking.client} (${booking.phone})`)
  } catch (error) {
    console.error('Error sending SMS:', error)
  }
}

const calculateTotal = (items: InvoiceItem[]): number => {
  if (!items || !Array.isArray(items)) return 0
  
  return items.reduce((total: number, item: InvoiceItem) => {
    return total + (item.unitPrice * item.quantity)
  }, 0)
}

const handleStatusChange = async (status: BookingStatus): Promise<void> => {
  try {
    console.log(`Status changed to ${status}`)
  } catch (error) {
    console.error('Error changing status:', error)
  }
}

// Helper to derive status booleans from booking.status only
function getBookingStatusFlags(booking: Booking) {
  const status = booking.status?.toLowerCase() || '';
  return {
    pending: ['pending', 'contacted', 'confirmed', 'paid', 'completed'].includes(status),
    contacted: ['contacted', 'confirmed', 'paid', 'completed'].includes(status),
    confirmed: ['confirmed', 'paid', 'completed'].includes(status),
    paid: ['paid', 'completed'].includes(status),
    completed: status === 'completed',
  };
}

// Add validation helpers at the top of BookingsPage
function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function isValidPhone(phone: string) {
  return /^\+?\d{7,15}$/.test(phone.replace(/\D/g, ""));
}
function isPositiveNumber(value: string) {
  return /^\d+$/.test(value) && Number(value) > 0;
}

// Helper to map UI cleaning type to DB price key
const cleaningTypeToPriceKey = (type: string) => {
  if (type === 'deep' || type === 'Nettoyage Profond') return 'intensif';
  if (type === 'regular' || type === 'Nettoyage Régulier') return 'standard';
  return type;
};

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

// Helper: Get UTC date string (YYYY-MM-DD)
function getUtcDateString(dateInput: string | Date) {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return (
    date.getUTCFullYear() +
    '-' +
    String(date.getUTCMonth() + 1).padStart(2, '0') +
    '-' +
    String(date.getUTCDate()).padStart(2, '0')
  );
}
// Helper: Format UTC date as MM/DD/YYYY
function formatUtcDate(dateStr: string) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${month}/${day}/${year}`;
}

export default function BookingsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [date, setDate] = useState(new Date())
  const { isLoading } = useAuth()

  // Modal states
  const [newBookingOpen, setNewBookingOpen] = useState(false)
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState("")

  // New booking form state
  const [newBooking, setNewBooking] = useState({
    ...initialNewBookingState,
    cleaningType: "regular", // default for one-time
    cleaningTypes: ["regular", "regular", "regular", "regular"], // for multi-visit
  });

  // User search state
  const [userSearch, setUserSearch] = useState("")

  // Reschedule form state
  const [rescheduleData, setRescheduleData] = useState({
    date: new Date(),
    timeSlot: "",
    reason: "",
  })

  // Date filter state
  const [selectedDateString, setSelectedDateString] = useState("")

  // Sort state
  const [sortDirection, setSortDirection] = useState("desc") // "asc" or "desc"

  // Add user modal state
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false)
  const [activeAddUserStep, setActiveAddUserStep] = useState(1)

  // Add state for dynamic bookings
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loadingBookings, setLoadingBookings] = useState(true)

  // Loading state for each status checkbox (must be at top level)
  const [contactedLoading, setContactedLoading] = useState(false);
  const [confirmedLoading, setConfirmedLoading] = useState(false);
  const [paidLoading, setPaidLoading] = useState(false);

  // Use a ref to store the fetchBookings function
  const fetchBookingsRef = useRef<() => Promise<void> | undefined>(undefined);

  // In BookingsPage, add local state for visit checkboxes
  const [visitChecks, setVisitChecks] = useState<{ [key: string]: boolean }>({});
  // Add state for visit completion confirmation modal
  const [visitConfirmModal, setVisitConfirmModal] = useState<{
    open: boolean;
    visitKey: string | null;
    visit: any | null;
    booking: Booking | null;
  }>(
    { open: false, visitKey: null, visit: null, booking: null }
  );
  const [visitCompletionLoading, setVisitCompletionLoading] = useState(false);

  // Add state for progress confirmation modal
  const [progressConfirmModal, setProgressConfirmModal] = useState<{
    open: boolean;
    field: 'contacted' | 'confirmed' | 'paid' | null;
    booking: Booking | null;
  }>({ open: false, field: null, booking: null });
  const [progressLoading, setProgressLoading] = useState(false);

  // Replace static services with fetched services
  const [services, setServices] = useState<any[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [serviceFrequencies, setServiceFrequencies] = useState<string[]>([]);

  // Add validation and price state at the top of the component
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [submitLoading, setSubmitLoading] = useState(false);

  // Add state for user mode toggle
  const [newBookingUserMode, setNewBookingUserMode] = useState<'new' | 'search'>('search');

  // Add state for user search results and loading
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const userSearchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Add state for selected user
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  // Add state for discard confirmation
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [pendingClose, setPendingClose] = useState(false);

  // In BookingsPage component, add cancel loading state
  const [cancelBookingLoading, setCancelBookingLoading] = useState(false);

  // User search effect (debounced)
  useEffect(() => {
    if (newBookingUserMode !== 'search') return;
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
    // Cleanup
    return () => {
      if (userSearchTimeout.current) clearTimeout(userSearchTimeout.current);
    };
  }, [userSearch, newBookingUserMode]);

  // Fetch services on mount
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
    const selected = services.find(s => s.id === newBooking.serviceType || s.name === newBooking.serviceType);
    if (selected && Array.isArray(selected.frequencies)) {
      setServiceFrequencies(selected.frequencies);
      // If current frequency is not allowed, reset
      if (!selected.frequencies.includes(newBooking.frequency)) {
        setNewBooking(prev => ({ ...prev, frequency: selected.frequencies[0] }));
      }
    } else {
      setServiceFrequencies([]); // No fallback to all options
    }
  }, [newBooking.serviceType, services]);

  const fetchBookings = async () => {
    setLoadingBookings(true)
    try {
      const res = await fetch("/api/orders")
      if (!res.ok) throw new Error("Failed to fetch bookings")
      const data = await res.json()
      setBookings(data)
    } catch (err) {
      setBookings([])
    } finally {
      setLoadingBookings(false)
    }
  }
  // Assign to ref
  fetchBookingsRef.current = fetchBookings;

  useEffect(() => {
    fetchBookings()
  }, [])

  // Reset loading states when modal closes or booking changes
  useEffect(() => {
    setContactedLoading(false);
    setConfirmedLoading(false);
    setPaidLoading(false);
  }, [detailsOpen, selectedBooking?.id]);

  // Reset modal state when closed
  useEffect(() => {
    if (!newBookingOpen) {
      setNewBooking({ ...initialNewBookingState, cleaningTypes: ["regular", "regular", "regular", "regular"] });
      setUserSearch("");
      setSelectedUser(null);
      setNewBookingUserMode('search');
      setFormErrors({});
    }
  }, [newBookingOpen]);

  // Place the loading return here, after all hooks:
  if (isLoading || loadingBookings) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Filter and sort bookings
  const filteredAndSortedBookings = bookings
    .filter((booking) => {
      const matchesSearch =
        (booking.client && booking.client.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (booking.property && booking.property.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (booking.phone && booking.phone.includes(searchQuery)) ||
        (booking.email && booking.email.toLowerCase().includes(searchQuery.toLowerCase()))

      // If a date is selected, filter only by date and search (ignore tab logic)
      if (selectedDateString) {
        const bookingDateStr = getUtcDateString(booking.date);
        return matchesSearch && bookingDateStr === selectedDateString;
      }
      // Otherwise, use tab logic as before
      let tabMatch: boolean = false;
      if (activeTab === "all") tabMatch = true;
      else if (activeTab === "pending") tabMatch = !!booking.pending;
      else if (activeTab === "contacted") tabMatch = !!booking.contacted && !booking.confirmed;
      else if (activeTab === "confirmed") tabMatch = !!booking.confirmed && !booking.paid;
      else if (activeTab === "paid") tabMatch = !!booking.paid && !booking.completed;
      else if (activeTab === "completed") tabMatch = !!booking.completed;
      else if (activeTab === "today") tabMatch = getUtcDateString(booking.date) === getUtcDateString(new Date());
      else if (activeTab === "week") {
        // Calculate the start and end of the current week in UTC
        const today = new Date();
        const startOfWeek = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - today.getUTCDay()));
        const endOfWeek = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - today.getUTCDay() + 6));
        const bookingDate = booking.date ? (typeof booking.date === 'string' ? new Date(booking.date) : booking.date) : null;
        tabMatch = !!(bookingDate && bookingDate >= startOfWeek && bookingDate <= endOfWeek);
      }
      else if (activeTab === "date") tabMatch = true; // fallback, handled by date filter
      else tabMatch = true;
      return matchesSearch && tabMatch;
    })
    .sort((a, b) => {
      // Sort by UTC date
      const dateA = a.date ? Date.parse(a.date) : 0;
      const dateB = b.date ? Date.parse(b.date) : 0;
      if (sortDirection === "asc") {
        return dateA - dateB;
      } else {
        return dateB - dateA;
      }
    })

  const getStatusIcon = (status: BookingStatus) => {
    switch (status) {
      case "Confirmed":
        return <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
      case "Pending":
        return <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      case "Cancelled":
        return <X className="h-4 w-4 text-red-600 dark:text-red-400" />
      default:
        return null
    }
  }

  const getStatusClass = (status: BookingStatus) => {
    switch (status) {
      case "Confirmed":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      case "Pending":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
      case "Cancelled":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      default:
        return ""
    }
  }

  const handleRescheduleClick = (booking: Booking) => {
    setSelectedBooking(booking)
    setRescheduleData({
      date: new Date(),
      timeSlot: booking.time,
      reason: "",
    })
    setRescheduleOpen(true)
  }

  const handleCancelClick = (booking: Booking) => {
    setSelectedBooking(booking)
    setCancelReason("")
    setCancelConfirmOpen(true)
  }

  const handleViewDetailsClick = (booking: Booking) => {
    setSelectedBooking(booking)
    setDetailsOpen(true)
  }

  // Live price calculation
  const livePrice = (() => {
    const selectedService = services.find(s => s.id === newBooking.serviceType || s.name === newBooking.serviceType);
    let price = 0;
    const superficy = isPositiveNumber(newBooking.superficy) ? Number(newBooking.superficy) : 0;
    if (selectedService && selectedService.prices && superficy > 0) {
      const freq = newBooking.frequency;
      const freqPrices = selectedService.prices[freq];
      if (Array.isArray(newBooking.cleaningTypes) && (freq === 'bi-weekly' || freq === 'monthly')) {
        price = newBooking.cleaningTypes.reduce((sum, visitType) => {
          const priceKey = cleaningTypeToPriceKey(visitType);
          if (typeof freqPrices === 'object' && freqPrices !== null) {
            const perMeter = freqPrices[priceKey] ?? 0;
            return sum + (perMeter * superficy);
          }
          return sum;
        }, 0);
      } else if (typeof freqPrices === 'object' && freqPrices !== null && newBooking.cleaningType) {
        const priceKey = cleaningTypeToPriceKey(newBooking.cleaningType);
        const perMeter = freqPrices[priceKey] ?? 0;
        price = perMeter * superficy;
      } else if (typeof freqPrices === 'number') {
        price = freqPrices * superficy;
      }
    }
    return Math.round(price);
  })();

  // Price breakdown for UI
  const priceBreakdown = (() => {
    const selectedService = services.find(s => s.id === newBooking.serviceType || s.name === newBooking.serviceType);
    const freq = newBooking.frequency;
    const freqPrices = selectedService?.prices?.[freq];
    if (Array.isArray(newBooking.cleaningTypes) && (freq === 'bi-weekly' || freq === 'monthly')) {
      return newBooking.cleaningTypes.map((visitType, idx) => {
        const priceKey = cleaningTypeToPriceKey(visitType);
        return {
          label: `Visite ${idx + 1} (${visitType === 'regular' ? 'Nettoyage Régulier' : 'Nettoyage Profond'})`,
          value: typeof freqPrices === 'object' && freqPrices !== null ? (freqPrices[priceKey] ?? 0) : 0,
        };
      });
    } else if (typeof freqPrices === 'object' && freqPrices !== null && newBooking.cleaningType) {
      const priceKey = cleaningTypeToPriceKey(newBooking.cleaningType);
      return [{
        label: `${freq === 'one-time' ? 'One-time' : 'Weekly'} (${newBooking.cleaningType === 'regular' ? 'Nettoyage Régulier' : 'Nettoyage Profond'})`,
        value: freqPrices[priceKey] ?? 0,
      }];
    } else if (typeof freqPrices === 'number') {
      return [{ label: freq, value: freqPrices }];
    }
    return [];
  })();

  function handleNewBookingSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Validation
    const errors: { [key: string]: string } = {};
    if (!newBooking.first_name) errors.first_name = "First name is required.";
    if (!newBooking.last_name) errors.last_name = "Last name is required.";
    if (!newBooking.email) errors.email = "Email is required.";
    if (!newBooking.phone) errors.phone = "Phone number is required.";
    else if (!isValidPhone(newBooking.phone)) errors.phone = "Enter a valid phone number.";
    if (!newBooking.propertyAddress) errors.propertyAddress = "Property address is required.";
    if (!newBooking.serviceType) errors.serviceType = "Service type is required.";
    if (!newBooking.date) errors.date = "Date is required.";
    if (!newBooking.timeSlot) errors.timeSlot = "Time slot is required.";
    if (!isValidEmail(newBooking.email)) errors.email = "Enter a valid email address.";
    if (newBooking.superficy && !isPositiveNumber(newBooking.superficy)) errors.superficy = "Enter a valid positive number.";
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setSubmitLoading(true);

    // Helper to create user if needed
    const createUser = async () => {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: newBooking.first_name,
          last_name: newBooking.last_name,
          email: newBooking.email,
          phone: newBooking.phone,
        }),
      });
      if (!res.ok) throw new Error('Failed to create user');
      return await res.json();
    };

    // Main async logic
    (async () => {
      try {
        let userId = null;
        if (newBookingUserMode === 'new') {
          // Create user
          const user = await createUser();
          userId = user.id;
        } else if (newBookingUserMode === 'search' && selectedUser) {
          userId = selectedUser.id;
        }
        if (!userId) throw new Error('User not found or created');

        // Find selected service
        const selectedService = services.find(s => s.id === newBooking.serviceType || s.name === newBooking.serviceType);
        // Build visits array
        let visits: any[] = [];
        let dates: any[] = [];
        const baseDate = newBooking.date;
        if (newBooking.frequency === "one-time" || newBooking.frequency === "weekly") {
          visits = [{
            date: baseDate,
            time: newBooking.timeSlot,
            title: newBooking.cleaningType === "deep" ? "Nettoyage Profond" : "Nettoyage Régulier",
            completed: false,
            visitIndex: 0,
            serviceType: newBooking.cleaningType,
            pricePerMeter: getPricePerMeter(selectedService, newBooking.frequency, newBooking.cleaningType),
          }];
          dates = [baseDate];
        } else if (newBooking.frequency === "bi-weekly") {
          visits = newBooking.cleaningTypes.slice(0,2).map((type, idx) => ({
            date: new Date(baseDate.getTime() + idx * 14 * 24 * 60 * 60 * 1000),
            time: newBooking.timeSlot,
            title: type === "deep" ? "Nettoyage Profond" : "Nettoyage Régulier",
            completed: false,
            visitIndex: idx,
            serviceType: type,
            pricePerMeter: getPricePerMeter(selectedService, newBooking.frequency, type),
          }));
          dates = visits.map(v => v.date);
        } else if (newBooking.frequency === "monthly") {
          visits = newBooking.cleaningTypes.slice(0,4).map((type, idx) => ({
            date: new Date(baseDate.getTime() + idx * 7 * 24 * 60 * 60 * 1000),
            time: newBooking.timeSlot,
            title: type === "deep" ? "Nettoyage Profond" : "Nettoyage Régulier",
            completed: false,
            visitIndex: idx,
            serviceType: type,
            pricePerMeter: getPricePerMeter(selectedService, newBooking.frequency, type),
          }));
          dates = visits.map(v => v.date);
        }
        // Prepare order payload
        const basePrice = (() => {
          const selectedService = services.find(s => s.id === newBooking.serviceType || s.name === newBooking.serviceType);
          if (selectedService && selectedService.prices) {
            const freq = newBooking.frequency;
            const freqPrices = selectedService.prices[freq];
            if (typeof freqPrices === 'object' && freqPrices !== null && newBooking.cleaningType) {
              const priceKey = cleaningTypeToPriceKey(newBooking.cleaningType);
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
          frequencyLabel: frequencyLabels[newBooking.frequency] || newBooking.frequency,
          frequencyMultiplier: frequencyMultipliers[newBooking.frequency] || 1,
        };
        const order = {
          user_id: userId,
          service_id: selectedService?.id,
          service_title: selectedService?.title || selectedService?.name,
          selected_frequency: newBooking.frequency,
          abonnement: newBooking.frequency !== "one-time",
          visit_services_detailed: visits,
          surface: newBooking.superficy,
          dates: dates.map(d => d instanceof Date ? d.toISOString() : d),
          time: to24Hour(newBooking.timeSlot),
          address: newBooking.propertyAddress,
          addons: [],
          total_price: livePrice,
          base_price: null, // Optionally calculate
          price_breakdown,
          images: [],
          notes: newBooking.notes,
          status: "pending",
          order_number: generateOrderNumber(),
          created_at: new Date().toISOString(),
          pending: true,
          contacted: false,
          confirmed: false,
          paid: false,
          completed: false,
        };
        // Create order
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order),
        });
        if (!res.ok) throw new Error('Failed to create booking');
        toast({
          title: "Booking created",
          description: `New booking for ${newBooking.first_name} ${newBooking.last_name} has been created.`,
        });
        setNewBooking({ ...initialNewBookingState, cleaningTypes: ["regular", "regular", "regular", "regular"] });
        setNewBookingOpen(false);
        setSubmitLoading(false);
        // Refresh bookings
        if (fetchBookingsRef.current) fetchBookingsRef.current();
      } catch (err: any) {
        setSubmitLoading(false);
        toast({
          title: "Error",
          description: err.message || 'Failed to create booking',
          variant: "destructive",
        });
      }
    })();
  }

  const calculatePrice = (booking: typeof initialNewBookingState) => {
    // Simple price calculation based on service type
    const basePrice = services.find((s) => s.name === booking.serviceType)?.basePrice || 100

    // Add superficy factor if available
    let price = basePrice
    if (booking.superficy) {
      const sqft = Number.parseInt(booking.superficy)
      if (!isNaN(sqft)) {
        // Add $10 for every 500 sqft
        price += Math.floor(sqft / 500) * 10
      }
    }

    // Add deep cleaning premium
    if (booking.cleaningType === "deep") {
      price *= 1.3 // 30% premium for deep cleaning
    }

    return Math.round(price)
  }

  const handleRescheduleSubmit = () => {
    if (!selectedBooking) return;
    console.log("Booking rescheduled:", { bookingId: selectedBooking.id, ...rescheduleData })
    setRescheduleOpen(false)

    toast({
      title: "Booking rescheduled",
      description: `The booking for ${selectedBooking.client} has been rescheduled.`,
    })
  }

  const handleCancelSubmit = () => {
    if (!selectedBooking) return;
    console.log("Booking cancelled:", { bookingId: selectedBooking.id, reason: cancelReason })
    setCancelConfirmOpen(false)
    setDetailsOpen(false)

    toast({
      title: "Booking cancelled",
      description: `The booking for ${selectedBooking.client} has been cancelled.`,
      variant: "destructive",
    })
  }

  const getSelectedUser = () => {
    return users.find((user) => user.id === newBooking.first_name && user.id === newBooking.last_name)
  }

  const getSelectedService = () => {
    return services.find((service) => service.name === newBooking.serviceType)
  }

  // Booking card component for mobile view
  const BookingCard = ({ booking }: { booking: Booking }) => (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4 hover:bg-muted/30 transition-colors cursor-pointer mb-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border border-border">
            <AvatarFallback className="bg-primary/10 text-primary">
              {(booking.client || '').split(' ').map((n: string) => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-sm font-medium">{booking.client}</h3>
            <p className="text-xs text-muted-foreground">{booking.property || ''}</p>
          </div>
        </div>
        <Badge className={getStatusClass(booking.status)}>
          <span className="flex items-center gap-1">
            {getStatusIcon(booking.status)}
            {booking.status}
          </span>
        </Badge>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div>
          <p className="text-muted-foreground">Service Type</p>
          <p>{booking.type}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Date & Time</p>
          <p>
            {booking.date ? formatUtcDate(booking.date) : ''}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{booking.property || ''}</p>
        </div>
        <div className="col-span-1 sm:col-span-2">
          <p className="text-muted-foreground">Notes</p>
          <p>{booking.notes}</p>
        </div>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            handleRescheduleClick(booking)
          }}
          disabled={booking.status === "Cancelled"}
        >
          Reschedule
        </Button>
        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            handleViewDetailsClick(booking)
          }}
        >
          View Details
        </Button>
      </div>
    </div>
  )

  // Add the style tag for custom styles
  const styleTag = (
    <style jsx global>
      {noScrollbarStyles}
    </style>
  )

  // Calculate today's and tomorrow's formatted date strings (in UTC)
  const formattedToday = getUtcDateString(new Date());
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const formattedTomorrow = getUtcDateString(tomorrow);

  // Helper functions for date comparison (using UTC)
  const isTodayBooking = (booking: Booking) => {
    if (!booking.date) return false;
    return getUtcDateString(booking.date) === formattedToday;
  }
  const isTomorrowBooking = (booking: Booking) => {
    if (!booking.date) return false;
    return getUtcDateString(booking.date) === formattedTomorrow;
  }

  const contactedDisabled = selectedBooking?.contacted;
  const confirmedDisabled = !selectedBooking?.contacted || selectedBooking?.confirmed;
  const paidDisabled = !selectedBooking?.confirmed || selectedBooking?.paid;

  const communicationCheckboxes = selectedBooking ? (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
      <div className={`flex items-center justify-between p-3 bg-muted/20 rounded-md border border-border/50 hover:bg-muted/30 transition-colors ${!!selectedBooking.contacted ? 'opacity-50 cursor-not-allowed' : ''}`}> 
        <div className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded-full ${!!selectedBooking.contacted ? 'bg-blue-500' : 'bg-muted-foreground/30'}`}></div>
          <Label htmlFor="contacted" className={`text-sm font-medium ${!!selectedBooking.contacted ? 'cursor-not-allowed' : 'cursor-pointer'}`}>Client Contacted</Label>
        </div>
        {contactedLoading ? (
          <div className="h-5 w-5 flex items-center justify-center">
            <span className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></span>
          </div>
        ) : (
          <Checkbox
            id="contacted"
            checked={!!selectedBooking.contacted}
            disabled={!!selectedBooking.contacted || contactedLoading}
            onCheckedChange={async (checked) => {
              if (!selectedBooking.contacted && checked) {
                setProgressConfirmModal({ open: true, field: 'contacted', booking: selectedBooking });
              }
            }}
            className="h-5 w-5 rounded-md data-[state=checked]:bg-blue-500 data-[state=checked]:text-primary-foreground"
          />
        )}
      </div>
      <div className={`flex items-center justify-between p-3 bg-muted/20 rounded-md border border-border/50 hover:bg-muted/30 transition-colors ${!selectedBooking.contacted || !!selectedBooking.confirmed ? 'opacity-50 cursor-not-allowed' : ''}`}> 
        <div className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded-full ${!!selectedBooking.confirmed ? 'bg-green-500' : 'bg-muted-foreground/30'}`}></div>
          <Label htmlFor="confirmed" className={`text-sm font-medium ${!selectedBooking.contacted || !!selectedBooking.confirmed ? 'cursor-not-allowed' : 'cursor-pointer'}`}>Client Confirmed</Label>
        </div>
        {confirmedLoading ? (
          <div className="h-5 w-5 flex items-center justify-center">
            <span className="animate-spin h-4 w-4 border-2 border-green-500 border-t-transparent rounded-full"></span>
          </div>
        ) : (
          <Checkbox
            id="confirmed"
            checked={!!selectedBooking.confirmed}
            disabled={!selectedBooking.contacted || !!selectedBooking.confirmed || confirmedLoading}
            onCheckedChange={async (checked) => {
              if (!selectedBooking.confirmed && checked && selectedBooking.contacted) {
                setProgressConfirmModal({ open: true, field: 'confirmed', booking: selectedBooking });
              }
            }}
            className="h-5 w-5 rounded-md data-[state=checked]:bg-green-500 data-[state=checked]:text-primary-foreground"
          />
        )}
      </div>
      <div className={`flex items-center justify-between p-3 bg-muted/20 rounded-md border border-border/50 hover:bg-muted/30 transition-colors ${!selectedBooking.confirmed || !!selectedBooking.paid ? 'opacity-50 cursor-not-allowed' : ''}`}> 
        <div className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded-full ${!!selectedBooking.paid ? 'bg-purple-500' : 'bg-muted-foreground/30'}`}></div>
          <Label htmlFor="paid" className={`text-sm font-medium ${!selectedBooking.confirmed || !!selectedBooking.paid ? 'cursor-not-allowed' : 'cursor-pointer'}`}>Client Paid</Label>
        </div>
        {paidLoading ? (
          <div className="h-5 w-5 flex items-center justify-center">
            <span className="animate-spin h-4 w-4 border-2 border-purple-500 border-t-transparent rounded-full"></span>
          </div>
        ) : (
          <Checkbox
            id="paid"
            checked={!!selectedBooking.paid}
            disabled={!selectedBooking.confirmed || !!selectedBooking.paid || paidLoading}
            onCheckedChange={async (checked) => {
              if (!selectedBooking.paid && checked && selectedBooking.confirmed) {
                setProgressConfirmModal({ open: true, field: 'paid', booking: selectedBooking });
              }
            }}
            className="h-5 w-5 rounded-md data-[state=checked]:bg-purple-500 data-[state=checked]:text-primary-foreground"
          />
        )}
      </div>
    </div>
  ) : null;

  // Debugging: log the values and types before rendering checkboxes
  if (selectedBooking) {
    console.log('selectedBooking.contacted:', selectedBooking.contacted, typeof selectedBooking.contacted)
    console.log('selectedBooking.confirmed:', selectedBooking.confirmed, typeof selectedBooking.confirmed)
    console.log('selectedBooking.paid:', selectedBooking.paid, typeof selectedBooking.paid)
  }

  // Frequencies array for frequency select
  const frequencies = [
    { value: "one-time", label: "One-time" },
    { value: "weekly", label: "Weekly" },
    { value: "bi-weekly", label: "Bi-weekly" },
    { value: "monthly", label: "Monthly" },
  ];

  // Helper to map frequency keys to labels
  const frequencyLabels: Record<string, string> = {
    'one-time': 'One-time',
    'weekly': 'Weekly',
    'bi-weekly': 'Bi-weekly',
    'monthly': 'Monthly',
  };

  // Helper to check if there are unsaved changes
  const hasUnsavedChanges = () => {
    return Object.values(newBooking).some(
      v => (Array.isArray(v)
        ? v.some(x => x !== "regular")
        : v && v !== "" && v !== "regular" && !(v instanceof Date))
    ) || userSearch || selectedUser;
  };

  // Intercept modal close
  const handleNewBookingOpenChange = (open: boolean) => {
    if (!open && hasUnsavedChanges()) {
      setShowDiscardModal(true);
      setPendingClose(true);
      return;
    }
    setNewBookingOpen(open);
  };

  // On discard, reset and close
  const handleDiscard = () => {
    setShowDiscardModal(false);
    setPendingClose(false);
    setNewBookingOpen(false);
  };

  // On cancel, just close the discard modal
  const handleCancelDiscard = () => {
    setShowDiscardModal(false);
    setPendingClose(false);
  };

  return (
    <MainLayout title="Bookings" subtitle="Manage and schedule your cleaning service appointments">
      {styleTag}
      <div className="grid gap-4">
        {/* Calendar & Bookings Management Card */}
        <Card>
          <CardHeader className="flex flex-col space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-base font-medium">Calendar & Bookings</CardTitle>
                <p className="text-xs text-muted-foreground">View and manage all scheduled cleaning appointments</p>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search bookings..."
                    className="w-full sm:w-[200px] rounded-lg bg-muted pl-8 text-sm border-none focus-visible:ring-1 focus-visible:ring-primary"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button onClick={() => setNewBookingOpen(true)} className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  New Booking
                </Button>
              </div>
            </div>
            
            <div className="w-full overflow-hidden">
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="flex w-full overflow-x-auto no-scrollbar py-1 px-1">
                  <TabsTrigger value="all" onClick={() => setActiveTab("all")} className="flex-shrink-0">
                    All
                  </TabsTrigger>
                  <TabsTrigger value="pending" onClick={() => setActiveTab("pending")} className="flex-shrink-0">
                    Pending
                  </TabsTrigger>
                  <TabsTrigger value="contacted" onClick={() => setActiveTab("contacted")} className="flex-shrink-0">
                    Contacted
                  </TabsTrigger>
                  <TabsTrigger value="confirmed" onClick={() => setActiveTab("confirmed")} className="flex-shrink-0">
                    Confirmed
                  </TabsTrigger>
                  <TabsTrigger value="paid" onClick={() => setActiveTab("paid")} className="flex-shrink-0">
                    Paid
                  </TabsTrigger>
                  <TabsTrigger value="completed" onClick={() => setActiveTab("completed")} className="flex-shrink-0">
                    Completed
                  </TabsTrigger>
                  {/* <TabsTrigger value="today" onClick={() => setActiveTab("today")} className="flex-shrink-0">
                    Today
                  </TabsTrigger>
                  <TabsTrigger value="date" onClick={() => setActiveTab("date")} className="flex-shrink-0">
                    Selected Date
                  </TabsTrigger> */}
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Calendar Column */}
              <div className="space-y-4">
                {/* Calendar selection */}
                {/* Removed calendar picker section from here */}

                {/* Today's bookings */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Today</h3>
                    <span className="text-xs text-muted-foreground">{format(new Date(), "EEE, MMM d")}</span>
                  </div>
                  <div className="mt-2 space-y-2">
                    {bookings.filter(isTodayBooking).length > 0 ? (
                      bookings
                        .filter(isTodayBooking)
                        .map((booking, index) => {
                          const { pending, contacted, confirmed, paid, completed } = getBookingStatusFlags(booking);
                          return (
                            <div
                              key={index}
                              className="flex items-center justify-between rounded-lg border border-border p-2 hover:bg-muted/30 transition-colors cursor-pointer"
                              onClick={() => handleViewDetailsClick(booking)}
                            >
                              <div className="flex items-center justify-between gap-4 w-full">
                                {/* Left: Booking info */}
                                <div className="flex flex-col items-start">
                                  <p className="text-xs text-muted-foreground">{booking.type}</p>
                                  <p className="text-xs text-muted-foreground">{booking.client}</p>
                                  <p className="text-xs font-medium">{booking.time}</p>
                                </div>
                                {/* Right: Status badge and icons */}
                                <div className="flex flex-col items-end gap-1">
                                  <Badge className={getStatusClass(booking.status)}>
                                    <span className="flex items-center gap-1">
                                      {/* {getStatusIcon(booking.status)} */}
                                      {booking.status}
                                    </span>
                                  </Badge>
                                  <div className="flex -space-x-1">
                                    {pending && (
                                      <div
                                        className="h-5 w-5 rounded-full bg-amber-100 flex items-center justify-center border border-background"
                                        title="Pending"
                                      >
                                        <Clock className="h-2.5 w-2.5 text-amber-600" />
                                      </div>
                                    )}
                                    {contacted && (
                                      <div
                                        className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center border border-background"
                                        title="Client contacted"
                                      >
                                        <MessageCircle className="h-2.5 w-2.5 text-blue-600" />
                                      </div>
                                    )}
                                    {confirmed && (
                                      <div
                                        className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center border border-background"
                                        title="Client confirmed"
                                      >
                                        <Check className="h-2.5 w-2.5 text-green-600" />
                                      </div>
                                    )}
                                    {paid && (
                                      <div
                                        className="h-5 w-5 rounded-full bg-purple-100 flex items-center justify-center border border-background"
                                        title="Payment received"
                                      >
                                        <DollarSign className="h-2.5 w-2.5 text-purple-600" />
                                      </div>
                                    )}
                                    {completed && (
                                      <div
                                        className="h-5 w-5 rounded-full bg-teal-100 flex items-center justify-center border border-background"
                                        title="Service completed"
                                      >
                                        <CheckCircle2 className="h-2.5 w-2.5 text-teal-600" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                    ) : (
                      <div className="rounded-lg border border-dashed border-border p-2 text-center">
                        <p className="text-xs text-muted-foreground">No bookings for today</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tomorrow's bookings */}
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Tomorrow</h3>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(new Date().setDate(new Date().getDate() + 1)), "EEE, MMM d")}
                    </span>
                  </div>
                  <div className="mt-2 space-y-2">
                    {bookings.filter(isTomorrowBooking).length > 0 ? (
                      bookings
                        .filter(isTomorrowBooking)
                        .map((booking, index) => {
                          const { pending, contacted, confirmed, paid, completed } = getBookingStatusFlags(booking);
                          return (
                            <div
                              key={index}
                              className="flex items-center justify-between rounded-lg border border-border p-2 hover:bg-muted/30 transition-colors cursor-pointer"
                              onClick={() => handleViewDetailsClick(booking)}
                            >
                              <div className="flex items-center justify-between gap-4 w-full">
                                  {/* Left: Booking info */}
                                <div className="flex flex-col items-start">
                                  <p className="text-xs text-muted-foreground">{booking.type}</p>
                                  <p className="text-xs text-muted-foreground">{booking.client}</p>
                                  <p className="text-xs font-medium">{booking.time}</p>
                                </div>
                                {/* Right: Status badge and icons */}
                                <div className="flex flex-col items-end gap-1">
                                  <Badge className={getStatusClass(booking.status)}>
                                    <span className="flex items-center gap-1">
                                      {/* {getStatusIcon(booking.status)} */}
                                      {booking.status}
                                    </span>
                                  </Badge>
                                  <div className="flex -space-x-1">
                                    {pending && (
                                      <div
                                        className="h-5 w-5 rounded-full bg-amber-100 flex items-center justify-center border border-background"
                                        title="Pending"
                                      >
                                        <Clock className="h-2.5 w-2.5 text-amber-600" />
                                      </div>
                                    )}
                                    {contacted && (
                                      <div
                                        className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center border border-background"
                                        title="Client contacted"
                                      >
                                        <MessageCircle className="h-2.5 w-2.5 text-blue-600" />
                                      </div>
                                    )}
                                    {confirmed && (
                                      <div
                                        className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center border border-background"
                                        title="Client confirmed"
                                      >
                                        <Check className="h-2.5 w-2.5 text-green-600" />
                                      </div>
                                    )}
                                    {paid && (
                                      <div
                                        className="h-5 w-5 rounded-full bg-purple-100 flex items-center justify-center border border-background"
                                        title="Payment received"
                                      >
                                        <DollarSign className="h-2.5 w-2.5 text-purple-600" />
                                      </div>
                                    )}
                                    {completed && (
                                      <div
                                        className="h-5 w-5 rounded-full bg-teal-100 flex items-center justify-center border border-background"
                                        title="Service completed"
                                      >
                                        <CheckCircle2 className="h-2.5 w-2.5 text-teal-600" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                    ) : (
                      <div className="rounded-lg border border-dashed border-border p-2 text-center">
                        <p className="text-xs text-muted-foreground">No bookings for tomorrow</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bookings List Column */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium">All Bookings</h3>
                  <div className="flex items-center gap-2">
                    {/* Show filter icon if date filter is active */}
                    {selectedDateString && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDateString("");
                          setDate(new Date());
                          setActiveTab("all");
                        }}
                        title="Date filter applied. Click to clear."
                        className="ml-1 text-primary hover:text-red-500 transition-colors"
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                    )}
                    {/* Calendar filter */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="justify-start text-left font-normal h-8 px-3">
                          <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                          <span className="text-xs">{date ? format(date, "PPP") : "Filter by date"}</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <CalendarUI 
                          mode="single" 
                          selected={date} 
                          onSelect={(newDate) => {
                            if (newDate) {
                              setDate(newDate);
                              const formattedDate = format(newDate, "yyyy-MM-dd");
                              setSelectedDateString(formattedDate);
                              setActiveTab("date");
                            }
                          }} 
                          initialFocus 
                          modifiers={{
                            booked: bookings
                              .map(b => b.date)
                              .filter(dateStr => {
                                if (!dateStr) return false;
                                const d = Date.parse(dateStr);
                                return !isNaN(d);
                              })
                              .map(dateStr => parseISO(dateStr)),
                          }}
                          modifiersClassNames={{
                            booked: "bg-primary/20 border-primary",
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={`h-8 w-8 ${sortDirection === 'asc' ? 'bg-muted' : ''}`}
                      onClick={() => setSortDirection('asc')}
                      title="Sort by date (oldest first)"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={`h-8 w-8 ${sortDirection === 'desc' ? 'bg-muted' : ''}`}
                      onClick={() => setSortDirection('desc')}
                      title="Sort by date (newest first)"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground ml-2">{filteredAndSortedBookings.length} bookings found</span>
                  </div>
                </div>

                {/* Mobile view - card layout */}
                <div className="md:hidden">
                  {filteredAndSortedBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))}
                </div>

                {/* Desktop view - direct rendering of booking cards */}
                <div className="hidden md:block space-y-4">
                  {filteredAndSortedBookings.map((booking: Booking) => (
                    <div
                      key={booking.id}
                      className="flex flex-col gap-3 rounded-lg border border-border p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => handleViewDetailsClick(booking)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-border">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {(booking.client || '').split(' ').map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="text-sm font-medium">{booking.client}</h3>
                            <p className="text-xs text-muted-foreground">{booking.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-1">
                            {booking.pending && (
                              <div
                                className="h-6 w-6 rounded-full bg-amber-100 flex items-center justify-center border border-background"
                                title="Pending"
                              >
                                <Clock className="h-3 w-3 text-amber-600" />
                              </div>
                            )}
                            {booking.contacted && (
                              <div
                                className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center border border-background"
                                title="Client contacted"
                              >
                                <MessageCircle className="h-3 w-3 text-blue-600" />
                              </div>
                            )}
                            {booking.confirmed && (
                              <div
                                className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center border border-background"
                                title="Client confirmed"
                              >
                                <Check className="h-3 w-3 text-green-600" />
                              </div>
                            )}
                            {booking.paid && (
                              <div
                                className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center border border-background"
                                title="Payment received"
                              >
                                <DollarSign className="h-3 w-3 text-purple-600" />
                              </div>
                            )}
                            {booking.completed && (
                              <div
                                className="h-6 w-6 rounded-full bg-teal-100 flex items-center justify-center border border-background"
                                title="Service completed"
                              >
                                <CheckCircle2 className="h-3 w-3 text-teal-600" />
                              </div>
                            )}
                          </div>
                          <Badge className={getStatusClass(booking.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(booking.status)}
                              {booking.status}
                            </span>
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="text-muted-foreground">Service Type</p>
                          <p>{booking.type}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Date & Time</p>
                          <p>
                            {booking.date ? formatUtcDate(booking.date) : ''}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Address</p>
                          <p>{booking.property || ''}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Notes</p>
                          <p>{booking.notes}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRescheduleClick(booking)
                          }}
                          disabled={booking.status === "Cancelled"}
                        >
                          Reschedule
                        </Button>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleViewDetailsClick(booking)
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* View Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] w-[95vw] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>Complete information about this booking.</DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="grid gap-6 py-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border border-border">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {(selectedBooking.client || '').split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-base font-medium">{selectedBooking.client}</h3>
                    <p className="text-sm text-muted-foreground">{selectedBooking.property || ''}</p>
                  </div>
                </div>
                <Badge className={getStatusClass(selectedBooking.status)}>
                  <span className="flex items-center gap-1">
                    {getStatusIcon(selectedBooking.status)}
                    {selectedBooking.status}
                  </span>
                </Badge>
              </div>

              {/* Client Communication Section */}
              <div className="">
                {/* Client Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <div className="flex items-center justify-between p-2 border rounded-md">
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-blue-600" />
                      <span className="text-sm">{selectedBooking.phone}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6" 
                        title="Copy phone number"
                        onClick={() => handleCopyClientInfo(selectedBooking, 'phone')}
                      >
                        <Copy className="h-3 w-3 text-muted-foreground" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6" 
                        title="Call client"
                        onClick={() => handleContactClient(selectedBooking, 'call')}
                      >
                        <Phone className="h-3 w-3 text-blue-600" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 border rounded-md">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-purple-600" />
                      <span className="text-sm truncate max-w-[120px]">{selectedBooking.email}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6" 
                        title="Copy email"
                        onClick={() => handleCopyClientInfo(selectedBooking, 'email')}
                      >
                        <Copy className="h-3 w-3 text-muted-foreground" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6" 
                        title="Send email"
                        onClick={() => handleSendEmail(selectedBooking, 'general')}
                      >
                        <Mail className="h-3 w-3 text-purple-600" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 border rounded-md">
                    <div className="flex items-center">
                      <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
                      <span className="text-sm">WhatsApp</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      title="Contact via WhatsApp"
                      onClick={() => handleContactClient(selectedBooking, 'whatsapp')}
                    >
                      <MessageCircle className="h-3 w-3 text-green-600" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Booking Progress Section */}
              <div className="rounded-md border">
                <div className="bg-muted/50 p-3 border-b flex items-center justify-between">
                  <h4 className="text-sm font-medium">Booking Progress</h4>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="ml-2"
                    disabled={selectedBooking?.status === 'Cancelled' || selectedBooking?.canceled || cancelBookingLoading}
                    onClick={async () => {
                      if (!selectedBooking) return;
                      setCancelBookingLoading(true);
                      try {
                        const res = await fetch(`/api/orders/${selectedBooking.id}/status`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ canceled: true, status: 'Cancelled' }),
                        });
                        if (res.ok) {
                          const updated = await res.json();
                          setSelectedBooking((prev) => prev && prev.id === updated.id ? { ...prev, ...updated } : prev);
                          setBookings((prev) => prev.map((b) => b.id === updated.id ? { ...b, ...updated } : b));
                          toast({
                            title: 'Booking cancelled',
                            description: `The booking for ${selectedBooking.client} has been cancelled.`,
                            variant: 'destructive',
                          });
                        } else {
                          toast({
                            title: 'Error',
                            description: 'Failed to cancel booking',
                            variant: 'destructive',
                          });
                        }
                      } catch (err) {
                        toast({
                          title: 'Error',
                          description: 'Failed to cancel booking',
                          variant: 'destructive',
                        });
                      } finally {
                        setCancelBookingLoading(false);
                      }
                    }}
                  >
                    {selectedBooking?.canceled ? 'Cancelled' : 'Cancel'}
                  </Button>
                </div>
                
                <div className="p-4">
                  {/* Progress Timeline */}
                  <div className="relative mb-4">
                    <div className="absolute h-0.5 bg-border w-full top-4"></div>
                    <div className="relative flex justify-between">
                      {(() => {
                        const { pending, contacted, confirmed, paid, completed } = getBookingStatusFlags(selectedBooking)
                        return (
                          <>
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${pending ? 'bg-amber-100 text-amber-600 border-2 border-amber-300' : 'bg-muted text-muted-foreground'}`}>
                                <Clock className="h-4 w-4" />
                              </div>
                              <span className="text-xs mt-1">Pending</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${contacted ? 'bg-blue-100 text-blue-600 border-2 border-blue-300' : 'bg-muted text-muted-foreground'}`}>
                                <MessageCircle className="h-4 w-4" />
                              </div>
                              <span className="text-xs mt-1">Contacted</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${confirmed ? 'bg-green-100 text-green-600 border-2 border-green-300' : 'bg-muted text-muted-foreground'}`}>
                                <Check className="h-4 w-4" />
                              </div>
                              <span className="text-xs mt-1">Confirmed</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${paid ? 'bg-purple-100 text-purple-600 border-2 border-purple-300' : 'bg-muted text-muted-foreground'}`}>
                                <DollarSign className="h-4 w-4" />
                              </div>
                              <span className="text-xs mt-1">Paid</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${completed ? 'bg-teal-100 text-teal-600 border-2 border-teal-300' : 'bg-muted text-muted-foreground'}`}>
                                <CheckCircle2 className="h-4 w-4" />
                              </div>
                              <span className="text-xs mt-1">Completed</span>
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                </div>
                <div className="pl-4 pr-4">
                  {communicationCheckboxes}
                </div>
              </div>

              {/* Visits Section */}
              {selectedBooking?.visit_services_detailed && selectedBooking.visit_services_detailed.length > 0 && (
                <div className="rounded-md border mt-6">
                  <div className="bg-muted/50 p-3 border-b">
                    <h4 className="text-sm font-medium">Visits</h4>
                  </div>
                  <div className="p-4 space-y-3">
                    {selectedBooking.visit_services_detailed.map((visit, idx) => {
                      const visitKey = `${selectedBooking.id}-visit-${visit.visitIndex}`;
                      const checked = visitChecks[visitKey] ?? visit.completed;
                      return (
                        <div
                          key={visitKey}
                          className={`flex items-center justify-between border rounded-md p-3 transition-opacity ${
                            visit.completed || (visitCompletionLoading && visitConfirmModal.visitKey === visitKey) || selectedBooking.canceled || selectedBooking.status === 'Cancelled'
                              ? 'opacity-50 cursor-not-allowed bg-muted/30'
                              : ''
                          }`}
                        >
                          <div>
                            <div className="font-medium text-sm">{visit.title}</div>
                          </div>
                          <Checkbox
                            checked={checked}
                            disabled={visit.completed || (visitCompletionLoading && visitConfirmModal.visitKey === visitKey) || selectedBooking.canceled || selectedBooking.status === 'Cancelled'}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                // Open confirmation modal
                                setVisitConfirmModal({
                                  open: true,
                                  visitKey,
                                  visit,
                                  booking: selectedBooking,
                                });
                              } else {
                                setVisitChecks((prev) => ({ ...prev, [visitKey]: false }));
                              }
                            }}
                            className="h-5 w-5 rounded-md data-[state=checked]:bg-green-500 data-[state=checked]:text-primary-foreground"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Invoice Breakdown Section */}
              {selectedBooking.invoice && (
                <div className="mt-4 border rounded-md overflow-hidden">
                  <div className="bg-muted/30 p-3 border-b flex justify-between items-center">
                    <div className="flex items-center">
                      <Receipt className="h-4 w-4 mr-2 text-muted-foreground" />
                      <h5 className="text-sm font-medium">Invoice Details</h5>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7 px-2 text-xs"
                        onClick={() => handleDownloadInvoice(selectedBooking)}
                      >
                        <Download className="h-3.5 w-3.5 mr-1" />
                        Download PDF
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7 px-2 text-xs"
                        onClick={() => handlePrintInvoice(selectedBooking)}
                      >
                        <Printer className="h-3.5 w-3.5 mr-1" />
                        Print
                      </Button>
                    </div>
                  </div>
                  <div className="p-3 text-sm space-y-4">
                    {/* Client & Property Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <p className="text-muted-foreground text-xs">Client</p>
                        <p className="font-medium">{selectedBooking.client}</p>
                        <p className="text-xs text-muted-foreground">{selectedBooking.email}</p>
                        <p className="text-xs text-muted-foreground">{selectedBooking.phone}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Property</p>
                        <p className="font-medium">{selectedBooking.property}</p>
                      </div>
                    </div>
                    {/* Service Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <p className="text-muted-foreground text-xs">Service Type</p>
                        <p>{selectedBooking.type}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Date & Time</p>
                        <p>{selectedBooking.date ? formatUtcDate(selectedBooking.date) : ''} {selectedBooking.time}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Surface Area</p>
                        <p>{selectedBooking.superficy} m²</p>
                      </div>
                    </div>
                    {/* Invoice Meta */}
                    <div className="flex justify-between mb-3">
                      <div>
                        <p className="text-muted-foreground text-xs">Invoice Number</p>
                        <p className="font-medium">{selectedBooking.invoice.number}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground text-xs">Invoice Date</p>
                        <p>{selectedBooking.invoice.date ? formatUtcDate(selectedBooking.invoice.date) : ''}</p>
                        {/* <p className="text-muted-foreground text-xs">Due Date</p>
                        <p>{selectedBooking.invoice.dueDate ? formatUtcDate(selectedBooking.invoice.dueDate) : ''}</p> */}
                      </div>
                    </div>
                    {/* Invoice Table */}
                    <div className="border-t border-b py-3 my-3">
                      <table className="w-full text-xs">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left pb-2">Description</th>
                            <th className="text-center pb-2">Surface</th>
                            <th className="text-right pb-2">Unit Price</th>
                            <th className="text-right pb-2">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedBooking.invoice.items.map((item, index) => (
                            <React.Fragment key={index}>
                              <tr className="border-t border-border/50">
                                <td className="py-2">{item.description}</td>
                                <td className="text-center py-2">{item.quantity}</td>
                                {/* <td className="text-right py-2">${item.unitPrice}</td> */}
                                {/* <td className="text-right py-2">${item.total}</td> */}
                              </tr>
                              {/* Only render visit sub-rows for the first invoice item */}
                              {index === 0 && selectedBooking.visit_services_detailed && selectedBooking.visit_services_detailed.length > 0 && (
                                selectedBooking.visit_services_detailed.map((visit, vIdx) => (
                                  <tr key={`visit-${visit.visitIndex}`} className="bg-muted/20">
                                    <td className="pl-8 py-1 text-xs text-muted-foreground" colSpan={2}>
                                      Visit {visit.visitIndex + 1}: {visit.serviceType}
                                    </td>
                                    <td className="text-right py-1 text-xs text-muted-foreground">{typeof visit.pricePerMeter === 'number' && !isNaN(visit.pricePerMeter) ? visit.pricePerMeter : 0} MAD</td>
                                    <td className="text-right py-1 text-xs text-muted-foreground">
                                      {(() => {
                                        const price = typeof visit.pricePerMeter === 'number' && !isNaN(visit.pricePerMeter) ? visit.pricePerMeter : 0;
                                        const surface = Number(selectedBooking.superficy) || 0;
                                        return (price && surface) ? Math.round(price * surface) + ' MAD' : '0 MAD';
                                      })()}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Visits Details Section */}
                    {/* {selectedBooking.visit_services_detailed && selectedBooking.visit_services_detailed.length > 0 && (
                      <div className="border rounded-md mb-3">
                        <div className="bg-muted/50 p-2 border-b font-medium text-sm">Visit Details</div>
                        <div className="p-2">
                          <table className="w-full text-xs">
                            <thead>
                              <tr>
                                <th className="text-left pb-1">Visit #</th>
                                <th className="text-left pb-1">Service Type</th>
                                <th className="text-right pb-1">Price Per Meter</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedBooking.visit_services_detailed.map((visit, idx) => (
                                <tr key={visit.visitIndex} className="border-t border-border/50">
                                  <td className="py-1">{visit.visitIndex + 1}</td>
                                  <td className="py-1">{visit.serviceType}</td>
                                  <td className="text-right py-1">{visit.pricePerMeter}MAD</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )} */}
                    {/* Totals */}
                    <div className="flex flex-col items-end gap-1 mb-3">
                      {/* <div className="flex justify-between w-40">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span>{selectedBooking.invoice.subtotal}MAD</span>
                      </div>
                      <div className="flex justify-between w-40">
                        <span className="text-muted-foreground">Tax:</span>
                        <span>{selectedBooking.invoice.tax}MAD</span>
                      </div> */}
                      <div className="flex justify-between w-40 font-medium text-base pt-1 mt-1">
                        <span>Total:</span>
                        <span>{selectedBooking.invoice.subtotal}MAD</span>
                      </div>
                    </div>
                    {/* Payment Status */}
                    <div className="flex justify-between items-center bg-muted/20 p-2 rounded-md">
                      <div>
                        <span className="text-xs text-muted-foreground mr-2">Payment Status:</span>
                        <Badge className={
                          selectedBooking.invoice.paymentStatus === "Paid"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : selectedBooking.invoice.paymentStatus === "Overdue"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        }>
                          {selectedBooking.invoice.paymentStatus}
                        </Badge>
                      </div>
                      <div className="flex items-center">
                        <CreditCard className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                        <span className="text-xs">Bank transfer</span>
                        {/* {selectedBooking.invoice.paymentDate && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({format(parseISO(selectedBooking.invoice.paymentDate), 'PPP')})
                          </span>
                        )} */}
                      </div>
                    </div>
                    {/* Footer Note */}
                    <div className="text-xs text-muted-foreground text-center mt-4">
                      Merci pour votre confiance! Pour toute question, veuillez contacter <span className="underline">mngclean1@gmail.com</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
            {/* <Button 
              variant="destructive" 
              onClick={() => selectedBooking && handleCancelClick(selectedBooking)}
              className="w-full sm:w-auto"
              disabled={selectedBooking?.status === "Cancelled"}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel Booking
            </Button> */}
            <Button variant="outline" onClick={async () => {
              setDetailsOpen(false);
              // Wait for modal to close, then refresh bookings
              setTimeout(() => {
                if (fetchBookingsRef.current) fetchBookingsRef.current();
              }, 300); // Wait for modal animation
            }} className="w-full sm:w-auto">
              Save
            </Button>
            {/* <Button 
              variant="default" 
              onClick={() => selectedBooking && handleSendQuote(selectedBooking)}
              className="w-full sm:w-auto"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Contact Client
            </Button> */}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* New Booking Modal */}
      <Dialog open={newBookingOpen} onOpenChange={handleNewBookingOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] w-[95vw] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Booking</DialogTitle>
            <DialogDescription>Enter the details for the new cleaning service booking.</DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleNewBookingSubmit} className="space-y-6 py-4">
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
                      className={`px-4 py-1 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:z-10 text-sm font-medium ${newBookingUserMode === 'search' ? 'bg-primary text-white shadow' : 'text-muted-foreground hover:bg-accent'}`}
                      onClick={() => setNewBookingUserMode('search')}
                      aria-pressed={newBookingUserMode === 'search'}
                    >
                      Search Users
                    </button>
                    <button
                      type="button"
                      className={`px-4 py-1 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:z-10 text-sm font-medium ${newBookingUserMode === 'new' ? 'bg-primary text-white shadow' : 'text-muted-foreground hover:bg-accent'}`}
                      onClick={() => setNewBookingUserMode('new')}
                      aria-pressed={newBookingUserMode === 'new'}
                    >
                      New User
                    </button>
                  </div>
                </div>
                {newBookingUserMode === 'new' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">First Name <span className="text-red-500">*</span></Label>
                      <Input
                        id="first_name"
                        value={newBooking.first_name}
                        onChange={(e) => setNewBooking({ ...newBooking, first_name: e.target.value })}
                        placeholder="John"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Last Name <span className="text-red-500">*</span></Label>
                      <Input
                        id="last_name"
                        value={newBooking.last_name}
                        onChange={(e) => setNewBooking({ ...newBooking, last_name: e.target.value })}
                        placeholder="Smith"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                      <Input
                        id="email"
                        type="email"
                        value={newBooking.email}
                        onChange={(e) => setNewBooking({ ...newBooking, email: e.target.value })}
                        placeholder="client@example.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
                      <Input
                        id="phone"
                        value={newBooking.phone}
                        onChange={(e) => setNewBooking({ ...newBooking, phone: e.target.value })}
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
                                setNewBooking({
                                  ...newBooking,
                                  first_name: user.first_name,
                                  last_name: user.last_name,
                                  email: user.email,
                                  phone: user.phone,
                                });
                                setUserSearch("");
                                setSelectedUser(user);
                                setNewBookingUserMode('search');
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
                  value={newBooking.propertyAddress}
                  onChange={(e) => setNewBooking({...newBooking, propertyAddress: e.target.value})}
                  placeholder="123 Main Street, City, State, ZIP"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="serviceType">Service Type <span className="text-red-500">*</span></Label>
                  <Select
                    value={newBooking.serviceType}
                    onValueChange={(value) => setNewBooking({ ...newBooking, serviceType: value })}
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
                    value={newBooking.superficy}
                    onChange={(e) => setNewBooking({...newBooking, superficy: e.target.value})}
                    placeholder="100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select
                    value={newBooking.frequency}
                    onValueChange={(value) => {
                      setNewBooking((prev) => {
                        // Reset cleaningTypes array based on frequency
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
                        <SelectItem key={freq} value={freq}>{frequencyLabels[freq] || freq}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Cleaning Type Section - dynamic based on frequency, placed directly under Frequency */}
                {(newBooking.frequency === "one-time" || newBooking.frequency === "weekly") && (
                  <div className="space-y-2">
                    <Label htmlFor="cleaningType">Cleaning Type</Label>
                    <RadioGroup
                      value={newBooking.cleaningType}
                      onValueChange={(value) => setNewBooking({ ...newBooking, cleaningType: value })}
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
                {newBooking.frequency === "bi-weekly" && (
                  <div className="space-y-2">
                    <Label>Cleaning Type (2 Visits)</Label>
                    {[0, 1].map((idx) => (
                      <div key={idx} className="flex items-center space-x-4 mb-2">
                        <span className="text-xs">{idx + 1}.</span>
                        <RadioGroup
                          value={newBooking.cleaningTypes[idx]}
                          onValueChange={(value) => {
                            const updated = [...newBooking.cleaningTypes];
                            updated[idx] = value;
                            setNewBooking({ ...newBooking, cleaningTypes: updated });
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
                {newBooking.frequency === "monthly" && (
                  <div className="space-y-2">
                    <Label>Cleaning Type (4 Visits)</Label>
                    {[0, 1, 2, 3].map((idx) => (
                      <div key={idx} className="flex items-center space-x-4 mb-2">
                        <span className="text-xs">{idx + 1}.</span>
                        <RadioGroup
                          value={newBooking.cleaningTypes[idx]}
                          onValueChange={(value) => {
                            const updated = [...newBooking.cleaningTypes];
                            updated[idx] = value;
                            setNewBooking({ ...newBooking, cleaningTypes: updated });
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
                    aria-pressed={!!newBooking.abonnement}
                    onClick={() => setNewBooking({ ...newBooking, abonnement: !newBooking.abonnement })}
                    className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none ${newBooking.abonnement ? 'bg-green-500' : 'bg-gray-300'}`}
                    style={{ minWidth: 48 }}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${newBooking.abonnement ? 'translate-x-6' : 'translate-x-1'}`}
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
                        {newBooking.date ? format(newBooking.date, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarUI 
                        mode="single" 
                        selected={newBooking.date} 
                        onSelect={(date) => setNewBooking({...newBooking, date: date || new Date()})} 
                        initialFocus 
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timeSlot">Time Slot <span className="text-red-500">*</span></Label>
                  <Select 
                    value={newBooking.timeSlot}
                    onValueChange={(value) => setNewBooking({...newBooking, timeSlot: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time slot" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map(slot => (
                        <SelectItem key={slot} value={slot}>
                          {slot}
                        </SelectItem>
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
                  value={newBooking.notes}
                  onChange={(e) => setNewBooking({...newBooking, notes: e.target.value})}
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
              <span className="font-bold text-lg">${livePrice}</span>
            </div>
            <DialogFooter className="pt-4">
              <Button variant="outline" type="button" onClick={() => setNewBookingOpen(false)} disabled={submitLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitLoading}>
                {submitLoading ? "Creating..." : "Create Booking"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reschedule Modal */}
      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reschedule Booking</DialogTitle>
            <DialogDescription>
              Change the date and time for this booking.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>New Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {rescheduleData.date ? format(rescheduleData.date, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarUI 
                    mode="single" 
                    selected={rescheduleData.date} 
                    onSelect={(date) => setRescheduleData({...rescheduleData, date: date || new Date()})} 
                    initialFocus 
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timeSlot">New Time Slot</Label>
              <Select 
                value={rescheduleData.timeSlot}
                onValueChange={(value) => setRescheduleData({...rescheduleData, timeSlot: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time slot" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map(slot => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Rescheduling</Label>
              <Textarea 
                id="reason" 
                value={rescheduleData.reason}
                onChange={(e) => setRescheduleData({...rescheduleData, reason: e.target.value})}
                placeholder="Explain why this booking needs to be rescheduled..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRescheduleSubmit}>
              Reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Modal */}
      <AlertDialog open={cancelConfirmOpen} onOpenChange={setCancelConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Cancel Booking
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this booking? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="cancelReason">Reason for Cancellation</Label>
              <Textarea 
                id="cancelReason" 
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please provide a reason for cancellation..."
                rows={3}
              />
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel>No, Keep Booking</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCancelSubmit}
              className="bg-red-500 hover:bg-red-600"
            >
              Yes, Cancel Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Visit Completion Confirmation Modal */}
      <Dialog open={visitConfirmModal.open} onOpenChange={(open) => {
        if (!open) setVisitConfirmModal({ open: false, visitKey: null, visit: null, booking: null });
      }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Mark Visit as Completed?</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark this visit as completed? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="font-medium text-sm mb-2">{visitConfirmModal.visit?.title}</div>
            <div className="text-xs text-muted-foreground">
              {(() => {
                const v = visitConfirmModal.visit;
                if (!v?.date) return '';
                let formatted = '';
                try {
                  if (typeof v.date === 'string' && v.date.length > 10) {
                    formatted = format(parseISO(v.date), 'PPP');
                  } else {
                    formatted = format(new Date(v.date), 'PPP');
                  }
                } catch {
                  formatted = v.date;
                }
                return `Date: ${formatted}` + (v.time ? `, Time: ${v.time}` : '');
              })()}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVisitConfirmModal({ open: false, visitKey: null, visit: null, booking: null })} disabled={visitCompletionLoading}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!visitConfirmModal.booking || !visitConfirmModal.visitKey || !visitConfirmModal.visit) return;
                setVisitCompletionLoading(true);
                const { booking, visit, visitKey } = visitConfirmModal;
                // Find all visits for this booking
                const allVisits = booking.visit_services_detailed || [];
                // If only one visit, or this is the last incomplete visit, set completed
                const isOnlyVisit = allVisits.length === 1;
                const incompleteVisits = allVisits.filter(v => !v.completed && v.visitIndex !== visit.visitIndex);
                const isLastOrOnly = isOnlyVisit || incompleteVisits.length === 0;
                // Prepare updated visits array
                const updatedVisits = allVisits.map(v =>
                  v.visitIndex === visit.visitIndex ? { ...v, completed: true } : v
                );
                // Prepare payload
                const payload: any = {
                  visit_services_detailed: updatedVisits,
                };
                if (isLastOrOnly) {
                  payload.completed = true;
                }
                // PATCH request
                const res = await fetch(`/api/orders/${booking.id}/status`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload),
                });
                if (res.ok) {
                  setVisitChecks((prev) => ({ ...prev, [visitKey]: true }));
                  const updated = await res.json();
                  setSelectedBooking(prev => prev && prev.id === updated.id ? { ...prev, ...updated } : prev);
                  setBookings(prev => prev.map(b => b.id === updated.id ? { ...b, ...updated } : b));
                }
                setVisitCompletionLoading(false);
                setVisitConfirmModal({ open: false, visitKey: null, visit: null, booking: null });
              }}
              disabled={visitCompletionLoading}
            >
              {visitCompletionLoading ? 'Saving...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Progress Confirmation Modal */}
      <Dialog open={progressConfirmModal.open} onOpenChange={(open) => {
        if (!open) setProgressConfirmModal({ open: false, field: null, booking: null });
      }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Mark as {progressConfirmModal.field ? progressConfirmModal.field.charAt(0).toUpperCase() + progressConfirmModal.field.slice(1) : ''}?</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark this booking as {progressConfirmModal.field}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProgressConfirmModal({ open: false, field: null, booking: null })} disabled={progressLoading}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!progressConfirmModal.booking || !progressConfirmModal.field) return;
                setProgressLoading(true);
                const { booking, field } = progressConfirmModal;
                const res = await fetch(`/api/orders/${booking.id}/status`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ [field]: true }),
                });
                if (res.ok) {
                  const updated = await res.json();
                  // Merge updated fields into the existing booking to preserve all fields
                  setSelectedBooking(prev => prev && prev.id === updated.id ? { ...prev, ...updated } : prev);
                  setBookings(prev => prev.map(b => b.id === updated.id ? { ...b, ...updated } : b));
                }
                setProgressLoading(false);
                setProgressConfirmModal({ open: false, field: null, booking: null });
              }}
              disabled={progressLoading}
            >
              {progressLoading ? 'Saving...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Discard Confirmation Modal */}
      <AlertDialog open={showDiscardModal} onOpenChange={setShowDiscardModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to discard them?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDiscard}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDiscard} className="bg-red-500 hover:bg-red-600">Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  )
}

