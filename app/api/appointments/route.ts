import { NextResponse } from "next/server";
import { requireAdminApiAccess } from "@/lib/admin-api";
import { supabase } from "@/lib/supabase-server";
import {
  isMissingAppointmentTimeColumnError,
  isMissingSubscriptionFeatureError,
} from "@/lib/appointments/db-errors";
import { getAppointmentSettings } from "@/lib/appointments/settings";
import { getAppointmentById, getAppointmentsRange, getSlotAppointments, getUnavailableWorkerIds } from "@/lib/appointments/server";
import {
  buildSubscriptionOccurrences,
  normalizeSubscriptionInput,
} from "@/lib/appointments/subscriptions";
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

    let subscriptionConfig = null;
    try {
      subscriptionConfig = normalizeSubscriptionInput(body.subscription, scheduledDate, {
        start_time: timeRange.start,
        end_time: timeRange.end,
        timeslot,
      });
    } catch (error: any) {
      return NextResponse.json({ error: error?.message || "Invalid subscription configuration." }, { status: 400 });
    }

    const targetOccurrences = subscriptionConfig
      ? buildSubscriptionOccurrences(scheduledDate, subscriptionConfig)
      : [
          {
            scheduled_date: scheduledDate,
            start_time: timeRange.start,
            end_time: timeRange.end,
            timeslot,
          },
        ];

    if (subscriptionConfig && targetOccurrences.length === 0) {
      return NextResponse.json(
        { error: "Subscription configuration produced no appointment dates." },
        { status: 400 },
      );
    }

    const appointmentSettings = await getAppointmentSettings();

    if ((requiresStrictAssignment(status) || workerIds.length > 0) && status !== "cancelled") {
      const workerCountError = validateWorkerCount(
        serviceType,
        workerIds,
        appointmentSettings.service_worker_requirements,
      );
      if (workerCountError) {
        return NextResponse.json({ error: workerCountError }, { status: 400 });
      }
    }

    if (status !== "cancelled") {
      for (const occurrence of targetOccurrences) {
        const slotAppointments = await getSlotAppointments(
          occurrence.scheduled_date,
          occurrence.timeslot,
        );
        const capacityError = validateCapacity(slotAppointments, serviceType, {
          serviceWorkerRequirements: appointmentSettings.service_worker_requirements,
          totalSlotCapacity: appointmentSettings.total_slot_capacity,
        });

        if (capacityError) {
          return NextResponse.json(
            {
              error: capacityError,
              date: occurrence.scheduled_date,
            },
            { status: 400 },
          );
        }
      }
    }

    if (workerIds.length > 0) {
      for (const occurrence of targetOccurrences) {
        const unavailableWorkerIds = await getUnavailableWorkerIds(
          workerIds,
          occurrence.scheduled_date,
          occurrence.timeslot,
        );
        if (unavailableWorkerIds.length > 0) {
          return NextResponse.json(
            {
              error: "One or more selected workers are already assigned in this slot.",
              unavailable_worker_ids: unavailableWorkerIds,
              date: occurrence.scheduled_date,
            },
            { status: 400 },
          );
        }
      }
    }

    const normalizedNotes =
      typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null;

    const insertPayload = {
      client_name: String(body.client_name).trim(),
      address: String(body.address).trim(),
      service_type: serviceType,
      scheduled_date: scheduledDate,
      timeslot,
      start_time: timeRange.start,
      end_time: timeRange.end,
      status,
      notes: normalizedNotes,
    };

    if (subscriptionConfig) {
      const subscriptionPayload = {
        client_name: String(body.client_name).trim(),
        address: String(body.address).trim(),
        service_type: serviceType,
        start_date: scheduledDate,
        timeslot,
        start_time: timeRange.start,
        end_time: timeRange.end,
        status,
        notes: normalizedNotes,
        cadence: subscriptionConfig.cadence,
        repeat_every_weeks: subscriptionConfig.repeat_every_weeks,
        duration_unit: subscriptionConfig.duration_unit,
        duration_count: subscriptionConfig.duration_count,
        weekdays: subscriptionConfig.weekdays,
        weekday_time_overrides: subscriptionConfig.weekday_time_overrides,
      };

      const subscriptionResult = await supabase
        .from("appointment_subscriptions")
        .insert(subscriptionPayload)
        .select("id")
        .single();

      if (subscriptionResult.error || !subscriptionResult.data?.id) {
        if (isMissingSubscriptionFeatureError(subscriptionResult.error)) {
          return NextResponse.json(
            {
              error:
                "Subscription schema is missing. Apply the appointments subscription migration in Supabase.",
            },
            { status: 500 },
          );
        }

        return NextResponse.json(
          { error: subscriptionResult.error?.message || "Failed to create subscription." },
          { status: 500 },
        );
      }

      const recurringPayload = targetOccurrences.map((occurrence) => ({
        ...insertPayload,
        scheduled_date: occurrence.scheduled_date,
        timeslot: occurrence.timeslot,
        start_time: occurrence.start_time,
        end_time: occurrence.end_time,
      }));

      let recurringResult = await supabase
        .from("appointments")
        .insert(recurringPayload)
        .select("id, scheduled_date");

      if (recurringResult.error && isMissingAppointmentTimeColumnError(recurringResult.error)) {
        const fallbackPayload = targetOccurrences.map((occurrence) => ({
          client_name: String(body.client_name).trim(),
          address: String(body.address).trim(),
          service_type: serviceType,
          scheduled_date: occurrence.scheduled_date,
          timeslot: occurrence.timeslot,
          status,
          notes: normalizedNotes,
        }));

        recurringResult = await supabase
          .from("appointments")
          .insert(fallbackPayload)
          .select("id, scheduled_date");
      }

      if (recurringResult.error || !Array.isArray(recurringResult.data) || recurringResult.data.length === 0) {
        await supabase.from("appointment_subscriptions").delete().eq("id", subscriptionResult.data.id);

        return NextResponse.json(
          { error: recurringResult.error?.message || "Failed to create subscription appointments." },
          { status: 500 },
        );
      }

      const createdAppointments = recurringResult.data as Array<{ id: string; scheduled_date: string }>;

      if (workerIds.length > 0) {
        const assignmentPayload = createdAppointments.flatMap((appointment) =>
          workerIds.map((workerId) => ({
            appointment_id: appointment.id,
            worker_id: workerId,
          })),
        );

        const { error: assignmentError } = await supabase.from("appointment_assignments").insert(assignmentPayload);

        if (assignmentError) {
          const createdIds = createdAppointments.map((appointment) => appointment.id);
          await supabase.from("appointments").delete().in("id", createdIds);
          await supabase.from("appointment_subscriptions").delete().eq("id", subscriptionResult.data.id);

          return NextResponse.json({ error: assignmentError.message }, { status: 500 });
        }
      }

      return NextResponse.json(
        {
          subscription_id: subscriptionResult.data.id,
          created_count: createdAppointments.length,
          scheduled_dates: createdAppointments.map((appointment) => appointment.scheduled_date),
        },
        { status: 201 },
      );
    }

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
        notes: normalizedNotes,
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
