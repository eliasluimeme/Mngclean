import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  // Fetch all orders with profile info
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`*, profiles:profiles!user_id(id, first_name, last_name, email, phone)`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Supabase error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const now = new Date()
  const todayStr = now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-' +
    String(now.getDate()).padStart(2, '0');
  const upcoming = (orders || []).map((order: any) => {
    if (order.completed === true || order.status === 'completed') return null
    const visits = order.visit_services_detailed || []
    // Filter visits for today or future and not completed
    const filteredVisits = visits.filter((visit: any) => {
      if (!visit.date || visit.completed) return false
      const visitDateStr = visit.date.slice(0, 10)
      return visitDateStr >= todayStr
    })
    if (filteredVisits.length === 0) return null
    return { ...order, visit_services_detailed: filteredVisits }
  }).filter(Boolean)

  // Transform for UI (same as in main route)
  const bookings = upcoming.map((order: any) => {
    let superficy = 1;
    if (order.surface !== undefined && order.surface !== null) {
      const parsed = Number(order.surface);
      superficy = isNaN(parsed) ? 1 : parsed;
    }
    const invoiceNumber = order.order_number
      ? `INV-${order.order_number}`
      : `INV-${order.id?.toString().slice(-6) || Math.floor(Math.random()*1000000)}`;
    const createdAt = order.created_at ? new Date(order.created_at) : new Date();
    const invoiceDate = createdAt.toISOString().slice(0,10);
    const dueDate = new Date(createdAt.getTime() + 14*24*60*60*1000).toISOString().slice(0,10);
    const serviceDesc = order.service_title || 'Cleaning Service';
    const subtotal = order.total_price !== undefined && order.total_price !== null ? Number(order.total_price) : 100;
    const unitPrice = superficy > 0 ? Math.round((subtotal / superficy) * 100) / 100 : subtotal;
    const tax = Math.round(subtotal * 0.2 * 100) / 100;
    const total = subtotal + tax;
    const paid = order.status === 'paid' || order.paid === true;
    const paymentStatus = paid ? 'Paid' : 'Unpaid';
    const paymentDate = paid ? (order.updated_at ? new Date(order.updated_at).toISOString().slice(0,10) : invoiceDate) : undefined;
    const paymentMethod = paid ? 'Card' : 'Unpaid';
    const invoice = {
      number: invoiceNumber,
      date: invoiceDate,
      dueDate: dueDate,
      items: [
        {
          description: serviceDesc,
          quantity: superficy,
          unitPrice,
          total: subtotal,
        },
      ],
      subtotal,
      tax,
      total,
      paymentMethod,
      paymentStatus,
      paymentDate,
    };
    return ({
      id: order.id,
      contacted: !!order.contacted,
      confirmed: !!order.confirmed,
      paid: !!order.paid,
      client: order.profiles
        ? [order.profiles.first_name, order.profiles.last_name].filter(Boolean).join(' ')
        : '',
      email: order.profiles?.email || '',
      phone: order.profiles?.phone || '',
      property: order.address || '',
      type: order.service_title || '',
      service_title: order.service_title || '',
      date: Array.isArray(order.dates) ? order.dates[0] : (order.dates ? (Array.isArray(order.dates) ? order.dates[0] : (typeof order.dates === 'string' ? JSON.parse(order.dates)[0] : '')) : ''),
      time: order.time || '',
      status: order.status || '',
      notes: order.notes || '',
      frequency: order.selected_frequency || '',
      superficy: order.surface || '',
      assignedTo: '',
      price: subtotal,
      pending: !!order.pending || order.status === 'pending',
      completed: !!order.completed || order.status === 'completed',
      reminded: false,
      history: [],
      invoice,
      visit_services_detailed: order.visit_services_detailed || [],
    });
  })

  return NextResponse.json(bookings)
} 