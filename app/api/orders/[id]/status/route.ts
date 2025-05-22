import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const updates = await req.json()

  // Determine if a status boolean is being set to true, and set the status field accordingly
  let statusUpdate = {}
  if (updates.contacted === true) statusUpdate = { status: 'contacted' }
  if (updates.confirmed === true) statusUpdate = { status: 'confirmed' }
  if (updates.paid === true) statusUpdate = { status: 'paid' }
  if (updates.completed === true) statusUpdate = { status: 'completed' }
  if (updates.pending === true) statusUpdate = { status: 'pending' }

  const { data, error } = await supabase
    .from('orders')
    .update({ ...updates, ...statusUpdate })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Supabase update error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Fetch the full booking with joined client info
  const { data: fullOrder, error: fetchError } = await supabase
    .from('orders')
    .select('*, profiles(first_name, last_name, email, phone)')
    .eq('id', id)
    .single()

  if (fetchError) {
    console.error('Supabase fetch error:', fetchError)
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  // Transform to include 'client' string
  const client = [fullOrder.profiles?.first_name, fullOrder.profiles?.last_name].filter(Boolean).join(' ') || ''
  const response = {
    ...fullOrder,
    client,
    email: fullOrder.profiles?.email || '',
    phone: fullOrder.profiles?.phone || '',
    service_title: fullOrder.service_title || '',
  }

  return NextResponse.json(response)
} 