import { NextResponse } from "next/server";
import { requireAdminApiAccess } from "@/lib/admin-api";
import { supabase } from "@/lib/supabase-server";
import { isMissingAppointmentTimeColumnError } from "@/lib/appointments/db-errors";
import { getAppointmentById, getAppointmentsRange, getSlotAppointments, getUnavailableWorkerIds } from "@/lib/appointments/server";
import { ensureTimeRange, normalizeTimeString } from "@/lib/appointments/time";
import {
  isAppointmentStatus,
  isServiceType,
  isTimeslot,
  normalizeWorkerIds,
  validateCapacity,
  validateRequiredFields,
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

export async function GET(request: Request) {
  const authError = await requireAdminApiAccess();
  if (authError) {
    return authError;
  }

  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;
    const statusParam = searchParams.get("status");
    const timeslotParam = searchParams.get("timeslot");

    if (statusParam && !isAppointmentStatus(statusParam)) {
      return NextResponse.json({ error: "Invalid status filter." }, { status: 400 });
    }

    if (timeslotParam && !isTimeslot(timeslotParam)) {
      return NextResponse.json({ error: "Invalid timeslot filter." }, { status: 400 });
    }

    let appointments = await getAppointmentsRange(from, to);

    if (statusParam) {
      appointments = appointments.filter((appointment) => appointment.status === statusParam);
    }

    if (timeslotParam) {
      appointments = appointments.filter((appointment) => appointment.timeslot === timeslotParam);
    }

    return NextResponse.json(appointments);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch appointments." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authError = await requireAdminApiAccess();
  if (authError) {
    return authError;
  }

  try {
    const body = await request.json();
    const fieldError = validateRequiredFields(body);

    if (fieldError) {
      return NextResponse.json({ error: fieldError }, { status: 400 });
    }

    const serviceType = body.service_type as string;
    const requestedTimeslot = body.timeslot as string;
    const scheduledDate = String(body.scheduled_date);
    const workerIds = normalizeWorkerIds(body.worker_ids);

    if (!isServiceType(serviceType) || !isTimeslot(requestedTimeslot)) {
      return NextResponse.json({ error: "Invalid service type or timeslot." }, { status: 400 });
    }

    if (body.start_time !== undefined && body.start_time !== null && !normalizeTimeString(body.start_time)) {
      return NextResponse.json({ error: "Invalid start time format. Use HH:mm." }, { status: 400 });
    }

    if (body.end_time !== undefined && body.end_time !== null && !normalizeTimeString(body.end_time)) {
      return NextResponse.json({ error: "Invalid end time format. Use HH:mm." }, { status: 400 });
    }

    const timeRange = ensureTimeRange(requestedTimeslot, body.start_time, body.end_time);
    const timeslot = timeRange.timeslot;

    const requestedStatus = body.status;
    if (requestedStatus !== undefined && (typeof requestedStatus !== "string" || !isAppointmentStatus(requestedStatus))) {
      return NextResponse.json({ error: "Invalid appointment status." }, { status: 400 });
    }

    const status: AppointmentStatus = requestedStatus
      ? (requestedStatus as AppointmentStatus)
      : workerIds.length > 0
        ? "scheduled"
        : "incoming";

    if ((requiresStrictAssignment(status) || workerIds.length > 0) && status !== "cancelled") {
      const workerCountError = validateWorkerCount(serviceType, workerIds);
      if (workerCountError) {
        return NextResponse.json({ error: workerCountError }, { status: 400 });
      }
    }

    if (status !== "cancelled") {
      const slotAppointments = await getSlotAppointments(scheduledDate, timeslot);
      const capacityError = validateCapacity(slotAppointments, serviceType);

      if (capacityError) {
        return NextResponse.json({ error: capacityError }, { status: 400 });
      }
    }

    if (workerIds.length > 0) {
      const unavailableWorkerIds = await getUnavailableWorkerIds(workerIds, scheduledDate, timeslot);
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

    const insertPayload = {
      client_name: String(body.client_name).trim(),
      address: String(body.address).trim(),
      service_type: serviceType,
      scheduled_date: scheduledDate,
      timeslot,
      start_time: timeRange.start,
      end_time: timeRange.end,
      status,
      notes: typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null,
    };

    let createResult = await supabase
      .from("appointments")
      .insert(insertPayload)
      .select("id")
      .single();

    if (createResult.error && isMissingAppointmentTimeColumnError(createResult.error)) {
      const fallbackInsertPayload = {
        client_name: String(body.client_name).trim(),
        address: String(body.address).trim(),
        service_type: serviceType,
        scheduled_date: scheduledDate,
        timeslot,
        status,
        notes: typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null,
      };

      createResult = await supabase
        .from("appointments")
        .insert(fallbackInsertPayload)
        .select("id")
        .single();
    }

    const { data: createdAppointment, error: createError } = createResult;

    if (createError || !createdAppointment) {
      return NextResponse.json({ error: createError?.message || "Failed to create appointment." }, { status: 500 });
    }

    if (workerIds.length > 0) {
      const assignmentPayload = workerIds.map((workerId) => ({
        appointment_id: createdAppointment.id,
        worker_id: workerId,
      }));

      const { error: assignmentError } = await supabase.from("appointment_assignments").insert(assignmentPayload);

      if (assignmentError) {
        await supabase.from("appointments").delete().eq("id", createdAppointment.id);
        return NextResponse.json({ error: assignmentError.message }, { status: 500 });
      }
    }

    const fullAppointment = await getAppointmentById(createdAppointment.id);
    return NextResponse.json(fullAppointment, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to create appointment." }, { status: 500 });
  }
}
