import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// You may want to use env vars for these
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET() {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('title');
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data || []);
} 