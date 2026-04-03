import type { AppointmentStatus } from "@/lib/appointments/types";

interface DatabaseErrorLike {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}

function normalizeErrorText(error: unknown): { code: string; text: string } {
  const dbError = (error || {}) as DatabaseErrorLike;

  return {
    code: String(dbError.code || "").toUpperCase(),
    text: `${dbError.message || ""} ${dbError.details || ""} ${dbError.hint || ""}`.toLowerCase(),
  };
}

export function normalizeAppointmentStatus(value: unknown): AppointmentStatus | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");

  switch (normalized) {
    case "incoming":
    case "new":
      return "incoming";
    case "scheduled":
      return "scheduled";
    case "on_site":
    case "onsite":
    case "in_progress":
      return "on_site";
    case "pending_review":
    case "pendingreview":
      return "pending_review";
    case "completed":
    case "done":
      return "completed";
    case "cancelled":
    case "canceled":
      return "cancelled";
    default:
      return null;
  }
}

export function getLegacyDbStatusCandidate(status: AppointmentStatus): string | null {
  switch (status) {
    case "on_site":
      return "on-site";
    case "pending_review":
      return "pending review";
    case "cancelled":
      return "canceled";
    default:
      return null;
  }
}

export function isAppointmentStatusConstraintError(error: unknown): boolean {
  const { code, text } = normalizeErrorText(error);

  const isCheckViolation = code === "23514" || text.includes("check constraint");
  const touchesStatus = text.includes("appointments_status_check") || text.includes("status");

  return isCheckViolation && touchesStatus;
}
