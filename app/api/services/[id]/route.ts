import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function PATCH(req: Request) {
  try {
    const { id, prices } = await req.json()
    if (!id || !prices) {
      return NextResponse.json({ error: "Missing service id or prices." }, { status: 400 })
    }
    const { error } = await supabase
      .from("services")
      .update({ prices })
      .eq("id", id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update prices." }, { status: 500 })
  }
} 