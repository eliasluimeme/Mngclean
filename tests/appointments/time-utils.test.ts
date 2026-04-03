import { describe, expect, it } from "vitest";
import {
  deriveTimeslotFromTime,
  ensureTimeRange,
  normalizeTimeString,
  toMinutes,
  toTimeString,
} from "@/lib/appointments/time";

describe("appointments time utilities", () => {
  it("normalizes HH:mm and HH:mm:ss values", () => {
    expect(normalizeTimeString("8:05")).toBe("08:05");
    expect(normalizeTimeString("08:05:00")).toBe("08:05");
    expect(normalizeTimeString("25:00")).toBeNull();
  });

  it("converts between minute and time representations", () => {
    expect(toMinutes("09:30")).toBe(570);
    expect(toTimeString(570)).toBe("09:30");
  });

  it("derives morning/evening slot from start time", () => {
    expect(deriveTimeslotFromTime("11:45")).toBe("morning");
    expect(deriveTimeslotFromTime("12:00")).toBe("evening");
  });

  it("ensures valid range and minimum duration", () => {
    const normalized = ensureTimeRange("morning", "10:00", "09:00");

    expect(normalized.start).toBe("10:00");
    expect(normalized.end).toBe("10:30");
    expect(normalized.timeslot).toBe("morning");
  });
});
