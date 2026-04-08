import { NextResponse } from "next/server";
import { requireAdminApiAccess } from "@/lib/admin-api";
import {
  getAppointmentSettings,
  updateAppointmentSettings,
} from "@/lib/appointments/settings";
import type {
  AppointmentSettings,
  ServiceWorkerRequirements,
} from "@/lib/appointments/types";

function parsePositiveInteger(value: unknown, fieldLabel: string): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error(`${fieldLabel} must be a positive number.`);
  }

  return Math.floor(parsed);
}

export async function GET() {
  const authError = await requireAdminApiAccess();
  if (authError) {
    return authError;
  }

  try {
    const settings = await getAppointmentSettings();
    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch appointment settings." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const authError = await requireAdminApiAccess();
  if (authError) {
    return authError;
  }

  try {
    const body = await request.json();
    const nextSettings: Partial<AppointmentSettings> = {};

    if (Object.prototype.hasOwnProperty.call(body, "service_worker_requirements")) {
      const requirements = body.service_worker_requirements;

      if (!requirements || typeof requirements !== "object") {
        return NextResponse.json(
          { error: "service_worker_requirements must be an object." },
          { status: 400 },
        );
      }

      const nextRequirements: Partial<ServiceWorkerRequirements> = {};

      if (Object.prototype.hasOwnProperty.call(requirements, "grand")) {
        nextRequirements.grand = parsePositiveInteger(requirements.grand, "Grand Menage workers");
      }

      if (Object.prototype.hasOwnProperty.call(requirements, "petit")) {
        nextRequirements.petit = parsePositiveInteger(requirements.petit, "Petit Menage workers");
      }

      if (Object.keys(nextRequirements).length === 0) {
        return NextResponse.json(
          { error: "At least one worker requirement must be provided." },
          { status: 400 },
        );
      }

      nextSettings.service_worker_requirements = nextRequirements as ServiceWorkerRequirements;
    }

    if (Object.prototype.hasOwnProperty.call(body, "total_slot_capacity")) {
      nextSettings.total_slot_capacity = parsePositiveInteger(
        body.total_slot_capacity,
        "Total slot capacity",
      );
    }

    if (Object.keys(nextSettings).length === 0) {
      return NextResponse.json(
        {
          error:
            "No valid settings fields provided. Use service_worker_requirements and/or total_slot_capacity.",
        },
        { status: 400 },
      );
    }

    const updatedSettings = await updateAppointmentSettings(nextSettings);
    return NextResponse.json(updatedSettings);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to update appointment settings." },
      { status: 500 },
    );
  }
}
