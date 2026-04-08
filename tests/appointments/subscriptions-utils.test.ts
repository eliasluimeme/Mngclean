import { describe, expect, it } from "vitest";
import {
  buildSubscriptionOccurrences,
  buildSubscriptionOccurrenceDates,
  getIsoWeekdayFromDateString,
  normalizeSubscriptionInput,
} from "@/lib/appointments/subscriptions";

describe("appointment subscriptions utils", () => {
  it("normalizes a valid subscription payload", () => {
    const normalized = normalizeSubscriptionInput(
      {
        enabled: true,
        duration_unit: "weeks",
        duration_count: 2,
        weekdays: [1, 2, 2, 9],
      },
      "2026-04-06",
    );

    expect(normalized).toEqual({
      cadence: "weekly",
      repeat_every_weeks: 1,
      duration_unit: "weeks",
      duration_count: 2,
      weekdays: [1, 2],
      weekday_time_overrides: [
        {
          weekday: 1,
          start_time: "08:30",
          end_time: "10:00",
          timeslot: "morning",
        },
        {
          weekday: 2,
          start_time: "08:30",
          end_time: "10:00",
          timeslot: "morning",
        },
      ],
    });
  });

  it("returns null when subscription is disabled", () => {
    const normalized = normalizeSubscriptionInput(
      {
        enabled: false,
        duration_unit: "weeks",
        duration_count: 2,
        weekdays: [1],
      },
      "2026-04-06",
    );

    expect(normalized).toBeNull();
  });

  it("builds recurring dates for selected weekdays in range", () => {
    const dates = buildSubscriptionOccurrenceDates("2026-04-06", {
      cadence: "weekly",
      repeat_every_weeks: 1,
      duration_unit: "weeks",
      duration_count: 2,
      weekdays: [1, 2],
      weekday_time_overrides: [
        {
          weekday: 1,
          start_time: "08:30",
          end_time: "10:00",
          timeslot: "morning",
        },
        {
          weekday: 2,
          start_time: "08:30",
          end_time: "10:00",
          timeslot: "morning",
        },
      ],
    });

    expect(dates).toEqual([
      "2026-04-06",
      "2026-04-07",
      "2026-04-13",
      "2026-04-14",
    ]);
  });

  it("computes ISO weekday from a date string", () => {
    expect(getIsoWeekdayFromDateString("2026-04-06")).toBe(1);
    expect(getIsoWeekdayFromDateString("2026-04-07")).toBe(2);
  });

  it("builds recurring occurrences with weekday-specific times", () => {
    const occurrences = buildSubscriptionOccurrences("2026-04-06", {
      cadence: "weekly",
      repeat_every_weeks: 1,
      duration_unit: "weeks",
      duration_count: 1,
      weekdays: [1, 2],
      weekday_time_overrides: [
        {
          weekday: 1,
          start_time: "10:00",
          end_time: "11:00",
          timeslot: "morning",
        },
        {
          weekday: 2,
          start_time: "11:00",
          end_time: "12:00",
          timeslot: "morning",
        },
      ],
    });

    expect(occurrences).toEqual([
      {
        scheduled_date: "2026-04-06",
        weekday: 1,
        start_time: "10:00",
        end_time: "11:00",
        timeslot: "morning",
      },
      {
        scheduled_date: "2026-04-07",
        weekday: 2,
        start_time: "11:00",
        end_time: "12:00",
        timeslot: "morning",
      },
    ]);
  });

  it("builds bi-weekly recurring dates", () => {
    const dates = buildSubscriptionOccurrenceDates("2026-04-06", {
      cadence: "biweekly",
      repeat_every_weeks: 2,
      duration_unit: "weeks",
      duration_count: 4,
      weekdays: [1],
      weekday_time_overrides: [
        {
          weekday: 1,
          start_time: "10:00",
          end_time: "11:00",
          timeslot: "morning",
        },
      ],
    });

    expect(dates).toEqual([
      "2026-04-06",
      "2026-04-20",
    ]);
  });
});
