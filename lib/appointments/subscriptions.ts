import {
  addDays,
  addMonths,
  addWeeks,
  format,
  getISODay,
  isValid,
  parseISO,
} from "date-fns";
import type {
  AppointmentSubscriptionInput,
  SubscriptionCadence,
  SubscriptionDurationUnit,
  SubscriptionWeekdayTimeOverride,
  Timeslot,
} from "@/lib/appointments/types";
import { deriveTimeslotFromTime, ensureTimeRange, normalizeTimeString } from "@/lib/appointments/time";

interface WeekdayOption {
  value: number;
  label: string;
  shortLabel: string;
}

export const SUBSCRIPTION_WEEKDAY_OPTIONS: WeekdayOption[] = [
  { value: 1, label: "Monday", shortLabel: "Mon" },
  { value: 2, label: "Tuesday", shortLabel: "Tue" },
  { value: 3, label: "Wednesday", shortLabel: "Wed" },
  { value: 4, label: "Thursday", shortLabel: "Thu" },
  { value: 5, label: "Friday", shortLabel: "Fri" },
  { value: 6, label: "Saturday", shortLabel: "Sat" },
  { value: 7, label: "Sunday", shortLabel: "Sun" },
];

const DURATION_UNIT_VALUES: SubscriptionDurationUnit[] = ["weeks", "months"];
const CADENCE_VALUES: SubscriptionCadence[] = ["weekly", "biweekly"];
const MAX_DURATION_BY_UNIT: Record<SubscriptionDurationUnit, number> = {
  weeks: 104,
  months: 24,
};

export interface NormalizedSubscriptionConfig {
  cadence: SubscriptionCadence;
  repeat_every_weeks: 1 | 2;
  duration_unit: SubscriptionDurationUnit;
  duration_count: number;
  weekdays: number[];
  weekday_time_overrides: NormalizedSubscriptionWeekdayTimeOverride[];
}

export interface NormalizedSubscriptionWeekdayTimeOverride {
  weekday: number;
  start_time: string;
  end_time: string;
  timeslot: Timeslot;
}

export interface SubscriptionOccurrence {
  scheduled_date: string;
  weekday: number;
  start_time: string;
  end_time: string;
  timeslot: Timeslot;
}

function parseDate(value: string): Date {
  const parsed = parseISO(value);
  if (!isValid(parsed)) {
    throw new Error("Invalid scheduled date for subscription.");
  }

  return parsed;
}

function toPositiveInteger(value: unknown): number | null {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return null;
  }

  return Math.floor(parsed);
}

function isDurationUnit(value: unknown): value is SubscriptionDurationUnit {
  return DURATION_UNIT_VALUES.includes(value as SubscriptionDurationUnit);
}

function isCadence(value: unknown): value is SubscriptionCadence {
  return CADENCE_VALUES.includes(value as SubscriptionCadence);
}

export function normalizeSubscriptionWeekdays(raw: unknown): number[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return Array.from(
    new Set(
      raw
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value >= 1 && value <= 7),
    ),
  ).sort((a, b) => a - b);
}

export function getIsoWeekdayFromDateString(date: string): number {
  return getISODay(parseDate(date));
}

function normalizeSubscriptionWeekdayTimeOverrides(
  rawOverrides: unknown,
  weekdays: number[],
  fallback: {
    start_time: string;
    end_time: string;
    timeslot: Timeslot;
  },
): NormalizedSubscriptionWeekdayTimeOverride[] {
  const fallbackRange = ensureTimeRange(fallback.timeslot, fallback.start_time, fallback.end_time);

  const overridesByDay = new Map<number, NormalizedSubscriptionWeekdayTimeOverride>();

  if (Array.isArray(rawOverrides)) {
    for (const rawOverride of rawOverrides) {
      if (!rawOverride || typeof rawOverride !== "object") {
        continue;
      }

      const override = rawOverride as Partial<SubscriptionWeekdayTimeOverride>;
      const weekday = Number(override.weekday);

      if (!Number.isInteger(weekday) || weekday < 1 || weekday > 7) {
        continue;
      }

      const start = normalizeTimeString(override.start_time);
      const end = normalizeTimeString(override.end_time);

      if (!start || !end) {
        throw new Error("Invalid subscription weekday time. Use HH:mm for start and end time.");
      }

      const timeslot = deriveTimeslotFromTime(start, fallbackRange.timeslot);
      const normalizedRange = ensureTimeRange(timeslot, start, end);

      overridesByDay.set(weekday, {
        weekday,
        start_time: normalizedRange.start,
        end_time: normalizedRange.end,
        timeslot: normalizedRange.timeslot,
      });
    }
  }

  return weekdays.map((weekday) => {
    const override = overridesByDay.get(weekday);

    if (override) {
      return override;
    }

    return {
      weekday,
      start_time: fallbackRange.start,
      end_time: fallbackRange.end,
      timeslot: fallbackRange.timeslot,
    };
  });
}

export function normalizeSubscriptionInput(
  subscription: unknown,
  scheduledDate: string,
  fallbackTimeRange: {
    start_time: string;
    end_time: string;
    timeslot: Timeslot;
  } = {
    start_time: "08:30",
    end_time: "10:00",
    timeslot: "morning",
  },
): NormalizedSubscriptionConfig | null {
  if (!subscription || typeof subscription !== "object") {
    return null;
  }

  const payload = subscription as Partial<AppointmentSubscriptionInput>;

  if (!payload.enabled) {
    return null;
  }

  if (!isDurationUnit(payload.duration_unit)) {
    throw new Error("Invalid subscription duration unit.");
  }

  const cadence = isCadence(payload.cadence) ? payload.cadence : "weekly";

  const durationCount = toPositiveInteger(payload.duration_count);
  if (!durationCount) {
    throw new Error("Subscription duration count must be a positive number.");
  }

  const maxDuration = MAX_DURATION_BY_UNIT[payload.duration_unit];
  if (durationCount > maxDuration) {
    throw new Error(
      `Subscription duration is too long. Maximum is ${maxDuration} ${payload.duration_unit}.`,
    );
  }

  const weekdays = normalizeSubscriptionWeekdays(payload.weekdays);
  if (weekdays.length === 0) {
    throw new Error("Select at least one weekday for the subscription.");
  }

  const scheduledWeekday = getIsoWeekdayFromDateString(scheduledDate);
  if (!weekdays.includes(scheduledWeekday)) {
    throw new Error("Subscription weekdays must include the selected appointment day.");
  }

  const weekday_time_overrides = normalizeSubscriptionWeekdayTimeOverrides(
    payload.weekday_time_overrides,
    weekdays,
    fallbackTimeRange,
  );

  return {
    cadence,
    repeat_every_weeks: cadence === "biweekly" ? 2 : 1,
    duration_unit: payload.duration_unit,
    duration_count: durationCount,
    weekdays,
    weekday_time_overrides,
  };
}

export function buildSubscriptionOccurrences(
  startDate: string,
  subscription: NormalizedSubscriptionConfig,
): SubscriptionOccurrence[] {
  const start = parseDate(startDate);
  const rangeEndExclusive =
    subscription.duration_unit === "weeks"
      ? addWeeks(start, subscription.duration_count)
      : addMonths(start, subscription.duration_count);

  const selectedDays = new Set(subscription.weekdays);
  const timeOverrideMap = new Map(
    subscription.weekday_time_overrides.map((override) => [override.weekday, override]),
  );
  const fallbackOverride = subscription.weekday_time_overrides[0];
  const occurrences: SubscriptionOccurrence[] = [];

  for (let cursor = start; cursor < rangeEndExclusive; cursor = addDays(cursor, 1)) {
    const isoDay = getISODay(cursor);

    if (selectedDays.has(isoDay)) {
      const diffDays = Math.floor((cursor.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
      const weekIndex = Math.floor(diffDays / 7);

      if (weekIndex % subscription.repeat_every_weeks !== 0) {
        continue;
      }

      const override = timeOverrideMap.get(isoDay) || fallbackOverride;

      if (!override) {
        continue;
      }

      occurrences.push({
        scheduled_date: format(cursor, "yyyy-MM-dd"),
        weekday: isoDay,
        start_time: override.start_time,
        end_time: override.end_time,
        timeslot: override.timeslot,
      });
    }
  }

  return occurrences;
}

export function buildSubscriptionOccurrenceDates(
  startDate: string,
  subscription: NormalizedSubscriptionConfig,
): string[] {
  return buildSubscriptionOccurrences(startDate, subscription).map((occurrence) => occurrence.scheduled_date);
}
