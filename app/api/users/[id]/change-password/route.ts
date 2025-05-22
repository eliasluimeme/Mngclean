import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth.server';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const { id, currentPassword, newPassword } = await req.json();
    console.log("session", session, "id ", id)
    if (!session || session.user.id !== id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    // Fetch user
    const { data: user, error } = await supabase
      .from('profiles')
      .select('id, password')
      .eq('id', id)
      .single();
    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    // Check current password (plaintext or hash)
    console.log("password ", user.password, currentPassword, newPassword)
    // if (user.password !== currentPassword) {
    const passwordMatch = user.password && (await bcrypt.compare(currentPassword, user.password));
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
    }
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    // Update password
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ password: hashedPassword })
      .eq('id', id);
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to change password' }, { status: 500 });
  }
} 