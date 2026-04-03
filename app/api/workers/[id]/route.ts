import { NextResponse } from "next/server";
import { requireAdminApiAccess } from "@/lib/admin-api";
import { supabase } from "@/lib/supabase-server";
import type { WorkerStatus } from "@/lib/appointments/types";

const WORKER_STATUSES: WorkerStatus[] = ["available", "on_site", "off_duty"];

function isWorkerStatus(value: string): value is WorkerStatus {
  return WORKER_STATUSES.includes(value as WorkerStatus);
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const authError = await requireAdminApiAccess();
  if (authError) {
    return authError;
  }

  try {
    const { id } = await context.params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Worker id is required." }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};

    if (typeof body.name === "string") updates.name = body.name.trim();
    if (typeof body.avatar_url === "string" || body.avatar_url === null) {
      updates.avatar_url = body.avatar_url && String(body.avatar_url).trim() ? String(body.avatar_url).trim() : null;
    }
    if (typeof body.phone === "string" || body.phone === null) {
      updates.phone = body.phone && String(body.phone).trim() ? String(body.phone).trim() : null;
    }
    if (typeof body.is_active === "boolean") updates.is_active = body.is_active;
    if (typeof body.status === "string") {
      if (!isWorkerStatus(body.status)) {
        return NextResponse.json({ error: "Invalid worker status." }, { status: 400 });
      }
      updates.status = body.status;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields provided." }, { status: 400 });
    }

    const { data, error } = await supabase.from("workers").update(updates).eq("id", id).select("*").single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const authError = await requireAdminApiAccess();
  if (authError) {
    return authError;
  }

  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: "Worker id is required." }, { status: 400 });
  }

  const { error } = await supabase.from("workers").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
