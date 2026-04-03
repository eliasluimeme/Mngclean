import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase-server", () => ({
  supabase: {},
}));

import { getBusyWorkerIds } from "@/lib/appointments/server";

describe("worker availability filtering", () => {
  it("extracts unique busy workers from slot appointments", () => {
    const appointments = [
      { worker_ids: ["w1", "w2"] },
      { worker_ids: ["w2", "w3"] },
    ] as any;

    const busy = getBusyWorkerIds(appointments);
    expect(new Set(busy)).toEqual(new Set(["w1", "w2", "w3"]));
  });

  it("filters available workers by removing busy ids", () => {
    const workers = ["w1", "w2", "w3", "w4"];
    const appointments = [
      { worker_ids: ["w1"] },
      { worker_ids: ["w3"] },
    ] as any;

    const busySet = new Set(getBusyWorkerIds(appointments));
    const available = workers.filter((workerId) => !busySet.has(workerId));

    expect(available).toEqual(["w2", "w4"]);
  });
});
