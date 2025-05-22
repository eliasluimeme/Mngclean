import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET: List all staff
export async function GET() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*, team_members:team_members(team_id, team:teams(name))")
    .eq("staff", true);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST: Add new staff
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { data, error } = await supabase.from("profiles").insert([body]).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
} 