import type {
  Appointment,
  AppointmentSettings,
  ServiceType,
  ServiceWorkerRequirements,
  SlotCapacity,
} from "@/lib/appointments/types";

export const DEFAULT_TOTAL_SLOT_CAPACITY = 5;

export const DEFAULT_SERVICE_WORKER_REQUIREMENTS: ServiceWorkerRequirements = {
  grand: 2,
  petit: 1,
};

export const TOTAL_SLOT_CAPACITY = DEFAULT_TOTAL_SLOT_CAPACITY;

export const SERVICE_CREDITS: Record<ServiceType, number> = {
  ...DEFAULT_SERVICE_WORKER_REQUIREMENTS,
};

interface CapacityOptions {
  serviceWorkerRequirements?: Partial<ServiceWorkerRequirements> | null;
  totalSlotCapacity?: number | null;
}

function toPositiveInteger(value: unknown, fallback: number): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.floor(parsed);
}

export function normalizeServiceWorkerRequirements(
  requirements?: Partial<ServiceWorkerRequirements> | null,
): ServiceWorkerRequirements {
  return {
    grand: toPositiveInteger(requirements?.grand, DEFAULT_SERVICE_WORKER_REQUIREMENTS.grand),
    petit: toPositiveInteger(requirements?.petit, DEFAULT_SERVICE_WORKER_REQUIREMENTS.petit),
  };
}

export function resolveCapacityOptions(options?: CapacityOptions): {
  serviceWorkerRequirements: ServiceWorkerRequirements;
  totalSlotCapacity: number;
} {
  const serviceWorkerRequirements = normalizeServiceWorkerRequirements(options?.serviceWorkerRequirements);
  const requestedTotal = toPositiveInteger(options?.totalSlotCapacity, DEFAULT_TOTAL_SLOT_CAPACITY);

  return {
    serviceWorkerRequirements,
    totalSlotCapacity: Math.max(
      requestedTotal,
      serviceWorkerRequirements.grand,
      serviceWorkerRequirements.petit,
    ),
  };
}

export function resolveAppointmentSettings(settings?: Partial<AppointmentSettings> | null): AppointmentSettings {
  const { serviceWorkerRequirements, totalSlotCapacity } = resolveCapacityOptions({
    serviceWorkerRequirements: settings?.service_worker_requirements,
    totalSlotCapacity: settings?.total_slot_capacity,
  });

  return {
    service_worker_requirements: serviceWorkerRequirements,
    total_slot_capacity: totalSlotCapacity,
  };
}

export const DEFAULT_APPOINTMENT_SETTINGS: AppointmentSettings = resolveAppointmentSettings();

export function getServiceCredits(
  serviceType: ServiceType,
  serviceWorkerRequirements?: Partial<ServiceWorkerRequirements> | null,
): number {
  const requirements = normalizeServiceWorkerRequirements(serviceWorkerRequirements);
  return requirements[serviceType];
}

export function getRequiredWorkers(
  serviceType: ServiceType,
  serviceWorkerRequirements?: Partial<ServiceWorkerRequirements> | null,
): number {
  return getServiceCredits(serviceType, serviceWorkerRequirements);
}

export function getSlotUsedCredits(
  appointments: Pick<Appointment, "service_type">[],
  serviceWorkerRequirements?: Partial<ServiceWorkerRequirements> | null,
): number {
  return appointments.reduce(
    (total, appointment) => total + getServiceCredits(appointment.service_type, serviceWorkerRequirements),
    0,
  );
}

export function getRemainingCredits(
  appointments: Pick<Appointment, "service_type">[],
  options?: CapacityOptions,
): number {
  const { totalSlotCapacity, serviceWorkerRequirements } = resolveCapacityOptions(options);
  const used = getSlotUsedCredits(appointments, serviceWorkerRequirements);
  return Math.max(0, totalSlotCapacity - used);
}

export function canFitService(
  appointments: Pick<Appointment, "service_type">[],
  nextServiceType: ServiceType,
  options?: CapacityOptions,
): boolean {
  const { totalSlotCapacity, serviceWorkerRequirements } = resolveCapacityOptions(options);
  const used = getSlotUsedCredits(appointments, serviceWorkerRequirements);
  return used + getServiceCredits(nextServiceType, serviceWorkerRequirements) <= totalSlotCapacity;
}

export function buildSlotCapacity(
  appointments: Pick<Appointment, "service_type">[],
  options?: CapacityOptions,
): SlotCapacity {
  const { totalSlotCapacity, serviceWorkerRequirements } = resolveCapacityOptions(options);
  const used = getSlotUsedCredits(appointments, serviceWorkerRequirements);
  const remaining = Math.max(0, totalSlotCapacity - used);

  return {
    used,
    remaining,
    total: totalSlotCapacity,
    can_fit_grand: remaining >= serviceWorkerRequirements.grand,
    can_fit_petit: remaining >= serviceWorkerRequirements.petit,
  };
}

export function getRemainingCapacityHint(
  remaining: number,
  options?: Pick<CapacityOptions, "serviceWorkerRequirements">,
): string {
  const requirements = normalizeServiceWorkerRequirements(options?.serviceWorkerRequirements);

  if (remaining <= 0) {
    return "Remaining: 0 workers (slot full)";
  }

  const grandFit = Math.floor(remaining / requirements.grand);
  const petitFit = Math.floor(remaining / requirements.petit);

  if (grandFit <= 0 && petitFit <= 0) {
    return `Remaining: ${remaining} workers`;
  }

  if (petitFit === 1 && grandFit === 0) {
    return "Remaining: 1 worker (Can fit 1 Petit)";
  }

  return `Remaining: ${remaining} workers (Can fit ${grandFit} Grand or ${petitFit} Petit)`;
}
