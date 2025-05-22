import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  // Fetch orders and join with profile
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      *,
      profiles:profiles!user_id(id, first_name, last_name, email, phone)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Supabase error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Transform orders for the UI
  const bookings = (orders || []).map((order: any) => {
    // Robustly parse surface (quantity)
    let superficy = 1;
    if (order.surface !== undefined && order.surface !== null) {
      const parsed = Number(order.surface);
      superficy = isNaN(parsed) ? 1 : parsed;
    }
    // Use order_number if available for invoice number
    const invoiceNumber = order.order_number
      ? `INV-${order.order_number}`
      : `INV-${order.id?.toString().slice(-6) || Math.floor(Math.random()*1000000)}`;
    // Dates
    const createdAt = order.created_at ? new Date(order.created_at) : new Date();
    const invoiceDate = createdAt.toISOString().slice(0,10);
    const dueDate = new Date(createdAt.getTime() + 14*24*60*60*1000).toISOString().slice(0,10);
    // Service description
    const serviceDesc = order.service_title || 'Cleaning Service';
    // Price
    const subtotal = order.total_price !== undefined && order.total_price !== null ? Number(order.total_price) : 100;
    const unitPrice = superficy > 0 ? Math.round((subtotal / superficy) * 100) / 100 : subtotal;
    const tax = Math.round(subtotal * 0.2 * 100) / 100; // 20% tax
    const total = subtotal + tax;
    // Payment status
    const paid = order.status === 'paid' || order.paid === true;
    const paymentStatus = paid ? 'Paid' : 'Unpaid';
    const paymentDate = paid ? (order.updated_at ? new Date(order.updated_at).toISOString().slice(0,10) : invoiceDate) : undefined;
    const paymentMethod = paid ? 'Card' : 'Unpaid';
    // Invoice object
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
      created_at: order.created_at,
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
  });

  return NextResponse.json(bookings)
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Validate required fields
    const requiredFields = [
      'user_id', 'service_id', 'service_title', 'selected_frequency', 'visit_services_detailed',
      'surface', 'dates', 'time', 'address', 'total_price', 'status'
    ];
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }
    // Insert order
    const { data, error } = await supabase
      .from('orders')
      .insert([{ ...body }])
      .select()
      .single();
    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/orders error:', err);
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
  }
} 