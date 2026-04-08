import { supabase } from "@/lib/supabase-server";
import {
  DEFAULT_APPOINTMENT_SETTINGS,
  buildSlotCapacity,
  getRequiredWorkers,
  getServiceCredits,
} from "@/lib/appointments/capacity";
import { isMissingAppointmentTimeColumnError } from "@/lib/appointments/db-errors";
import { getAppointmentSettings } from "@/lib/appointments/settings";
import { normalizeAppointmentStatus } from "@/lib/appointments/status";
import { getDefaultTimeRangeForSlot, normalizeTimeString } from "@/lib/appointments/time";
import type {
  AppointmentSettings,
  AppointmentStatus,
  AppointmentWithAssignments,
  ServiceType,
  SlotAvailability,
  Timeslot,
  Worker,
  WorkerStatus,
} from "@/lib/appointments/types";

const APPOINTMENT_SELECT = `
  id,
  client_name,
  address,
  service_type,
  scheduled_date,
  timeslot,
  start_time,
  end_time,
  status,
  notes,
  created_at,
  appointment_assignments(
    appointment_id,
    worker_id,
    created_at,
    workers(
      id,
      name,
      avatar_url,
      phone,
      is_active,
      status,
      created_at
    )
  )
`;

const APPOINTMENT_SELECT_LEGACY = `
  id,
  client_name,
  address,
  service_type,
  scheduled_date,
  timeslot,
  status,
  notes,
  created_at,
  appointment_assignments(
    appointment_id,
    worker_id,
    created_at,
    workers(
      id,
      name,
      avatar_url,
      phone,
      is_active,
      status,
      created_at
    )
  )
`;

const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  "incoming",
  "scheduled",
  "on_site",
  "pending_review",
  "completed",
  "cancelled",
];

const WORKER_STATUSES: WorkerStatus[] = ["available", "on_site", "off_duty"];

function parseServiceType(value: unknown): ServiceType {
  return value === "grand" ? "grand" : "petit";
}

function parseTimeslot(value: unknown): Timeslot {
  return value === "evening" ? "evening" : "morning";
}

function parseAppointmentStatus(value: unknown): AppointmentStatus {
  const normalized = normalizeAppointmentStatus(value);
  return normalized && APPOINTMENT_STATUSES.includes(normalized) ? normalized : "incoming";
}

function parseWorkerStatus(value: unknown): WorkerStatus {
  return WORKER_STATUSES.includes(value as WorkerStatus) ? (value as WorkerStatus) : "available";
}

function mapWorkerRow(row: any): Worker {
  return {
    id: String(row.id),
    name: String(row.name ?? "Unknown Worker"),
    avatar_url: row.avatar_url ?? null,
    phone: row.phone ?? null,
    is_active: Boolean(row.is_active),
    status: parseWorkerStatus(row.status),
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

export function mapAppointmentRow(
  row: any,
  settings: AppointmentSettings = DEFAULT_APPOINTMENT_SETTINGS,
): AppointmentWithAssignments {
  const rawAssignments = Array.isArray(row.appointment_assignments) ? row.appointment_assignments : [];

  const assignments: AppointmentWithAssignments["assignments"] = rawAssignments.map((assignment: any) => {
    const workerNode = Array.isArray(assignment.workers)
      ? assignment.workers[0]
      : assignment.workers;

    return {
      appointment_id: String(assignment.appointment_id),
      worker_id: String(assignment.worker_id),
      created_at: String(assignment.created_at ?? new Date().toISOString()),
      worker: workerNode ? mapWorkerRow(workerNode) : undefined,
    };
  });

  const serviceType = parseServiceType(row.service_type);
  const timeslot = parseTimeslot(row.timeslot);
  const defaults = getDefaultTimeRangeForSlot(timeslot);

  return {
    id: String(row.id),
    client_name: String(row.client_name ?? ""),
    address: String(row.address ?? ""),
    service_type: serviceType,
    scheduled_date: String(row.scheduled_date),
    timeslot,
    start_time: normalizeTimeString(row.start_time) || defaults.start,
    end_time: normalizeTimeString(row.end_time) || defaults.end,
    status: parseAppointmentStatus(row.status),
    notes: row.notes ?? null,
    created_at: String(row.created_at ?? new Date().toISOString()),
    assignments,
    worker_ids: assignments.map(
      (assignment: AppointmentWithAssignments["assignments"][number]) => assignment.worker_id,
    ),
    required_workers: getRequiredWorkers(serviceType, settings.service_worker_requirements),
    used_credits: getServiceCredits(serviceType, settings.service_worker_requirements),
  };
}

export async function getAppointmentsRange(from?: string, to?: string): Promise<AppointmentWithAssignments[]> {
  const settings = await getAppointmentSettings();

  const runQuery = async (selectClause: string) => {
    let query = supabase.from("appointments").select(selectClause).order("scheduled_date", { ascending: true });

    if (from) {
      query = query.gte("scheduled_date", from);
    }

    if (to) {
      query = query.lte("scheduled_date", to);
    }

    return query;
  };

  const initial = await runQuery(APPOINTMENT_SELECT);

  if (!initial.error) {
    return (initial.data || []).map((row: any) => mapAppointmentRow(row, settings));
  }

  if (!isMissingAppointmentTimeColumnError(initial.error)) {
    throw new Error(initial.error.message);
  }

  const legacy = await runQuery(APPOINTMENT_SELECT_LEGACY);

  if (legacy.error) {
    throw new Error(legacy.error.message);
  }

  return (legacy.data || []).map((row: any) => mapAppointmentRow(row, settings));
}

export async function getSlotAppointments(
  date: string,
  timeslot: Timeslot,
  excludeAppointmentId?: string,
  settings?: AppointmentSettings,
): Promise<AppointmentWithAssignments[]> {
  const effectiveSettings = settings || (await getAppointmentSettings());

  const runQuery = async (selectClause: string) => {
    let query = supabase
      .from("appointments")
      .select(selectClause)
      .eq("scheduled_date", date)
      .eq("timeslot", timeslot)
      .neq("status", "cancelled");

    if (excludeAppointmentId) {
      query = query.neq("id", excludeAppointmentId);
    }

    return query;
  };

  const initial = await runQuery(APPOINTMENT_SELECT);

  if (!initial.error) {
    return (initial.data || []).map((row: any) => mapAppointmentRow(row, effectiveSettings));
  }

  if (!isMissingAppointmentTimeColumnError(initial.error)) {
    throw new Error(initial.error.message);
  }

  const legacy = await runQuery(APPOINTMENT_SELECT_LEGACY);

  if (legacy.error) {
    throw new Error(legacy.error.message);
  }

  return (legacy.data || []).map((row: any) => mapAppointmentRow(row, effectiveSettings));
}

export async function getAppointmentById(id: string): Promise<AppointmentWithAssignments | null> {
  const settings = await getAppointmentSettings();

  const runQuery = async (selectClause: string) => {
    return supabase
      .from("appointments")
      .select(selectClause)
      .eq("id", id)
      .maybeSingle();
  };

  const initial = await runQuery(APPOINTMENT_SELECT);

  if (!initial.error) {
    return initial.data ? mapAppointmentRow(initial.data, settings) : null;
  }

  if (!isMissingAppointmentTimeColumnError(initial.error)) {
    throw new Error(initial.error.message);
  }

  const legacy = await runQuery(APPOINTMENT_SELECT_LEGACY);

  if (legacy.error) {
    throw new Error(legacy.error.message);
  }

  return legacy.data ? mapAppointmentRow(legacy.data, settings) : null;
}

export async function getActiveWorkers(): Promise<Worker[]> {
  const { data, error } = await supabase.from("workers").select("*").eq("is_active", true).order("name");

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map(mapWorkerRow);
}

export function getBusyWorkerIds(appointments: AppointmentWithAssignments[]): string[] {
  const busy = new Set<string>();

  appointments.forEach((appointment) => {
    appointment.worker_ids.forEach((workerId) => busy.add(workerId));
  });

  return Array.from(busy);
}

export async function getUnavailableWorkerIds(
  workerIds: string[],
  date: string,
  timeslot: Timeslot,
  excludeAppointmentId?: string,
): Promise<string[]> {
  const slotAppointments = await getSlotAppointments(date, timeslot, excludeAppointmentId);
  const busySet = new Set(getBusyWorkerIds(slotAppointments));
  return workerIds.filter((workerId) => busySet.has(workerId));
}

export async function getSlotAvailability(
  date: string,
  timeslot: Timeslot,
  excludeAppointmentId?: string,
): Promise<SlotAvailability> {
  const settings = await getAppointmentSettings();
  const slotAppointments = await getSlotAppointments(date, timeslot, excludeAppointmentId, settings);
  const capacity = buildSlotCapacity(slotAppointments, {
    serviceWorkerRequirements: settings.service_worker_requirements,
    totalSlotCapacity: settings.total_slot_capacity,
  });
  const activeWorkers = await getActiveWorkers();
  const busyWorkerIds = getBusyWorkerIds(slotAppointments);
  const busySet = new Set(busyWorkerIds);

  return {
    date,
    timeslot,
    capacity,
    busy_worker_ids: busyWorkerIds,
    available_workers: activeWorkers.filter((worker) => !busySet.has(worker.id)),
    settings,
  };
}
