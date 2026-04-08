export type ServiceType = "grand" | "petit";

export type Timeslot = "morning" | "evening";

export type SubscriptionDurationUnit = "weeks" | "months";

export type SubscriptionCadence = "weekly" | "biweekly";

export interface SubscriptionWeekdayTimeOverride {
  weekday: number;
  start_time: string;
  end_time: string;
}

export interface AppointmentSubscriptionInput {
  enabled: boolean;
  cadence?: SubscriptionCadence;
  duration_unit: SubscriptionDurationUnit;
  duration_count: number;
  weekdays: number[];
  weekday_time_overrides?: SubscriptionWeekdayTimeOverride[];
}

export interface ServiceWorkerRequirements {
  grand: number;
  petit: number;
}

export interface AppointmentSettings {
  service_worker_requirements: ServiceWorkerRequirements;
  total_slot_capacity: number;
}

export type AppointmentStatus =
  | "incoming"
  | "scheduled"
  | "on_site"
  | "pending_review"
  | "completed"
  | "cancelled";

export type WorkerStatus = "available" | "on_site" | "off_duty";

export interface Worker {
  id: string;
  name: string;
  avatar_url: string | null;
  phone: string | null;
  is_active: boolean;
  status: WorkerStatus;
  created_at: string;
}

export interface Appointment {
  id: string;
  client_name: string;
  address: string;
  service_type: ServiceType;
  scheduled_date: string;
  timeslot: Timeslot;
  start_time: string | null;
  end_time: string | null;
  status: AppointmentStatus;
  notes: string | null;
  subscription_id?: string | null;
  created_at: string;
}

export interface AppointmentAssignment {
  appointment_id: string;
  worker_id: string;
  created_at: string;
  worker?: Worker;
}

export interface AppointmentWithAssignments extends Appointment {
  assignments: AppointmentAssignment[];
  worker_ids: string[];
  required_workers: number;
  used_credits: number;
}

export interface AppointmentInput {
  client_name: string;
  address: string;
  service_type: ServiceType;
  scheduled_date: string;
  timeslot: Timeslot;
  start_time?: string | null;
  end_time?: string | null;
  status?: AppointmentStatus;
  notes?: string | null;
  worker_ids: string[];
  subscription?: AppointmentSubscriptionInput | null;
}

export interface SlotCapacity {
  used: number;
  remaining: number;
  total: number;
  can_fit_grand: boolean;
  can_fit_petit: boolean;
}

export interface SlotAvailability {
  date: string;
  timeslot: Timeslot;
  capacity: SlotCapacity;
  available_workers: Worker[];
  busy_worker_ids: string[];
  settings: AppointmentSettings;
}
