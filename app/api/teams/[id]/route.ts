import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function PUT(req: Request) {
  try {
    const { id: teamId, name, members } = await req.json()
    if (!teamId || !name || !Array.isArray(members)) {
      return NextResponse.json({ error: "Missing team id, name, or members." }, { status: 400 })
    }
    // Check for duplicate team name (exclude current team)
    const { data: existing, error: checkError } = await supabase
      .from("teams")
      .select("id")
      .eq("name", name)
      .neq("id", teamId)
      .maybeSingle()
    if (checkError) {
      return NextResponse.json({ error: checkError.message }, { status: 500 })
    }
    if (existing) {
      return NextResponse.json({ error: "A team with this name already exists." }, { status: 409 })
    }
    // Update team name
    const { error: updateError } = await supabase
      .from("teams")
      .update({ name })
      .eq("id", teamId)
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }
    // Fetch current members
    const { data: currentMembers, error: fetchError } = await supabase
      .from("team_members")
      .select("user_id")
      .eq("team_id", teamId)
    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }
    const currentIds = (currentMembers || []).map((m: any) => m.user_id)
    // Calculate members to add and remove
    const toAdd = members.filter((id: string) => !currentIds.includes(id))
    const toRemove = currentIds.filter((id: string) => !members.includes(id))
    // Add new members
    if (toAdd.length > 0) {
      const addRows = toAdd.map((user_id: string) => ({ team_id: teamId, user_id }))
      const { error: addError } = await supabase.from("team_members").insert(addRows)
      if (addError) {
        return NextResponse.json({ error: "Failed to add one or more members to the team." }, { status: 500 })
      }
    }
    // Remove old members
    if (toRemove.length > 0) {
      const { error: removeError } = await supabase
        .from("team_members")
        .delete()
        .eq("team_id", teamId)
        .in("user_id", toRemove)
      if (removeError) {
        return NextResponse.json({ error: "Failed to remove one or more members from the team." }, { status: 500 })
      }
    }
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update team." }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { id: teamId } = await req.json()
    if (!teamId) {
      return NextResponse.json({ error: "Missing team id." }, { status: 400 })
    }
    // Delete all team_members for this team
    const { error: membersError } = await supabase
      .from("team_members")
      .delete()
      .eq("team_id", teamId)
    if (membersError) {
      return NextResponse.json({ error: "Failed to remove team members." }, { status: 500 })
    }
    // Delete the team
    const { error: teamError } = await supabase
      .from("teams")
      .delete()
      .eq("id", teamId)
    if (teamError) {
      return NextResponse.json({ error: "Failed to delete team." }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete team." }, { status: 500 })
  }
} 