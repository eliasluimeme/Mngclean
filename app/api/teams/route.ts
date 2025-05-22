import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  // Fetch teams with their members (profiles)
  const { data, error } = await supabase
    .from("teams")
    .select("id, name, team_members(user_id, profiles(id, first_name, last_name, email))")
    .order("name")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Format members for each team
  const teams = (data || []).map((team: any) => ({
    id: team.id,
    name: team.name,
    members: (team.team_members || []).map((tm: any) => {
      const p = tm.profiles
      return p ? { id: p.id, first_name: p.first_name, last_name: p.last_name, email: p.email } : null
    }).filter(Boolean)
  }))

  return NextResponse.json({ teams })
}

export async function POST(req: Request) {
  try {
    const { name, members } = await req.json()
    if (!name || !Array.isArray(members)) {
      return NextResponse.json({ error: "Missing team name or members." }, { status: 400 })
    }
    // Check for duplicate team name
    const { data: existing, error: checkError } = await supabase
      .from("teams")
      .select("id")
      .eq("name", name)
      .maybeSingle()
    if (checkError) {
      return NextResponse.json({ error: checkError.message }, { status: 500 })
    }
    if (existing) {
      return NextResponse.json({ error: "A team with this name already exists." }, { status: 409 })
    }
    // Insert team
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .insert({ name })
      .select("id, name")
      .single()
    if (teamError || !team) {
      return NextResponse.json({ error: teamError?.message || "Failed to create team." }, { status: 500 })
    }
    // Insert team members
    if (members.length > 0) {
      const memberRows = members.map((user_id: string) => ({ team_id: team.id, user_id }))
      const { error: membersError } = await supabase.from("team_members").insert(memberRows)
      if (membersError) {
        return NextResponse.json({ error: "Failed to add one or more members to the team." }, { status: 500 })
      }
    }
    return NextResponse.json({ team })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create team." }, { status: 500 })
  }
} 