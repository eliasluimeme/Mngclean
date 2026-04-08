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

export function isMissingAppointmentTimeColumnError(error: unknown): boolean {
  const { code, text } = normalizeDatabaseError(error);

  const referencesTimeColumns = text.includes("start_time") || text.includes("end_time");
  const missingColumnMessage = text.includes("does not exist") || text.includes("schema cache");

  if (!referencesTimeColumns || !missingColumnMessage) {
    return false;
  }

  if (code === "42703" || code === "PGRST204") {
    return true;
  }

  return text.includes("appointments");
}

export function isMissingSubscriptionFeatureError(error: unknown): boolean {
  const { code, text } = normalizeDatabaseError(error);

  const referencesSubscriptionSchema =
    text.includes("appointment_subscriptions") || text.includes("subscription");
  const missingSchemaMessage =
    text.includes("does not exist") || text.includes("schema cache") || text.includes("unknown table");

  if (!referencesSubscriptionSchema || !missingSchemaMessage) {
    return false;
  }

  if (code === "42P01" || code === "42703" || code === "PGRST204" || code === "PGRST205") {
    return true;
  }

  return true;
}
