import { describe, expect, it } from "vitest";
import {
  canTransitionStatus,
  isAppointmentStatus,
  isServiceType,
  isTimeslot,
  normalizeWorkerIds,
  validateCapacity,
  validateRequiredFields,
  validateWorkerCount,
} from "@/lib/appointments/validators";

describe("appointments validators", () => {
  it("validates enum-like values", () => {
    expect(isServiceType("grand")).toBe(true);
    expect(isServiceType("other")).toBe(false);

    expect(isTimeslot("morning")).toBe(true);
    expect(isTimeslot("night")).toBe(false);

    expect(isAppointmentStatus("pending_review")).toBe(true);
    expect(isAppointmentStatus("started")).toBe(false);
  });

  it("normalizes worker ids by trimming and deduplicating", () => {
    const normalized = normalizeWorkerIds([" w1 ", "w2", "w1", "", null]);
    expect(normalized).toEqual(["w1", "w2"]);
  });

  it("enforces exact worker count by service", () => {
    expect(validateWorkerCount("grand", ["w1"]))
      .toContain("requires exactly 2 workers");
    expect(validateWorkerCount("petit", ["w1", "w2"]))
      .toContain("requires exactly 1 worker");
    expect(validateWorkerCount("grand", ["w1", "w2"]))
      .toBeNull();
  });

  it("blocks capacity overflow", () => {
    const fullEnoughForGrand = [
      { service_type: "grand" as const },
      { service_type: "grand" as const },
    ];

    expect(validateCapacity(fullEnoughForGrand, "grand"))
      .toBe("Maximum capacity reached for this time slot.");
    expect(validateCapacity(fullEnoughForGrand, "petit"))
      .toBeNull();
  });

  it("checks required request fields", () => {
    expect(validateRequiredFields({})).toBe("Client name is required.");
    expect(
      validateRequiredFields({
        client_name: "Client",
        address: "Address",
        service_type: "grand",
        scheduled_date: "2026-04-03",
        timeslot: "morning",
      }),
    ).toBeNull();
  });

  it("validates allowed status transitions", () => {
    expect(canTransitionStatus("incoming", "scheduled")).toBe(true);
    expect(canTransitionStatus("incoming", "completed")).toBe(false);
    expect(canTransitionStatus("on_site", "scheduled")).toBe(true);
    expect(canTransitionStatus("pending_review", "on_site")).toBe(true);
    expect(canTransitionStatus("pending_review", "completed")).toBe(true);
    expect(canTransitionStatus("completed", "pending_review")).toBe(true);
    expect(canTransitionStatus("cancelled", "incoming")).toBe(true);
    expect(canTransitionStatus("completed", "scheduled")).toBe(false);
  });
});
