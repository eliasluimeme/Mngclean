import { beforeEach, describe, expect, it, vi } from "vitest";

const hoisted = vi.hoisted(() => {
  const getAppointmentById = vi.fn();
  const getAppointmentsRange = vi.fn();
  const getSlotAppointments = vi.fn();
  const getUnavailableWorkerIds = vi.fn();
  const requireAdminApiAccess = vi.fn();

  const appointmentSubscriptionsInsert = vi.fn();
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
    appointmentSubscriptionsInsert,
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

describe("POST /api/appointments subscription flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hoisted.requireAdminApiAccess.mockResolvedValue(null);

    hoisted.getSlotAppointments.mockResolvedValue([]);
    hoisted.getUnavailableWorkerIds.mockResolvedValue([]);

    hoisted.appointmentSubscriptionsInsert.mockImplementation(() => ({
      select: () => ({
        single: async () => ({ data: { id: "sub-1" }, error: null }),
      }),
    }));

    hoisted.appointmentsInsert.mockImplementation((payload: any) => ({
      select: async () => {
        const rows = Array.isArray(payload)
          ? payload.map((item: any, index: number) => ({
              id: `apt-${index + 1}`,
              scheduled_date: item.scheduled_date,
            }))
          : [{ id: "apt-1", scheduled_date: payload.scheduled_date }];

        return { data: rows, error: null };
      },
    }));

    hoisted.appointmentsDelete.mockImplementation(() => ({
      in: async () => ({ error: null }),
      eq: async () => ({ error: null }),
    }));

    hoisted.assignmentsInsert.mockResolvedValue({ error: null });

    hoisted.from.mockImplementation((table: string) => {
      if (table === "appointment_subscriptions") {
        return {
          insert: hoisted.appointmentSubscriptionsInsert,
          delete: hoisted.appointmentsDelete,
        };
      }

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

  it("creates recurring appointments for selected weekdays", async () => {
    const response = await POST(
      buildRequest({
        client_name: "Recurring Client",
        address: "Street 100",
        service_type: "grand",
        scheduled_date: "2026-04-06",
        timeslot: "morning",
        start_time: "10:00",
        end_time: "11:00",
        worker_ids: ["w1", "w2"],
        subscription: {
          enabled: true,
          cadence: "weekly",
          duration_unit: "weeks",
          duration_count: 2,
          weekdays: [1, 2],
          weekday_time_overrides: [
            { weekday: 1, start_time: "10:00", end_time: "11:00" },
            { weekday: 2, start_time: "11:00", end_time: "12:00" },
          ],
        },
      }),
    );

    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(hoisted.appointmentSubscriptionsInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        cadence: "weekly",
        repeat_every_weeks: 1,
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
      }),
    );
    expect(hoisted.appointmentsInsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ scheduled_date: "2026-04-06", start_time: "10:00", end_time: "11:00" }),
        expect.objectContaining({ scheduled_date: "2026-04-07", start_time: "11:00", end_time: "12:00" }),
        expect.objectContaining({ scheduled_date: "2026-04-13", start_time: "10:00", end_time: "11:00" }),
        expect.objectContaining({ scheduled_date: "2026-04-14", start_time: "11:00", end_time: "12:00" }),
      ]),
    );
    expect(hoisted.assignmentsInsert).toHaveBeenCalled();
    expect(payload).toEqual(
      expect.objectContaining({
        subscription_id: "sub-1",
        created_count: 4,
      }),
    );
  });

  it("rejects subscription when selected weekdays exclude appointment day", async () => {
    const response = await POST(
      buildRequest({
        client_name: "Recurring Client",
        address: "Street 200",
        service_type: "petit",
        scheduled_date: "2026-04-06",
        timeslot: "morning",
        worker_ids: ["w1"],
        subscription: {
          enabled: true,
          duration_unit: "weeks",
          duration_count: 2,
          weekdays: [2],
        },
      }),
    );

    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain("must include the selected appointment day");
    expect(hoisted.appointmentSubscriptionsInsert).not.toHaveBeenCalled();
    expect(hoisted.appointmentsInsert).not.toHaveBeenCalled();
  });

  it("creates bi-weekly recurring appointments", async () => {
    const response = await POST(
      buildRequest({
        client_name: "Biweekly Client",
        address: "Street 300",
        service_type: "petit",
        scheduled_date: "2026-04-06",
        timeslot: "morning",
        start_time: "09:00",
        end_time: "10:00",
        worker_ids: ["w1"],
        subscription: {
          enabled: true,
          cadence: "biweekly",
          duration_unit: "weeks",
          duration_count: 4,
          weekdays: [1],
          weekday_time_overrides: [
            { weekday: 1, start_time: "09:00", end_time: "10:00" },
          ],
        },
      }),
    );

    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(hoisted.appointmentSubscriptionsInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        cadence: "biweekly",
        repeat_every_weeks: 2,
      }),
    );
    expect(hoisted.appointmentsInsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ scheduled_date: "2026-04-06" }),
        expect.objectContaining({ scheduled_date: "2026-04-20" }),
      ]),
    );
    expect(payload).toEqual(
      expect.objectContaining({
        created_count: 2,
      }),
    );
  });
});
