"use client";

import { useEffect, useState } from "react";
import type { SlotAvailability, Timeslot } from "@/lib/appointments/types";

interface UseWorkerAvailabilityOptions {
  date: string;
  timeslot: Timeslot;
  enabled?: boolean;
  excludeAppointmentId?: string;
}

interface UseWorkerAvailabilityResult {
  availability: SlotAvailability | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

async function fetchAvailability(
  date: string,
  timeslot: Timeslot,
  excludeAppointmentId?: string,
): Promise<SlotAvailability> {
  const params = new URLSearchParams({ date, timeslot });

  if (excludeAppointmentId) {
    params.set("excludeAppointmentId", excludeAppointmentId);
  }

  const response = await fetch(`/api/availability?${params.toString()}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "Failed to fetch availability.");
  }

  return data as SlotAvailability;
}

export function useWorkerAvailability({
  date,
  timeslot,
  enabled = true,
  excludeAppointmentId,
}: UseWorkerAvailabilityOptions): UseWorkerAvailabilityResult {
  const [availability, setAvailability] = useState<SlotAvailability | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = async () => {
    if (!enabled || !date) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchAvailability(date, timeslot, excludeAppointmentId);
      setAvailability(result);
    } catch (err: any) {
      setError(err?.message || "Failed to fetch availability.");
      setAvailability(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, timeslot, enabled, excludeAppointmentId]);

  return {
    availability,
    loading,
    error,
    refetch,
  };
}
