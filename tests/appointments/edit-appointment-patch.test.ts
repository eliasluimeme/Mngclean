import { beforeEach, describe, expect, it, vi } from "vitest";

const hoisted = vi.hoisted(() => {
  const getAppointmentById = vi.fn();
  const getSlotAppointments = vi.fn();
  const getUnavailableWorkerIds = vi.fn();
  const requireAdminApiAccess = vi.fn();

  const appointmentsUpdate = vi.fn();
  const appointmentsUpdateEq = vi.fn();

  const assignmentsDelete = vi.fn();
  const assignmentsDeleteEq = vi.fn();
  const assignmentsInsert = vi.fn();

  const from = vi.fn();

  return {
    getAppointmentById,
    getSlotAppointments,
    getUnavailableWorkerIds,
    requireAdminApiAccess,
    appointmentsUpdate,
    appointmentsUpdateEq,
    assignmentsDelete,
    assignmentsDeleteEq,
    assignmentsInsert,
    from,
  };
});

vi.mock("@/lib/appointments/server", () => ({
  getAppointmentById: hoisted.getAppointmentById,
  getSlotAppointments: hoisted.getSlotAppointments,
  getUnavailableWorkerIds: hoisted.getUnavailableWorkerIds,
}));

vi.mock("@/lib/admin-api", () => ({
  requireAdminApiAccess: hoisted.requireAdminApiAccess,
}));

vi.mock("@/lib/supabase-server", () => ({
  supabase: {
    from: hoisted.from,
  },
}));

import { PATCH } from "@/app/api/appointments/[id]/route";

function buildRequest(body: unknown): Request {
  return new Request("http://localhost/api/appointments/apt-1", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

const existingGrandAppointment = {
  id: "apt-1",
  client_name: "Client One",
  address: "Old Address",
  service_type: "grand",
  scheduled_date: "2026-04-20",
  timeslot: "morning",
  status: "scheduled",
  notes: "Old notes",
  worker_ids: ["w1", "w2"],
  required_workers: 2,
};

describe("PATCH /api/appointments/[id] edit flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hoisted.requireAdminApiAccess.mockResolvedValue(null);

    hoisted.getSlotAppointments.mockResolvedValue([]);
    hoisted.getUnavailableWorkerIds.mockResolvedValue([]);

    hoisted.appointmentsUpdateEq.mockResolvedValue({ error: null });
    hoisted.appointmentsUpdate.mockReturnValue({
      eq: hoisted.appointmentsUpdateEq,
    });

    hoisted.assignmentsDeleteEq.mockResolvedValue({ error: null });
    hoisted.assignmentsDelete.mockReturnValue({
      eq: hoisted.assignmentsDeleteEq,
    });

    hoisted.assignmentsInsert.mockResolvedValue({ error: null });

    hoisted.from.mockImplementation((table: string) => {
      if (table === "appointments") {
        return {
          update: hoisted.appointmentsUpdate,
        };
      }

      if (table === "appointment_assignments") {
        return {
          delete: hoisted.assignmentsDelete,
          insert: hoisted.assignmentsInsert,
        };
      }

      throw new Error(`Unexpected table mock: ${table}`);
    });
  });

  it("reassigns workers during edit when worker_ids are updated", async () => {
    hoisted.getAppointmentById
      .mockResolvedValueOnce(existingGrandAppointment)
      .mockResolvedValueOnce({
        ...existingGrandAppointment,
        worker_ids: ["w3", "w4"],
      });

    const response = await PATCH(
      buildRequest({
        worker_ids: ["w3", "w4"],
        notes: "Updated assignment",
      }),
      { params: Promise.resolve({ id: "apt-1" }) },
    );

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(hoisted.appointmentsUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ notes: "Updated assignment" }),
    );
    expect(hoisted.assignmentsDeleteEq).toHaveBeenCalledWith("appointment_id", "apt-1");
    expect(hoisted.assignmentsInsert).toHaveBeenCalledWith([
      { appointment_id: "apt-1", worker_id: "w3" },
      { appointment_id: "apt-1", worker_id: "w4" },
    ]);
    expect(payload.worker_ids).toEqual(["w3", "w4"]);
  });

  it("blocks slot-change edit when target slot capacity is exceeded", async () => {
    hoisted.getAppointmentById.mockResolvedValueOnce(existingGrandAppointment);
    hoisted.getSlotAppointments.mockResolvedValueOnce([
      { service_type: "grand" },
      { service_type: "grand" },
    ]);

    const response = await PATCH(
      buildRequest({
        timeslot: "evening",
      }),
      { params: Promise.resolve({ id: "apt-1" }) },
    );

    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe("Maximum capacity reached for this time slot.");
    expect(hoisted.appointmentsUpdate).not.toHaveBeenCalled();
  });

  it("blocks edit reassignment when new workers are unavailable in chosen slot", async () => {
    hoisted.getAppointmentById.mockResolvedValueOnce(existingGrandAppointment);
    hoisted.getUnavailableWorkerIds.mockResolvedValueOnce(["w4"]);

    const response = await PATCH(
      buildRequest({
        worker_ids: ["w3", "w4"],
        scheduled_date: "2026-04-21",
        timeslot: "evening",
      }),
      { params: Promise.resolve({ id: "apt-1" }) },
    );

    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain("already assigned in this slot");
    expect(payload.unavailable_worker_ids).toEqual(["w4"]);
    expect(hoisted.appointmentsUpdate).not.toHaveBeenCalled();
  });

  it("keeps assignments untouched when worker_ids are not part of patch payload", async () => {
    hoisted.getAppointmentById
      .mockResolvedValueOnce({
        ...existingGrandAppointment,
        service_type: "petit",
        worker_ids: ["w1"],
        required_workers: 1,
      })
      .mockResolvedValueOnce({
        ...existingGrandAppointment,
        service_type: "petit",
        worker_ids: ["w1"],
        required_workers: 1,
        address: "New Address",
      });

    const response = await PATCH(
      buildRequest({
        address: "New Address",
      }),
      { params: Promise.resolve({ id: "apt-1" }) },
    );

    expect(response.status).toBe(200);
    expect(hoisted.appointmentsUpdate).toHaveBeenCalled();
    expect(hoisted.assignmentsDelete).not.toHaveBeenCalled();
    expect(hoisted.assignmentsInsert).not.toHaveBeenCalled();
  });

  it("returns 500 when clearing previous assignments fails", async () => {
    hoisted.getAppointmentById.mockResolvedValue(existingGrandAppointment);
    hoisted.assignmentsDeleteEq.mockResolvedValueOnce({ error: { message: "clear failed" } });

    const response = await PATCH(
      buildRequest({
        worker_ids: ["w3", "w4"],
      }),
      { params: Promise.resolve({ id: "apt-1" }) },
    );

    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toBe("clear failed");
    expect(hoisted.assignmentsInsert).not.toHaveBeenCalled();
  });

  it("returns 500 when inserting new assignment rows fails", async () => {
    hoisted.getAppointmentById.mockResolvedValue(existingGrandAppointment);
    hoisted.assignmentsInsert.mockResolvedValueOnce({ error: { message: "insert failed" } });

    const response = await PATCH(
      buildRequest({
        worker_ids: ["w3", "w4"],
      }),
      { params: Promise.resolve({ id: "apt-1" }) },
    );

    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toBe("insert failed");
  });
});
