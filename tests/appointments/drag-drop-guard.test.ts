import { describe, expect, it } from "vitest";
import { evaluateBoardMoveGuard } from "@/lib/appointments/drag-drop-guards";

const baseAppointment = {
  id: "apt-1",
  service_type: "grand",
  worker_ids: ["w1", "w2"],
  required_workers: 2,
} as any;

describe("drag-drop scheduling guard", () => {
  it("blocks scheduling a grand appointment with missing workers", () => {
    const result = evaluateBoardMoveGuard(
      {
        ...baseAppointment,
        service_type: "grand",
        worker_ids: ["w1"],
        required_workers: 2,
      },
      "scheduled",
    );

    expect(result.blocked).toBe(true);
    expect(result.preferredStatus).toBe("scheduled");
    expect(result.error).toContain("Grand Menage needs 2 workers");
  });

  it("blocks scheduling a petit appointment with no worker", () => {
    const result = evaluateBoardMoveGuard(
      {
        ...baseAppointment,
        service_type: "petit",
        worker_ids: [],
        required_workers: 1,
      },
      "scheduled",
    );

    expect(result.blocked).toBe(true);
    expect(result.error).toContain("Petit Menage needs 1 worker");
  });

  it("allows scheduling when exact worker requirement is met", () => {
    const result = evaluateBoardMoveGuard(baseAppointment, "scheduled");
    expect(result).toEqual({ blocked: false });
  });

  it("allows non-scheduled drops even if assignment is incomplete", () => {
    const result = evaluateBoardMoveGuard(
      {
        ...baseAppointment,
        worker_ids: ["w1"],
        required_workers: 2,
      },
      "on_site",
    );

    expect(result).toEqual({ blocked: false });
  });

  it("blocks when appointment id is stale and item cannot be found", () => {
    const result = evaluateBoardMoveGuard(undefined, "scheduled");

    expect(result.blocked).toBe(true);
    expect(result.error).toBe("Appointment no longer exists.");
  });
});
