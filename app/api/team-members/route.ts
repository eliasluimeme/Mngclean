import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST: Assign a user to a team
export async function POST(req: NextRequest) {
  const { user_id, team_id } = await req.json();
  if (!user_id || !team_id) {
    return NextResponse.json({ error: "Missing user_id or team_id" }, { status: 400 });
  }
  const { error } = await supabase.from("team_members").insert({ user_id, team_id });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
} 