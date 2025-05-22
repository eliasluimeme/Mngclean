import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, first_name, last_name, email, phone, role, staff, team_id } = body;
    if (!id || !first_name || !last_name || !email || !phone || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    // Update profile
    const { data: updateData, error: updateError } = await supabase
      .from('profiles')
      .update({ first_name, last_name, email, phone, role, })
      .eq('id', id)
      .select()
      .single();
    console.log('UPDATE RESULT:', updateData, updateError);
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    if (!updateData) {
      return NextResponse.json({ error: 'No user found with this id' }, { status: 404 });
    }
    // Handle team assignment if provided
    if (team_id) {
      const { error: upsertError } = await supabase
        .from('team_members')
        .update({ team_id })
        .eq('user_id', id);
      if (upsertError) {
        return NextResponse.json({ error: upsertError.message }, { status: 500 });
      }
    }
    const { password, ...updateDataWithoutPassword } = updateData;
    return NextResponse.json({ success: true, updated: updateDataWithoutPassword });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update staff' }, { status: 500 });
  }
} 