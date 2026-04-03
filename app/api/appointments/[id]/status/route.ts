import { NextResponse } from "next/server";
import { requireAdminApiAccess } from "@/lib/admin-api";
import { supabase } from "@/lib/supabase-server";
import { getLegacyDbStatusCandidate, isAppointmentStatusConstraintError } from "@/lib/appointments/status";
import { getAppointmentById, getSlotAppointments } from "@/lib/appointments/server";
import { canTransitionStatus, getAllowedStatusTransitions, isAppointmentStatus, validateCapacity, validateWorkerCount } from "@/lib/appointments/validators";
import type { AppointmentStatus } from "@/lib/appointments/types";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const authError = await requireAdminApiAccess();
  if (authError) {
    return authError;
  }

  try {
    const { id } = await context.params;
    const body = await request.json();

    const nextStatus = body.status;
    if (typeof nextStatus !== "string" || !isAppointmentStatus(nextStatus)) {
      return NextResponse.json({ error: "Invalid status value." }, { status: 400 });
    }

    const currentAppointment = await getAppointmentById(id);
    if (!currentAppointment) {
      return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
    }

    if (!canTransitionStatus(currentAppointment.status, nextStatus as AppointmentStatus)) {
      const allowedTransitions = getAllowedStatusTransitions(currentAppointment.status)
        .map((status) => status.replace("_", " "))
        .join(", ");

      return NextResponse.json(
        {
          error: `Invalid status transition from ${currentAppointment.status} to ${nextStatus}. Allowed: ${allowedTransitions}.`,
        },
        { status: 400 },
      );
    }

    if (["scheduled", "on_site", "pending_review", "completed"].includes(nextStatus)) {
      const workerCountError = validateWorkerCount(currentAppointment.service_type, currentAppointment.worker_ids);
      if (workerCountError) {
        return NextResponse.json({ error: workerCountError }, { status: 400 });
      }
    }

    if (nextStatus !== "cancelled") {
      const slotAppointments = await getSlotAppointments(
        currentAppointment.scheduled_date,
        currentAppointment.timeslot,
        id,
      );
      const capacityError = validateCapacity(slotAppointments, currentAppointment.service_type);
      if (capacityError) {
        return NextResponse.json({ error: capacityError }, { status: 400 });
      }
    }

    let updateResult = await supabase.from("appointments").update({ status: nextStatus }).eq("id", id);

    if (updateResult.error && isAppointmentStatusConstraintError(updateResult.error)) {
      const legacyStatus = getLegacyDbStatusCandidate(nextStatus as AppointmentStatus);

      if (legacyStatus) {
        updateResult = await supabase.from("appointments").update({ status: legacyStatus }).eq("id", id);
      }
    }

    if (updateResult.error) {
      if (isAppointmentStatusConstraintError(updateResult.error)) {
        return NextResponse.json(
          {
            error:
              "Appointment status constraint is outdated in the database. Apply the latest appointments status migration.",
          },
          { status: 500 },
        );
      }

      return NextResponse.json({ error: updateResult.error.message }, { status: 500 });
    }

    const updatedAppointment = await getAppointmentById(id);
    return NextResponse.json(updatedAppointment);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to update appointment status." }, { status: 500 });
  }
}
