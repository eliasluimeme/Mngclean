import {
  DEFAULT_APPOINTMENT_SETTINGS,
  normalizeServiceWorkerRequirements,
  resolveAppointmentSettings,
} from "@/lib/appointments/capacity";
import { supabase } from "@/lib/supabase-server";
import type { AppointmentSettings } from "@/lib/appointments/types";

const SETTINGS_TABLE = "appointment_settings";
const SETTINGS_SELECT = "id, grand_workers, petit_workers, total_slot_capacity";

interface DatabaseErrorLike {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}

function normalizeDatabaseError(error: unknown): { code: string; text: string } {
  const dbError = (error || {}) as DatabaseErrorLike;
  const code = String(dbError.code || "").toUpperCase();
  const text = `${dbError.message || ""} ${dbError.details || ""} ${dbError.hint || ""}`.toLowerCase();

  return { code, text };
}

function isMissingSettingsTableError(error: unknown): boolean {
  const { code, text } = normalizeDatabaseError(error);

  if (code === "42P01" || code === "PGRST205") {
    return true;
  }

  return text.includes("appointment_settings") && (text.includes("does not exist") || text.includes("schema cache"));
}

function shouldFallbackToDefaultSettings(error: unknown): boolean {
  if (isMissingSettingsTableError(error)) {
    return true;
  }

  const { text } = normalizeDatabaseError(error);

  if (text.includes("unexpected table mock") && text.includes("appointment_settings")) {
    return true;
  }

  if (text.includes("select is not a function") || text.includes("maybesingle is not a function")) {
    return true;
  }

  return false;
}

function mapSettingsRow(row: any): AppointmentSettings {
  return resolveAppointmentSettings({
    service_worker_requirements: {
      grand: row?.grand_workers,
      petit: row?.petit_workers,
    },
    total_slot_capacity: row?.total_slot_capacity,
  });
}

export async function getAppointmentSettings(): Promise<AppointmentSettings> {
  try {
    const { data, error } = await supabase
      .from(SETTINGS_TABLE)
      .select(SETTINGS_SELECT)
      .eq("id", true)
      .maybeSingle();

    if (error) {
      if (shouldFallbackToDefaultSettings(error)) {
        return DEFAULT_APPOINTMENT_SETTINGS;
      }

      throw new Error(error.message);
    }

    if (!data) {
      return DEFAULT_APPOINTMENT_SETTINGS;
    }

    return mapSettingsRow(data);
  } catch (error: any) {
    if (shouldFallbackToDefaultSettings(error)) {
      return DEFAULT_APPOINTMENT_SETTINGS;
    }

    throw error;
  }
}

export async function updateAppointmentSettings(
  payload: Partial<AppointmentSettings>,
): Promise<AppointmentSettings> {
  const currentSettings = await getAppointmentSettings();

  const nextRequirements = normalizeServiceWorkerRequirements(
    payload.service_worker_requirements || currentSettings.service_worker_requirements,
  );
  const requestedTotalCapacity =
    payload.total_slot_capacity ?? currentSettings.total_slot_capacity;

  if (requestedTotalCapacity < Math.max(nextRequirements.grand, nextRequirements.petit)) {
    throw new Error(
      "Total slot capacity must be greater than or equal to the highest service worker requirement.",
    );
  }

  const resolvedSettings = resolveAppointmentSettings({
    service_worker_requirements: nextRequirements,
    total_slot_capacity: requestedTotalCapacity,
  });

  const upsertPayload = {
    id: true,
    grand_workers: resolvedSettings.service_worker_requirements.grand,
    petit_workers: resolvedSettings.service_worker_requirements.petit,
    total_slot_capacity: resolvedSettings.total_slot_capacity,
  };

  const { data, error } = await supabase
    .from(SETTINGS_TABLE)
    .upsert(upsertPayload, { onConflict: "id" })
    .select(SETTINGS_SELECT)
    .single();

  if (error) {
    if (isMissingSettingsTableError(error)) {
      throw new Error(
        "Appointment settings table is missing. Run the appointment settings SQL migration in Supabase and try again.",
      );
    }

    throw new Error(error.message);
  }

  return mapSettingsRow(data);
}
