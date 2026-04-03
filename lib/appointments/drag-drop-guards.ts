import type { AppointmentStatus, AppointmentWithAssignments } from "@/lib/appointments/types";

export interface BoardMoveGuardResult {
  blocked: boolean;
  error?: string;
  preferredStatus?: AppointmentStatus;
}

export function evaluateBoardMoveGuard(
  appointment: AppointmentWithAssignments | undefined,
  targetStatus: AppointmentStatus,
): BoardMoveGuardResult {
  if (!appointment) {
    return {
      blocked: true,
      error: "Appointment no longer exists.",
    };
  }

  const missingWorkers = appointment.required_workers - appointment.worker_ids.length;

  if (targetStatus === "scheduled" && missingWorkers > 0) {
    return {
      blocked: true,
      preferredStatus: "scheduled",
      error: `${appointment.service_type === "grand" ? "Grand" : "Petit"} Menage needs ${appointment.required_workers} worker${appointment.required_workers > 1 ? "s" : ""} before scheduling.`,
    };
  }

  return {
    blocked: false,
  };
}
