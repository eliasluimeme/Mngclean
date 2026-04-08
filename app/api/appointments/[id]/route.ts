import { NextResponse } from "next/server";
import { requireAdminApiAccess } from "@/lib/admin-api";
import { supabase } from "@/lib/supabase-server";
import { isMissingAppointmentTimeColumnError } from "@/lib/appointments/db-errors";
import { getAppointmentSettings } from "@/lib/appointments/settings";
import { getAppointmentById, getSlotAppointments, getUnavailableWorkerIds } from "@/lib/appointments/server";
import { ensureTimeRange, normalizeTimeString } from "@/lib/appointments/time";
import {
  isAppointmentStatus,
  isServiceType,
  isTimeslot,
  normalizeWorkerIds,
  validateCapacity,
  validateWorkerCount,
} from "@/lib/appointments/validators";
import type { AppointmentStatus } from "@/lib/appointments/types";

const STATUSES_REQUIRING_ASSIGNMENT: AppointmentStatus[] = [
  "scheduled",
  "on_site",
  "pending_review",
  "completed",
];

function requiresStrictAssignment(status: AppointmentStatus): boolean {
  return STATUSES_REQUIRING_ASSIGNMENT.includes(status);
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const authError = await requireAdminApiAccess();
  if (authError) {
    return authError;
  }

  try {
    const { id } = await context.params;
    const body = await request.json();

    const existingAppointment = await getAppointmentById(id);
    if (!existingAppointment) {
      return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
    }

    if (body.service_type !== undefined && (!isServiceType(body.service_type) || typeof body.service_type !== "string")) {
      return NextResponse.json({ error: "Invalid service type." }, { status: 400 });
    }

    if (body.timeslot !== undefined && (!isTimeslot(body.timeslot) || typeof body.timeslot !== "string")) {
      return NextResponse.json({ error: "Invalid timeslot." }, { status: 400 });
    }

    if (body.start_time !== undefined && body.start_time !== null && !normalizeTimeString(body.start_time)) {
      return NextResponse.json({ error: "Invalid start time format. Use HH:mm." }, { status: 400 });
    }

    if (body.end_time !== undefined && body.end_time !== null && !normalizeTimeString(body.end_time)) {
      return NextResponse.json({ error: "Invalid end time format. Use HH:mm." }, { status: 400 });
    }

    if (
      body.status !== undefined &&
      (typeof body.status !== "string" || !isAppointmentStatus(body.status))
    ) {
      return NextResponse.json({ error: "Invalid appointment status." }, { status: 400 });
    }

    const nextServiceType = body.service_type ?? existingAppointment.service_type;
    const requestedTimeslot = body.timeslot ?? existingAppointment.timeslot;

    const hasStartTimeUpdate = Object.prototype.hasOwnProperty.call(body, "start_time");
    const hasEndTimeUpdate = Object.prototype.hasOwnProperty.call(body, "end_time");
    const requestedStartTime = hasStartTimeUpdate ? body.start_time : existingAppointment.start_time;
    const requestedEndTime = hasEndTimeUpdate ? body.end_time : existingAppointment.end_time;
    const timeRange = ensureTimeRange(requestedTimeslot, requestedStartTime, requestedEndTime);

    const nextTimeslot = timeRange.timeslot;
    const nextStartTime = timeRange.start;
    const nextEndTime = timeRange.end;
    const nextDate = body.scheduled_date ?? existingAppointment.scheduled_date;
    const nextStatus: AppointmentStatus = body.status ?? existingAppointment.status;
    const hasWorkerIdsUpdate = Object.prototype.hasOwnProperty.call(body, "worker_ids");
    const nextWorkerIds = hasWorkerIdsUpdate ? normalizeWorkerIds(body.worker_ids) : existingAppointment.worker_ids;

    const nextClientName =
      typeof body.client_name === "string" ? body.client_name.trim() : existingAppointment.client_name;
    const nextAddress = typeof body.address === "string" ? body.address.trim() : existingAppointment.address;
    const nextNotes =
      body.notes === null
        ? null
        : typeof body.notes === "string"
          ? body.notes.trim() || null
          : existingAppointment.notes;

    const appointmentSettings = await getAppointmentSettings();

    if (!nextClientName) {
      return NextResponse.json({ error: "Client name is required." }, { status: 400 });
    }

    if (!nextAddress) {
      return NextResponse.json({ error: "Address is required." }, { status: 400 });
    }

    if ((requiresStrictAssignment(nextStatus) || nextWorkerIds.length > 0) && nextStatus !== "cancelled") {
      const workerCountError = validateWorkerCount(
        nextServiceType,
        nextWorkerIds,
        appointmentSettings.service_worker_requirements,
      );
      if (workerCountError) {
        return NextResponse.json({ error: workerCountError }, { status: 400 });
      }
    }

    if (nextStatus !== "cancelled") {
      const slotAppointments = await getSlotAppointments(nextDate, nextTimeslot, id);
      const capacityError = validateCapacity(slotAppointments, nextServiceType, {
        serviceWorkerRequirements: appointmentSettings.service_worker_requirements,
        totalSlotCapacity: appointmentSettings.total_slot_capacity,
      });

      if (capacityError) {
        return NextResponse.json({ error: capacityError }, { status: 400 });
      }
    }

    if (nextWorkerIds.length > 0) {
      const unavailableWorkerIds = await getUnavailableWorkerIds(nextWorkerIds, nextDate, nextTimeslot, id);
      if (unavailableWorkerIds.length > 0) {
        return NextResponse.json(
          {
            error: "One or more selected workers are already assigned in this slot.",
            unavailable_worker_ids: unavailableWorkerIds,
          },
          { status: 400 },
        );
      }
    }

    const updatePayload = {
      client_name: nextClientName,
      address: nextAddress,
      service_type: nextServiceType,
      scheduled_date: nextDate,
      timeslot: nextTimeslot,
      start_time: nextStartTime,
      end_time: nextEndTime,
      status: nextStatus,
      notes: nextNotes,
    };

    let updateResult = await supabase
      .from("appointments")
      .update(updatePayload)
      .eq("id", id);

    if (updateResult.error && isMissingAppointmentTimeColumnError(updateResult.error)) {
      const fallbackPayload = {
        client_name: nextClientName,
        address: nextAddress,
        service_type: nextServiceType,
        scheduled_date: nextDate,
        timeslot: nextTimeslot,
        status: nextStatus,
        notes: nextNotes,
      };

      updateResult = await supabase
        .from("appointments")
        .update(fallbackPayload)
        .eq("id", id);
    }

    if (updateResult.error) {
      return NextResponse.json({ error: updateResult.error.message }, { status: 500 });
    }

    if (hasWorkerIdsUpdate) {
      const { error: clearError } = await supabase.from("appointment_assignments").delete().eq("appointment_id", id);
      if (clearError) {
        return NextResponse.json({ error: clearError.message }, { status: 500 });
      }

      if (nextWorkerIds.length > 0) {
        const assignmentPayload = nextWorkerIds.map((workerId) => ({
          appointment_id: id,
          worker_id: workerId,
        }));

        const { error: assignError } = await supabase.from("appointment_assignments").insert(assignmentPayload);

        if (assignError) {
          return NextResponse.json({ error: assignError.message }, { status: 500 });
        }
      }
    }

    const updatedAppointment = await getAppointmentById(id);
    return NextResponse.json(updatedAppointment);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to update appointment." }, { status: 500 });
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const authError = await requireAdminApiAccess();
  if (authError) {
    return authError;
  }

  const { id } = await context.params;

  const { error } = await supabase.from("appointments").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
