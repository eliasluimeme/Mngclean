import { getRequiredWorkers, getServiceCredits, TOTAL_SLOT_CAPACITY } from "@/lib/appointments/capacity";
import type {
  Appointment,
  AppointmentStatus,
  ServiceType,
  Timeslot,
} from "@/lib/appointments/types";

const SERVICE_TYPES: ServiceType[] = ["grand", "petit"];
const TIMESLOTS: Timeslot[] = ["morning", "evening"];
const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  "incoming",
  "scheduled",
  "on_site",
  "pending_review",
  "completed",
  "cancelled",
];

export function isServiceType(value: string): value is ServiceType {
  return SERVICE_TYPES.includes(value as ServiceType);
}

export function isTimeslot(value: string): value is Timeslot {
  return TIMESLOTS.includes(value as Timeslot);
}

export function isAppointmentStatus(value: string): value is AppointmentStatus {
  return APPOINTMENT_STATUSES.includes(value as AppointmentStatus);
}

export function normalizeWorkerIds(workerIds: unknown): string[] {
  if (!Array.isArray(workerIds)) {
    return [];
  }

  return Array.from(
    new Set(
      workerIds
        .filter((workerId): workerId is string => typeof workerId === "string")
        .map((workerId) => workerId.trim())
        .filter(Boolean),
    ),
  );
}

export function validateWorkerCount(serviceType: ServiceType, workerIds: string[]): string | null {
  const requiredWorkers = getRequiredWorkers(serviceType);

  if (workerIds.length !== requiredWorkers) {
    return `${capitalize(serviceType)} Menage requires exactly ${requiredWorkers} worker${requiredWorkers > 1 ? "s" : ""}.`;
  }

  return null;
}

export function validateCapacity(
  existingAppointments: Pick<Appointment, "service_type">[],
  nextServiceType: ServiceType,
): string | null {
  const used = existingAppointments.reduce((total, appointment) => total + getServiceCredits(appointment.service_type), 0);

  if (used + getServiceCredits(nextServiceType) > TOTAL_SLOT_CAPACITY) {
    return "Maximum capacity reached for this time slot.";
  }

  return null;
}

export function validateRequiredFields(input: {
  client_name?: string;
  address?: string;
  service_type?: string;
  scheduled_date?: string;
  timeslot?: string;
}): string | null {
  if (!input.client_name?.trim()) return "Client name is required.";
  if (!input.address?.trim()) return "Address is required.";
  if (!input.service_type || !isServiceType(input.service_type)) return "Invalid service type.";
  if (!input.scheduled_date) return "Scheduled date is required.";
  if (!input.timeslot || !isTimeslot(input.timeslot)) return "Invalid timeslot.";
  return null;
}

const STATUS_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  incoming: ["scheduled", "cancelled"],
  scheduled: ["incoming", "on_site", "cancelled"],
  on_site: ["scheduled", "pending_review", "cancelled"],
  pending_review: ["on_site", "completed", "cancelled"],
  completed: ["pending_review"],
  cancelled: ["incoming"],
};

export function getAllowedStatusTransitions(current: AppointmentStatus): AppointmentStatus[] {
  return STATUS_TRANSITIONS[current];
}

export function canTransitionStatus(current: AppointmentStatus, next: AppointmentStatus): boolean {
  if (current === next) return true;

  return STATUS_TRANSITIONS[current].includes(next);
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
