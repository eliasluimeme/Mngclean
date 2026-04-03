import { beforeEach, describe, expect, it, vi } from "vitest";

const hoisted = vi.hoisted(() => {
  const getAppointmentById = vi.fn();
  const getAppointmentsRange = vi.fn();
  const getSlotAppointments = vi.fn();
  const getUnavailableWorkerIds = vi.fn();
  const requireAdminApiAccess = vi.fn();

  const appointmentsInsert = vi.fn();
  const appointmentsDelete = vi.fn();
  const assignmentsInsert = vi.fn();
  const from = vi.fn();

  return {
    getAppointmentById,
    getAppointmentsRange,
    getSlotAppointments,
    getUnavailableWorkerIds,
    requireAdminApiAccess,
    appointmentsInsert,
    appointmentsDelete,
    assignmentsInsert,
    from,
  };
});

vi.mock("@/lib/appointments/server", () => ({
  getAppointmentById: hoisted.getAppointmentById,
  getAppointmentsRange: hoisted.getAppointmentsRange,
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

import { POST } from "@/app/api/appointments/route";

function buildRequest(body: unknown): Request {
  return new Request("http://localhost/api/appointments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/appointments add flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hoisted.requireAdminApiAccess.mockResolvedValue(null);

    hoisted.getSlotAppointments.mockResolvedValue([]);
    hoisted.getUnavailableWorkerIds.mockResolvedValue([]);
    hoisted.getAppointmentById.mockResolvedValue({ id: "apt-1", client_name: "Client" });

    hoisted.appointmentsInsert.mockImplementation(() => ({
      select: () => ({
        single: async () => ({ data: { id: "apt-1" }, error: null }),
      }),
    }));

    hoisted.appointmentsDelete.mockImplementation(() => ({
      eq: async () => ({ error: null }),
    }));

    hoisted.assignmentsInsert.mockResolvedValue({ error: null });

    hoisted.from.mockImplementation((table: string) => {
      if (table === "appointments") {
        return {
          insert: hoisted.appointmentsInsert,
          delete: hoisted.appointmentsDelete,
        };
      }

      if (table === "appointment_assignments") {
        return {
          insert: hoisted.assignmentsInsert,
        };
      }

      throw new Error(`Unexpected table mock: ${table}`);
    });
  });

  it("creates a grand appointment and assignments when data is valid", async () => {
    const response = await POST(
      buildRequest({
        client_name: "Client One",
        address: "Street 1",
        service_type: "grand",
        scheduled_date: "2026-04-10",
        timeslot: "morning",
        worker_ids: ["w1", "w2"],
      }),
    );

    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(hoisted.appointmentsInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        client_name: "Client One",
        service_type: "grand",
        status: "scheduled",
      }),
    );
    expect(hoisted.assignmentsInsert).toHaveBeenCalledWith([
      { appointment_id: "apt-1", worker_id: "w1" },
      { appointment_id: "apt-1", worker_id: "w2" },
    ]);
    expect(payload).toEqual(expect.objectContaining({ id: "apt-1" }));
  });

  it("blocks create when slot capacity is exceeded", async () => {
    hoisted.getSlotAppointments.mockResolvedValue([
      { service_type: "grand" },
      { service_type: "grand" },
    ]);

    const response = await POST(
      buildRequest({
        client_name: "Client Capacity",
        address: "Street 2",
        service_type: "grand",
        scheduled_date: "2026-04-10",
        timeslot: "morning",
        worker_ids: ["w1", "w2"],
      }),
    );

    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe("Maximum capacity reached for this time slot.");
    expect(hoisted.appointmentsInsert).not.toHaveBeenCalled();
  });

  it("blocks create when grand has fewer than two workers", async () => {
    const response = await POST(
      buildRequest({
        client_name: "Client Missing Worker",
        address: "Street 3",
        service_type: "grand",
        scheduled_date: "2026-04-11",
        timeslot: "evening",
        worker_ids: ["w1"],
      }),
    );

    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain("Grand Menage requires exactly 2 workers");
    expect(hoisted.appointmentsInsert).not.toHaveBeenCalled();
  });

  it("blocks create when selected workers are unavailable", async () => {
    hoisted.getUnavailableWorkerIds.mockResolvedValue(["w2"]);

    const response = await POST(
      buildRequest({
        client_name: "Client Busy Worker",
        address: "Street 4",
        service_type: "petit",
        scheduled_date: "2026-04-12",
        timeslot: "morning",
        worker_ids: ["w2"],
      }),
    );

    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain("already assigned");
    expect(payload.unavailable_worker_ids).toEqual(["w2"]);
    expect(hoisted.appointmentsInsert).not.toHaveBeenCalled();
  });
});
