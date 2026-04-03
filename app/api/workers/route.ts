import { NextResponse } from "next/server";
import { requireAdminApiAccess } from "@/lib/admin-api";
import { supabase } from "@/lib/supabase-server";
import type { WorkerStatus } from "@/lib/appointments/types";

const WORKER_STATUSES: WorkerStatus[] = ["available", "on_site", "off_duty"];

function isWorkerStatus(value: string): value is WorkerStatus {
  return WORKER_STATUSES.includes(value as WorkerStatus);
}

export async function GET(request: Request) {
  const authError = await requireAdminApiAccess();
  if (authError) {
    return authError;
  }

  const { searchParams } = new URL(request.url);
  const activeOnly = searchParams.get("active") === "true";

  let query = supabase.from("workers").select("*").order("created_at", { ascending: true });

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

export async function POST(request: Request) {
  const authError = await requireAdminApiAccess();
  if (authError) {
    return authError;
  }

  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!name) {
      return NextResponse.json({ error: "Worker name is required." }, { status: 400 });
    }

    const status = typeof body.status === "string" && isWorkerStatus(body.status) ? body.status : "available";

    const payload = {
      name,
      avatar_url: typeof body.avatar_url === "string" && body.avatar_url.trim() ? body.avatar_url.trim() : null,
      phone: typeof body.phone === "string" && body.phone.trim() ? body.phone.trim() : null,
      is_active: typeof body.is_active === "boolean" ? body.is_active : true,
      status,
    };

    const { data, error } = await supabase.from("workers").insert(payload).select("*").single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
}
