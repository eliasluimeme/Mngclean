"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  AppointmentInput,
  AppointmentStatus,
  AppointmentWithAssignments,
  Worker,
} from "@/lib/appointments/types";

interface UseAppointmentsResult {
  appointments: AppointmentWithAssignments[];
  workers: Worker[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createAppointment: (payload: AppointmentInput) => Promise<void>;
  updateAppointment: (id: string, payload: Partial<AppointmentInput>) => Promise<void>;
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  createWorker: (payload: Partial<Worker> & { name: string }) => Promise<void>;
  updateWorker: (id: string, payload: Partial<Worker>) => Promise<void>;
  deleteWorker: (id: string) => Promise<void>;
}

interface UseAppointmentsOptions {
  from: string;
  to: string;
}

function isDateInRange(date: string, from: string, to: string): boolean {
  return date >= from && date <= to;
}

function isAppointmentInRange(
  appointment: Pick<AppointmentWithAssignments, "scheduled_date">,
  from: string,
  to: string,
): boolean {
  return isDateInRange(appointment.scheduled_date, from, to);
}

function upsertAppointmentInRange(
  current: AppointmentWithAssignments[],
  next: AppointmentWithAssignments,
  from: string,
  to: string,
): AppointmentWithAssignments[] {
  if (!isAppointmentInRange(next, from, to)) {
    return current.filter((appointment) => appointment.id !== next.id);
  }

  let found = false;
  const updated = current.map((appointment) => {
    if (appointment.id !== next.id) {
      return appointment;
    }

    found = true;
    return next;
  });

  return found ? updated : [...updated, next];
}

function rollbackAppointment(
  current: AppointmentWithAssignments[],
  previous: AppointmentWithAssignments | null,
  id: string,
  from: string,
  to: string,
): AppointmentWithAssignments[] {
  if (!previous || !isAppointmentInRange(previous, from, to)) {
    return current.filter((appointment) => appointment.id !== id);
  }

  const exists = current.some((appointment) => appointment.id === id);
  if (!exists) {
    return [...current, previous];
  }

  return current.map((appointment) => (appointment.id === id ? previous : appointment));
}

function mapAppointmentsError(message: string): string {
  const normalized = message.toLowerCase();

  if (
    (normalized.includes("start_time") || normalized.includes("end_time")) &&
    (normalized.includes("does not exist") || normalized.includes("schema cache"))
  ) {
    return "Supabase schema is missing appointment time columns. Apply the appointments time migration, then refresh.";
  }

  return message;
}

async function requestJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || "Request failed.");
  }

  return data as T;
}

export function useAppointments(options: UseAppointmentsOptions): UseAppointmentsResult {
  const [appointments, setAppointments] = useState<AppointmentWithAssignments[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mutationVersionRef = useRef<Record<string, number>>({});

  const getNextMutationVersion = useCallback((id: string) => {
    const nextVersion = (mutationVersionRef.current[id] || 0) + 1;
    mutationVersionRef.current[id] = nextVersion;
    return nextVersion;
  }, []);

  const isCurrentMutation = useCallback(
    (id: string, version: number) => mutationVersionRef.current[id] === version,
    [],
  );

  const range = useMemo(
    () => ({ from: options.from, to: options.to }),
    [options.from, options.to],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [appointmentsData, workersData] = await Promise.all([
        requestJson<AppointmentWithAssignments[]>(
          `/api/appointments?from=${range.from}&to=${range.to}`,
        ),
        requestJson<Worker[]>("/api/workers"),
      ]);

      setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
      setWorkers(Array.isArray(workersData) ? workersData : []);
    } catch (err: any) {
      setError(mapAppointmentsError(err?.message || "Failed to load appointments."));
      setAppointments([]);
      setWorkers([]);
    } finally {
      setLoading(false);
    }
  }, [range.from, range.to]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createAppointment = useCallback(
    async (payload: AppointmentInput) => {
      await requestJson<AppointmentWithAssignments>("/api/appointments", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      await refresh();
    },
    [refresh],
  );

  const updateAppointment = useCallback(
    async (id: string, payload: Partial<AppointmentInput>) => {
      const previousAppointment = appointments.find((appointment) => appointment.id === id) ?? null;
      const mutationVersion = getNextMutationVersion(id);

      setError(null);
      setAppointments((current) => {
        const next = current.map((appointment) => {
          if (appointment.id !== id) {
            return appointment;
          }

          return {
            ...appointment,
            ...payload,
          };
        });

        return next.filter((appointment) => isAppointmentInRange(appointment, range.from, range.to));
      });

      try {
        const updatedAppointment = await requestJson<AppointmentWithAssignments>(`/api/appointments/${id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });

        if (!isCurrentMutation(id, mutationVersion)) {
          return;
        }

        setAppointments((current) =>
          upsertAppointmentInRange(current, updatedAppointment, range.from, range.to),
        );
      } catch (err: any) {
        const message = mapAppointmentsError(err?.message || "Failed to update appointment.");

        if (isCurrentMutation(id, mutationVersion)) {
          setAppointments((current) =>
            rollbackAppointment(current, previousAppointment, id, range.from, range.to),
          );
        }

        setError(message);
        throw new Error(message);
      }
    },
    [appointments, getNextMutationVersion, isCurrentMutation, range.from, range.to],
  );

  const updateAppointmentStatus = useCallback(
    async (id: string, status: AppointmentStatus) => {
      const previousAppointment = appointments.find((appointment) => appointment.id === id) ?? null;
      const mutationVersion = getNextMutationVersion(id);

      setError(null);
      setAppointments((current) =>
        current.map((appointment) =>
          appointment.id === id
            ? {
                ...appointment,
                status,
              }
            : appointment,
        ),
      );

      try {
        const updatedAppointment = await requestJson<AppointmentWithAssignments>(`/api/appointments/${id}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        });

        if (!isCurrentMutation(id, mutationVersion)) {
          return;
        }

        setAppointments((current) =>
          upsertAppointmentInRange(current, updatedAppointment, range.from, range.to),
        );
      } catch (err: any) {
        const message = mapAppointmentsError(err?.message || "Failed to update appointment status.");

        if (isCurrentMutation(id, mutationVersion)) {
          setAppointments((current) =>
            rollbackAppointment(current, previousAppointment, id, range.from, range.to),
          );
        }

        setError(message);
        throw new Error(message);
      }
    },
    [appointments, getNextMutationVersion, isCurrentMutation, range.from, range.to],
  );

  const deleteAppointment = useCallback(
    async (id: string) => {
      await requestJson<{ success: boolean }>(`/api/appointments/${id}`, {
        method: "DELETE",
      });
      await refresh();
    },
    [refresh],
  );

  const createWorker = useCallback(
    async (payload: Partial<Worker> & { name: string }) => {
      await requestJson<Worker>("/api/workers", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      await refresh();
    },
    [refresh],
  );

  const updateWorker = useCallback(
    async (id: string, payload: Partial<Worker>) => {
      await requestJson<Worker>(`/api/workers/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      await refresh();
    },
    [refresh],
  );

  const deleteWorker = useCallback(
    async (id: string) => {
      await requestJson<{ success: boolean }>(`/api/workers/${id}`, {
        method: "DELETE",
      });
      await refresh();
    },
    [refresh],
  );

  return {
    appointments,
    workers,
    loading,
    error,
    refresh,
    createAppointment,
    updateAppointment,
    updateAppointmentStatus,
    deleteAppointment,
    createWorker,
    updateWorker,
    deleteWorker,
  };
}
