import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query') || '';
  const staff = searchParams.get('staff');

  if (!query && staff === 'true') {
    // Fetch only staff users
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, phone, staff')
      .eq('staff', true);
    if (error) {
      return NextResponse.json([], { status: 500 });
    }
    return NextResponse.json(data || []);
  }

  if (!query) {
    // Fetch all users
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, phone, staff, admin, role');
    if (error) {
      return NextResponse.json([], { status: 500 });
    }
    return NextResponse.json(data || []);
  }

  // Search in profiles table
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email, phone, staff, admin, role')
    .or([
      `first_name.ilike.%${query}%`,
      `last_name.ilike.%${query}%`,
      `email.ilike.%${query}%`,
      `phone.ilike.%${query}%`
    ].join(','));

  if (error) {
    return NextResponse.json([], { status: 500 });
  }

  return NextResponse.json(data || []);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { first_name, last_name, email, phone } = body;
    if (!first_name || !last_name || !email || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const { data, error } = await supabase
      .from('profiles')
      .insert([{ first_name, last_name, email, phone }])
      .select('id, first_name, last_name, email, phone')
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create user' }, { status: 500 });
  }
} 