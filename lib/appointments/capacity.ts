import type { Appointment, ServiceType, SlotCapacity } from "@/lib/appointments/types";

export const TOTAL_SLOT_CAPACITY = 5;

export const SERVICE_CREDITS: Record<ServiceType, number> = {
  grand: 2,
  petit: 1,
};

export function getServiceCredits(serviceType: ServiceType): number {
  return SERVICE_CREDITS[serviceType];
}

export function getRequiredWorkers(serviceType: ServiceType): number {
  return SERVICE_CREDITS[serviceType];
}

export function getSlotUsedCredits(appointments: Pick<Appointment, "service_type">[]): number {
  return appointments.reduce((total, appointment) => total + getServiceCredits(appointment.service_type), 0);
}

export function getRemainingCredits(appointments: Pick<Appointment, "service_type">[]): number {
  const used = getSlotUsedCredits(appointments);
  return Math.max(0, TOTAL_SLOT_CAPACITY - used);
}

export function canFitService(
  appointments: Pick<Appointment, "service_type">[],
  nextServiceType: ServiceType,
): boolean {
  const used = getSlotUsedCredits(appointments);
  return used + getServiceCredits(nextServiceType) <= TOTAL_SLOT_CAPACITY;
}

export function buildSlotCapacity(appointments: Pick<Appointment, "service_type">[]): SlotCapacity {
  const used = getSlotUsedCredits(appointments);
  const remaining = Math.max(0, TOTAL_SLOT_CAPACITY - used);

  return {
    used,
    remaining,
    total: TOTAL_SLOT_CAPACITY,
    can_fit_grand: remaining >= SERVICE_CREDITS.grand,
    can_fit_petit: remaining >= SERVICE_CREDITS.petit,
  };
}

export function getRemainingCapacityHint(remaining: number): string {
  if (remaining <= 0) {
    return "Remaining: 0 workers (slot full)";
  }

  if (remaining === 1) {
    return "Remaining: 1 worker (Can fit 1 Petit)";
  }

  const grandFit = Math.floor(remaining / SERVICE_CREDITS.grand);
  return `Remaining: ${remaining} workers (Can fit ${grandFit} Grand or ${remaining} Petit)`;
}
