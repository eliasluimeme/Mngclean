import { addMinutes } from "date-fns";
import type { AppointmentWithAssignments, Timeslot } from "@/lib/appointments/types";

const MINUTES_IN_DAY = 24 * 60;
const MIN_DURATION_MINUTES = 30;

const SLOT_DEFAULTS: Record<Timeslot, { start: string; end: string }> = {
  morning: { start: "08:30", end: "10:00" },
  evening: { start: "14:00", end: "15:30" },
};

export function normalizeTimeString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (Number.isNaN(hours) || Number.isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function toMinutes(time: string): number {
  const normalized = normalizeTimeString(time);
  if (!normalized) {
    return 0;
  }

  const [hours, minutes] = normalized.split(":").map(Number);
  return hours * 60 + minutes;
}

export function toTimeString(minutes: number): string {
  const safeMinutes = Math.max(0, Math.min(MINUTES_IN_DAY - 1, Math.round(minutes)));
  const h = Math.floor(safeMinutes / 60);
  const m = safeMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function getDefaultTimeRangeForSlot(timeslot: Timeslot): { start: string; end: string } {
  return SLOT_DEFAULTS[timeslot];
}

export function deriveTimeslotFromTime(startTime: string, fallback: Timeslot = "morning"): Timeslot {
  const normalized = normalizeTimeString(startTime);
  if (!normalized) {
    return fallback;
  }

  const startMinutes = toMinutes(normalized);
  return startMinutes < 12 * 60 ? "morning" : "evening";
}

export function ensureTimeRange(
  timeslot: Timeslot,
  requestedStartTime?: unknown,
  requestedEndTime?: unknown,
): { timeslot: Timeslot; start: string; end: string } {
  const defaults = getDefaultTimeRangeForSlot(timeslot);
  const normalizedStart = normalizeTimeString(requestedStartTime) || defaults.start;
  const normalizedEnd = normalizeTimeString(requestedEndTime) || defaults.end;

  let startMinutes = toMinutes(normalizedStart);
  let endMinutes = toMinutes(normalizedEnd);

  if (endMinutes <= startMinutes) {
    endMinutes = startMinutes + MIN_DURATION_MINUTES;
  }

  if (endMinutes >= MINUTES_IN_DAY) {
    endMinutes = MINUTES_IN_DAY - 1;
    startMinutes = Math.max(0, endMinutes - MIN_DURATION_MINUTES);
  }

  const safeStart = toTimeString(startMinutes);
  const safeEnd = toTimeString(endMinutes);
  const derivedTimeslot = deriveTimeslotFromTime(safeStart, timeslot);

  return {
    timeslot: derivedTimeslot,
    start: safeStart,
    end: safeEnd,
  };
}

export function combineDateAndTime(date: string, time: string): Date {
  const normalized = normalizeTimeString(time) || "00:00";
  return new Date(`${date}T${normalized}:00`);
}

export function getAppointmentDateRange(appointment: AppointmentWithAssignments): { start: Date; end: Date } {
  const defaults = getDefaultTimeRangeForSlot(appointment.timeslot);
  const startTime = normalizeTimeString(appointment.start_time) || defaults.start;
  const endTime = normalizeTimeString(appointment.end_time) || defaults.end;

  const start = combineDateAndTime(appointment.scheduled_date, startTime);
  let end = combineDateAndTime(appointment.scheduled_date, endTime);

  if (end <= start) {
    end = addMinutes(start, MIN_DURATION_MINUTES);
  }

  return { start, end };
}

export function getAppointmentTimeLabel(appointment: AppointmentWithAssignments): string {
  const defaults = getDefaultTimeRangeForSlot(appointment.timeslot);
  const start = normalizeTimeString(appointment.start_time) || defaults.start;
  const end = normalizeTimeString(appointment.end_time) || defaults.end;
  return `${start} - ${end}`;
}
