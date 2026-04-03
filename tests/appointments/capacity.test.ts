import { describe, expect, it } from "vitest";
import {
  TOTAL_SLOT_CAPACITY,
  buildSlotCapacity,
  canFitService,
  getRemainingCapacityHint,
  getRemainingCredits,
  getRequiredWorkers,
  getServiceCredits,
  getSlotUsedCredits,
} from "@/lib/appointments/capacity";

describe("appointments capacity", () => {
  it("uses expected capacity constants", () => {
    expect(TOTAL_SLOT_CAPACITY).toBe(5);
    expect(getServiceCredits("grand")).toBe(2);
    expect(getServiceCredits("petit")).toBe(1);
    expect(getRequiredWorkers("grand")).toBe(2);
    expect(getRequiredWorkers("petit")).toBe(1);
  });

  it("computes used and remaining credits correctly", () => {
    const slot = [
      { service_type: "grand" as const },
      { service_type: "petit" as const },
      { service_type: "petit" as const },
    ];

    expect(getSlotUsedCredits(slot)).toBe(4);
    expect(getRemainingCredits(slot)).toBe(1);
  });

  it("checks fit for next service by slot capacity", () => {
    const almostFull = [
      { service_type: "grand" as const },
      { service_type: "grand" as const },
    ];

    expect(canFitService(almostFull, "petit")).toBe(true);
    expect(canFitService(almostFull, "grand")).toBe(false);
  });

  it("builds complete slot capacity info", () => {
    const slot = [
      { service_type: "grand" as const },
      { service_type: "petit" as const },
    ];

    expect(buildSlotCapacity(slot)).toEqual({
      used: 3,
      remaining: 2,
      total: 5,
      can_fit_grand: true,
      can_fit_petit: true,
    });
  });

  it("returns clear remaining capacity hints", () => {
    expect(getRemainingCapacityHint(0)).toContain("slot full");
    expect(getRemainingCapacityHint(1)).toContain("1 Petit");
    expect(getRemainingCapacityHint(4)).toContain("2 Grand or 4 Petit");
  });
});
