import { beforeEach, describe, expect, it, vi } from "vitest";

const hoisted = vi.hoisted(() => {
  const getAppointmentById = vi.fn();
  const getSlotAppointments = vi.fn();
  const requireAdminApiAccess = vi.fn();

  const update = vi.fn();
  const updateEq = vi.fn();
  const from = vi.fn();

  return {
    getAppointmentById,
    getSlotAppointments,
    requireAdminApiAccess,
    update,
    updateEq,
    from,
  };
});

vi.mock("@/lib/appointments/server", () => ({
  getAppointmentById: hoisted.getAppointmentById,
  getSlotAppointments: hoisted.getSlotAppointments,
}));

vi.mock("@/lib/admin-api", () => ({
  requireAdminApiAccess: hoisted.requireAdminApiAccess,
}));

vi.mock("@/lib/supabase-server", () => ({
  supabase: {
    from: hoisted.from,
  },
}));

import { PATCH } from "@/app/api/appointments/[id]/status/route";

function requestWithStatus(status: unknown): Request {
  return new Request("http://localhost/api/appointments/apt-1/status", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });
}

const baseAppointment = {
  id: "apt-1",
  service_type: "grand",
  scheduled_date: "2026-04-14",
  timeslot: "morning",
  worker_ids: ["w1", "w2"],
  required_workers: 2,
};

describe("PATCH /api/appointments/[id]/status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hoisted.requireAdminApiAccess.mockResolvedValue(null);

    hoisted.getSlotAppointments.mockResolvedValue([]);
    hoisted.updateEq.mockResolvedValue({ error: null });
    hoisted.update.mockReturnValue({ eq: hoisted.updateEq });
    hoisted.from.mockReturnValue({ update: hoisted.update });
  });

  it("rejects invalid status payload", async () => {
    const response = await PATCH(requestWithStatus("bad_status"), {
      params: Promise.resolve({ id: "apt-1" }),
    });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe("Invalid status value.");
    expect(hoisted.getAppointmentById).not.toHaveBeenCalled();
  });

  it("returns 404 when appointment is missing", async () => {
    hoisted.getAppointmentById.mockResolvedValueOnce(null);

    const response = await PATCH(requestWithStatus("scheduled"), {
      params: Promise.resolve({ id: "missing" }),
    });
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload.error).toBe("Appointment not found.");
    expect(hoisted.update).not.toHaveBeenCalled();
  });

  it("blocks invalid state transition", async () => {
    hoisted.getAppointmentById.mockResolvedValueOnce({
      ...baseAppointment,
      status: "incoming",
      service_type: "petit",
      worker_ids: ["w1"],
      required_workers: 1,
    });

    const response = await PATCH(requestWithStatus("completed"), {
      params: Promise.resolve({ id: "apt-1" }),
    });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain("Invalid status transition from incoming to completed");
    expect(hoisted.update).not.toHaveBeenCalled();
  });

  it("allows rollback transition from pending_review to on_site", async () => {
    hoisted.getAppointmentById
      .mockResolvedValueOnce({
        ...baseAppointment,
        status: "pending_review",
      })
      .mockResolvedValueOnce({
        ...baseAppointment,
        status: "on_site",
      });

    const response = await PATCH(requestWithStatus("on_site"), {
      params: Promise.resolve({ id: "apt-1" }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(hoisted.update).toHaveBeenCalledWith({ status: "on_site" });
    expect(payload.status).toBe("on_site");
  });

  it("blocks scheduling transition when required workers are missing (drag-drop guard edge)", async () => {
    hoisted.getAppointmentById.mockResolvedValueOnce({
      ...baseAppointment,
      status: "incoming",
      worker_ids: ["w1"],
      required_workers: 2,
    });

    const response = await PATCH(requestWithStatus("scheduled"), {
      params: Promise.resolve({ id: "apt-1" }),
    });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain("Grand Menage requires exactly 2 workers");
    expect(hoisted.update).not.toHaveBeenCalled();
  });

  it("blocks transition when slot capacity would overflow", async () => {
    hoisted.getAppointmentById.mockResolvedValueOnce({
      ...baseAppointment,
      status: "scheduled",
    });

    hoisted.getSlotAppointments.mockResolvedValueOnce([
      { service_type: "grand" },
      { service_type: "grand" },
    ]);

    const response = await PATCH(requestWithStatus("on_site"), {
      params: Promise.resolve({ id: "apt-1" }),
    });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe("Maximum capacity reached for this time slot.");
    expect(hoisted.update).not.toHaveBeenCalled();
  });

  it("updates status when transition is valid", async () => {
    hoisted.getAppointmentById
      .mockResolvedValueOnce({
        ...baseAppointment,
        status: "scheduled",
      })
      .mockResolvedValueOnce({
        ...baseAppointment,
        status: "on_site",
      });

    const response = await PATCH(requestWithStatus("on_site"), {
      params: Promise.resolve({ id: "apt-1" }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(hoisted.from).toHaveBeenCalledWith("appointments");
    expect(hoisted.update).toHaveBeenCalledWith({ status: "on_site" });
    expect(hoisted.updateEq).toHaveBeenCalledWith("id", "apt-1");
    expect(payload.status).toBe("on_site");
  });

  it("retries with legacy status token when database has old status constraint", async () => {
    hoisted.getAppointmentById
      .mockResolvedValueOnce({
        ...baseAppointment,
        status: "scheduled",
      })
      .mockResolvedValueOnce({
        ...baseAppointment,
        status: "on_site",
      });

    hoisted.updateEq
      .mockResolvedValueOnce({ error: { code: "23514", message: "appointments_status_check" } })
      .mockResolvedValueOnce({ error: null });

    const response = await PATCH(requestWithStatus("on_site"), {
      params: Promise.resolve({ id: "apt-1" }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(hoisted.update).toHaveBeenNthCalledWith(1, { status: "on_site" });
    expect(hoisted.update).toHaveBeenNthCalledWith(2, { status: "on-site" });
    expect(payload.status).toBe("on_site");
  });

  it("returns 500 when appointment status update fails", async () => {
    hoisted.getAppointmentById.mockResolvedValueOnce({
      ...baseAppointment,
      status: "scheduled",
    });
    hoisted.updateEq.mockResolvedValueOnce({ error: { message: "db unavailable" } });

    const response = await PATCH(requestWithStatus("on_site"), {
      params: Promise.resolve({ id: "apt-1" }),
    });
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toBe("db unavailable");
  });
});
