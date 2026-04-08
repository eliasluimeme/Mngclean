"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { getRequiredWorkers } from "@/lib/appointments/capacity";
import {
  getIsoWeekdayFromDateString,
  SUBSCRIPTION_WEEKDAY_OPTIONS,
} from "@/lib/appointments/subscriptions";
import { deriveTimeslotFromTime, ensureTimeRange, getDefaultTimeRangeForSlot } from "@/lib/appointments/time";
import type {
  AppointmentInput,
  AppointmentStatus,
  AppointmentWithAssignments,
  ServiceType,
  SubscriptionCadence,
  ServiceWorkerRequirements,
  SubscriptionDurationUnit,
  Timeslot,
  Worker,
} from "@/lib/appointments/types";
import { useWorkerAvailability } from "@/hooks/use-worker-availability";

interface AddAppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: AppointmentInput, appointmentId?: string) => Promise<void>;
  onDeleteAppointment?: (appointmentId: string) => Promise<void>;
  initialAppointment?: AppointmentWithAssignments | null;
  defaultDate?: string;
  defaultTimeslot?: Timeslot;
  defaultStartTime?: string;
  defaultEndTime?: string;
  preferredStatus?: AppointmentStatus;
  serviceWorkerRequirements: ServiceWorkerRequirements;
  totalSlotCapacity: number;
}

const STATUS_OPTIONS: AppointmentStatus[] = [
  "incoming",
  "scheduled",
  "on_site",
  "pending_review",
  "completed",
  "cancelled",
];

function mergeWorkerOptions(
  availableWorkers: Worker[],
  initialAppointment: AppointmentWithAssignments | null | undefined,
): Worker[] {
  const options = new Map<string, Worker>();

  availableWorkers.forEach((worker) => {
    options.set(worker.id, worker);
  });

  initialAppointment?.assignments.forEach((assignment) => {
    if (assignment.worker) {
      options.set(assignment.worker.id, assignment.worker);
    }
  });

  return Array.from(options.values());
}

export function AddAppointmentModal({
  open,
  onOpenChange,
  onSubmit,
  onDeleteAppointment,
  initialAppointment,
  defaultDate,
  defaultTimeslot,
  defaultStartTime,
  defaultEndTime,
  preferredStatus,
  serviceWorkerRequirements,
  totalSlotCapacity,
}: AddAppointmentModalProps) {
  const [clientName, setClientName] = useState("");
  const [address, setAddress] = useState("");
  const [serviceType, setServiceType] = useState<ServiceType>("petit");
  const [scheduledDate, setScheduledDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [timeslot, setTimeslot] = useState<Timeslot>("morning");
  const [startTime, setStartTime] = useState("08:30");
  const [endTime, setEndTime] = useState("10:00");
  const [status, setStatus] = useState<AppointmentStatus>("incoming");
  const [notes, setNotes] = useState("");
  const [workerSelections, setWorkerSelections] = useState<string[]>([""]);
  const [enableSubscription, setEnableSubscription] = useState(false);
  const [subscriptionCadence, setSubscriptionCadence] = useState<SubscriptionCadence>("weekly");
  const [subscriptionDurationUnit, setSubscriptionDurationUnit] = useState<SubscriptionDurationUnit>("months");
  const [subscriptionDurationCount, setSubscriptionDurationCount] = useState("1");
  const [subscriptionWeekdays, setSubscriptionWeekdays] = useState<number[]>([]);
  const [subscriptionWeekdayTimes, setSubscriptionWeekdayTimes] = useState<
    Record<number, { start_time: string; end_time: string }>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requiredWorkers = getRequiredWorkers(serviceType, serviceWorkerRequirements);

  const getScheduledWeekday = () => {
    try {
      return getIsoWeekdayFromDateString(scheduledDate);
    } catch {
      return 1;
    }
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    if (initialAppointment) {
      setClientName(initialAppointment.client_name);
      setAddress(initialAppointment.address);
      setServiceType(initialAppointment.service_type);
      setScheduledDate(initialAppointment.scheduled_date);
      setTimeslot(initialAppointment.timeslot);
      const initialTimeRange = ensureTimeRange(
        initialAppointment.timeslot,
        initialAppointment.start_time,
        initialAppointment.end_time,
      );
      setStartTime(initialTimeRange.start);
      setEndTime(initialTimeRange.end);
      setStatus(preferredStatus || initialAppointment.status);
      setNotes(initialAppointment.notes || "");
      setEnableSubscription(false);
      setSubscriptionCadence("weekly");
      setSubscriptionDurationUnit("months");
      setSubscriptionDurationCount("1");
      const appointmentWeekday = getIsoWeekdayFromDateString(initialAppointment.scheduled_date);
      setSubscriptionWeekdays([appointmentWeekday]);
      setSubscriptionWeekdayTimes({
        [appointmentWeekday]: {
          start_time: initialTimeRange.start,
          end_time: initialTimeRange.end,
        },
      });

      const initialSelections = [...initialAppointment.worker_ids];
      while (
        initialSelections.length <
        getRequiredWorkers(initialAppointment.service_type, serviceWorkerRequirements)
      ) {
        initialSelections.push("");
      }
      setWorkerSelections(initialSelections);
    } else {
      const slotDefaults = getDefaultTimeRangeForSlot(defaultTimeslot || "morning");
      setClientName("");
      setAddress("");
      setServiceType("petit");
      setScheduledDate(defaultDate || format(new Date(), "yyyy-MM-dd"));
      setTimeslot(defaultTimeslot || "morning");
      setStartTime(defaultStartTime || slotDefaults.start);
      setEndTime(defaultEndTime || slotDefaults.end);
      setStatus(preferredStatus || "incoming");
      setNotes("");
      setWorkerSelections([""]);
      setEnableSubscription(false);
      setSubscriptionCadence("weekly");
      setSubscriptionDurationUnit("months");
      setSubscriptionDurationCount("1");
      const currentWeekday = getScheduledWeekday();
      setSubscriptionWeekdays([currentWeekday]);
      setSubscriptionWeekdayTimes({
        [currentWeekday]: {
          start_time: defaultStartTime || slotDefaults.start,
          end_time: defaultEndTime || slotDefaults.end,
        },
      });
    }

    setError(null);
  }, [
    open,
    initialAppointment,
    defaultDate,
    defaultTimeslot,
    defaultStartTime,
    defaultEndTime,
    preferredStatus,
    serviceWorkerRequirements,
  ]);

  useEffect(() => {
    const derivedTimeslot = deriveTimeslotFromTime(startTime, timeslot);
    if (derivedTimeslot !== timeslot) {
      setTimeslot(derivedTimeslot);
    }
  }, [startTime, timeslot]);

  useEffect(() => {
    if (!open || !enableSubscription || !!initialAppointment) {
      return;
    }

    const weekday = getScheduledWeekday();
    setSubscriptionWeekdays((previous) => {
      if (previous.includes(weekday)) {
        return previous;
      }

      return [...previous, weekday].sort((a, b) => a - b);
    });
  }, [scheduledDate, open, enableSubscription, initialAppointment]);

  useEffect(() => {
    if (!open || !enableSubscription || !!initialAppointment) {
      return;
    }

    setSubscriptionWeekdayTimes((previous) => {
      const next: Record<number, { start_time: string; end_time: string }> = {};

      subscriptionWeekdays.forEach((weekday) => {
        const existing = previous[weekday];
        next[weekday] =
          existing || {
            start_time: startTime,
            end_time: endTime,
          };
      });

      return next;
    });
  }, [subscriptionWeekdays, open, enableSubscription, initialAppointment, startTime, endTime]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setWorkerSelections((previous) => {
      const next = previous.slice(0, requiredWorkers);
      while (next.length < requiredWorkers) {
        next.push("");
      }
      return next;
    });
  }, [requiredWorkers, open]);

  const availabilityTimeslot = deriveTimeslotFromTime(startTime, timeslot);

  const { availability, loading: loadingAvailability } = useWorkerAvailability({
    date: scheduledDate,
    timeslot: availabilityTimeslot,
    enabled: open,
    excludeAppointmentId: initialAppointment?.id,
  });

  const workerOptions = useMemo(
    () => mergeWorkerOptions(availability?.available_workers || [], initialAppointment),
    [availability?.available_workers, initialAppointment],
  );

  const currentSlotUsed = availability?.capacity.used ?? 0;
  const selectedServiceCost = getRequiredWorkers(serviceType, serviceWorkerRequirements);
  const isEditingSameSlotAsCurrent =
    !!initialAppointment &&
    initialAppointment.scheduled_date === scheduledDate &&
    initialAppointment.timeslot === availabilityTimeslot;
  const currentAppointmentCost =
    isEditingSameSlotAsCurrent && initialAppointment?.status !== "cancelled"
      ? getRequiredWorkers(initialAppointment.service_type, serviceWorkerRequirements)
      : 0;
  const actualCurrentSlotUsed = Math.min(totalSlotCapacity, currentSlotUsed + currentAppointmentCost);
  const shouldApplyCapacity = status !== "cancelled";
  const projectedSlotUsed = shouldApplyCapacity
    ? Math.min(totalSlotCapacity, currentSlotUsed + selectedServiceCost)
    : currentSlotUsed;
  const projectedRemaining = Math.max(0, totalSlotCapacity - projectedSlotUsed);

  const isOverCapacity =
    !!availability && shouldApplyCapacity && selectedServiceCost > (availability?.capacity.remaining ?? 0);

  const willMaxOutSlot =
    !!availability && shouldApplyCapacity && selectedServiceCost === (availability?.capacity.remaining ?? 0);

  const handleWorkerSelection = (index: number, workerId: string) => {
    setWorkerSelections((previous) => {
      const next = [...previous];
      next[index] = workerId;

      next.forEach((selectedId, selectedIndex) => {
        if (selectedIndex !== index && selectedId === workerId && workerId) {
          next[selectedIndex] = "";
        }
      });

      return next;
    });
  };

  const toggleSubscriptionWeekday = (weekday: number, checked: boolean) => {
    setSubscriptionWeekdays((previous) => {
      if (checked) {
        return Array.from(new Set([...previous, weekday])).sort((a, b) => a - b);
      }

      return previous.filter((day) => day !== weekday);
    });

    setSubscriptionWeekdayTimes((previous) => {
      if (checked) {
        return {
          ...previous,
          [weekday]: previous[weekday] || {
            start_time: startTime,
            end_time: endTime,
          },
        };
      }

      const next = { ...previous };
      delete next[weekday];
      return next;
    });
  };

  const updateSubscriptionWeekdayTime = (
    weekday: number,
    field: "start_time" | "end_time",
    value: string,
  ) => {
    setSubscriptionWeekdayTimes((previous) => ({
      ...previous,
      [weekday]: {
        ...(previous[weekday] || {
          start_time: startTime,
          end_time: endTime,
        }),
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    const normalizedTimeRange = ensureTimeRange(timeslot, startTime, endTime);
    const effectiveTimeslot = normalizedTimeRange.timeslot;

    const cleanedWorkerIds = Array.from(
      new Set(workerSelections.map((workerId) => workerId.trim()).filter(Boolean)),
    );

    const needsAssignments = status !== "incoming" && status !== "cancelled";
    let subscriptionPayload: AppointmentInput["subscription"] = null;

    if (!clientName.trim()) {
      setError("Client name is required.");
      return;
    }

    if (!address.trim()) {
      setError("Address is required.");
      return;
    }

    if ((needsAssignments || cleanedWorkerIds.length > 0) && cleanedWorkerIds.length !== requiredWorkers) {
      setError(
        `${serviceType === "grand" ? "Grand" : "Petit"} Menage requires exactly ${requiredWorkers} worker${requiredWorkers > 1 ? "s" : ""}.`,
      );
      return;
    }

    if (enableSubscription && !initialAppointment) {
      const parsedDurationCount = Number(subscriptionDurationCount);
      if (!Number.isFinite(parsedDurationCount) || parsedDurationCount < 1) {
        setError("Subscription duration count must be a positive number.");
        return;
      }

      const normalizedWeekdays = Array.from(
        new Set(subscriptionWeekdays.filter((day) => Number.isInteger(day) && day >= 1 && day <= 7)),
      ).sort((a, b) => a - b);

      if (normalizedWeekdays.length === 0) {
        setError("Select at least one weekday for the subscription.");
        return;
      }

      const scheduledWeekday = getScheduledWeekday();
      if (!normalizedWeekdays.includes(scheduledWeekday)) {
        setError("Subscription days must include the selected appointment day.");
        return;
      }

      const weekdayTimeOverrides = normalizedWeekdays.map((weekday) => {
        const configured = subscriptionWeekdayTimes[weekday] || {
          start_time: startTime,
          end_time: endTime,
        };

        const normalizedWeekdayTimeRange = ensureTimeRange(
          deriveTimeslotFromTime(configured.start_time, timeslot),
          configured.start_time,
          configured.end_time,
        );

        return {
          weekday,
          start_time: normalizedWeekdayTimeRange.start,
          end_time: normalizedWeekdayTimeRange.end,
        };
      });

      subscriptionPayload = {
        enabled: true,
        cadence: subscriptionCadence,
        duration_unit: subscriptionDurationUnit,
        duration_count: Math.floor(parsedDurationCount),
        weekdays: normalizedWeekdays,
        weekday_time_overrides: weekdayTimeOverrides,
      };
    }

    if (availability && status !== "cancelled") {
      if (selectedServiceCost > availability.capacity.remaining) {
        setError("Maximum capacity reached for this time slot.");
        return;
      }
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload: AppointmentInput = {
        client_name: clientName.trim(),
        address: address.trim(),
        service_type: serviceType,
        scheduled_date: scheduledDate,
        timeslot: effectiveTimeslot,
        start_time: normalizedTimeRange.start,
        end_time: normalizedTimeRange.end,
        status,
        notes: notes.trim() || null,
        worker_ids: cleanedWorkerIds,
        subscription: subscriptionPayload,
      };

      await onSubmit(payload, initialAppointment?.id);
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.message || "Failed to save appointment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!initialAppointment || !onDeleteAppointment) {
      return;
    }

    const confirmed = window.confirm(`Delete appointment for ${initialAppointment.client_name}?`);
    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      await onDeleteAppointment(initialAppointment.id);
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.message || "Failed to delete appointment.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initialAppointment ? "Edit Appointment" : "Add Appointment"}</DialogTitle>
          <DialogDescription>
            Assign workers based on configured service requirements and current slot capacity.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-1">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Unable to save</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-2">
            <Label htmlFor="client-name">Client Name</Label>
            <Input
              id="client-name"
              value={clientName}
              onChange={(event) => setClientName(event.target.value)}
              placeholder="Client full name"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Service location"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={scheduledDate}
                onChange={(event) => setScheduledDate(event.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label>Timeslot</Label>
              <Select
                value={timeslot}
                onValueChange={(value) => {
                  const nextTimeslot = value as Timeslot;
                  const defaults = getDefaultTimeRangeForSlot(nextTimeslot);
                  setTimeslot(nextTimeslot);
                  setStartTime(defaults.start);
                  setEndTime(defaults.end);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timeslot" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning (08:00 - 12:00)</SelectItem>
                  <SelectItem value="evening">Evening (13:00 - 17:00)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="start-time">Start Time</Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="end-time">End Time</Label>
              <Input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Service Type</Label>
              <Select value={serviceType} onValueChange={(value) => setServiceType(value as ServiceType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grand">
                    Grand Menage ({getRequiredWorkers("grand", serviceWorkerRequirements)} workers)
                  </SelectItem>
                  <SelectItem value="petit">
                    Petit Menage ({getRequiredWorkers("petit", serviceWorkerRequirements)} workers)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as AppointmentStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((statusOption) => (
                    <SelectItem key={statusOption} value={statusOption}>
                      {statusOption.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">Recurring Subscription</p>
                <p className="text-xs text-muted-foreground">
                  Automatically create fixed appointments for selected weekdays.
                </p>
              </div>
              <Switch
                checked={enableSubscription}
                onCheckedChange={(checked) => {
                  setEnableSubscription(checked);
                  if (checked && subscriptionWeekdays.length === 0) {
                    setSubscriptionWeekdays([getScheduledWeekday()]);
                  }
                }}
                disabled={!!initialAppointment}
              />
            </div>

            {initialAppointment ? (
              <p className="text-xs text-muted-foreground">
                Subscription setup is available when creating a new appointment.
              </p>
            ) : enableSubscription ? (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="grid gap-2">
                    <Label>Cadence</Label>
                    <Select
                      value={subscriptionCadence}
                      onValueChange={(value) => setSubscriptionCadence(value as SubscriptionCadence)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select cadence" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="biweekly">Bi-weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>Duration Unit</Label>
                    <Select
                      value={subscriptionDurationUnit}
                      onValueChange={(value) => setSubscriptionDurationUnit(value as SubscriptionDurationUnit)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weeks">Weeks</SelectItem>
                        <SelectItem value="months">Months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="subscription-duration-count">
                      Duration Count ({subscriptionDurationUnit === "weeks" ? "week(s)" : "month(s)"})
                    </Label>
                    <Input
                      id="subscription-duration-count"
                      type="number"
                      min={1}
                      value={subscriptionDurationCount}
                      onChange={(event) => setSubscriptionDurationCount(event.target.value)}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Repeats every {subscriptionCadence === "biweekly" ? "2 weeks" : "week"} for {Math.max(1, Math.floor(Number(subscriptionDurationCount) || 1))} {Math.max(1, Math.floor(Number(subscriptionDurationCount) || 1)) === 1
                        ? (subscriptionDurationUnit === "weeks" ? "week" : "month")
                        : subscriptionDurationUnit}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Repeat On</Label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-7">
                    {SUBSCRIPTION_WEEKDAY_OPTIONS.map((weekdayOption) => {
                      const checked = subscriptionWeekdays.includes(weekdayOption.value);

                      return (
                        <label
                          key={weekdayOption.value}
                          className="flex items-center gap-2 rounded-md border bg-background px-2 py-1.5 text-xs"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(value) =>
                              toggleSubscriptionWeekday(weekdayOption.value, value === true)
                            }
                          />
                          <span>{weekdayOption.shortLabel}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {subscriptionWeekdays.length > 0 && (
                  <div className="space-y-2">
                    <Label>Weekday Times</Label>
                    <div className="space-y-2">
                      {subscriptionWeekdays.map((weekday) => {
                        const weekdayOption = SUBSCRIPTION_WEEKDAY_OPTIONS.find(
                          (option) => option.value === weekday,
                        );
                        const weekdayTime = subscriptionWeekdayTimes[weekday] || {
                          start_time: startTime,
                          end_time: endTime,
                        };

                        return (
                          <div
                            key={`subscription-weekday-time-${weekday}`}
                            className="grid gap-2 rounded-md border bg-background p-2 sm:grid-cols-[120px_1fr_1fr] sm:items-center"
                          >
                            <p className="text-xs font-medium text-foreground">
                              {weekdayOption?.label || `Day ${weekday}`}
                            </p>
                            <Input
                              type="time"
                              value={weekdayTime.start_time}
                              onChange={(event) =>
                                updateSubscriptionWeekdayTime(weekday, "start_time", event.target.value)
                              }
                            />
                            <Input
                              type="time"
                              value={weekdayTime.end_time}
                              onChange={(event) =>
                                updateSubscriptionWeekdayTime(weekday, "end_time", event.target.value)
                              }
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>

          <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
            <p className="text-sm font-medium text-foreground">
              Worker Assignment ({requiredWorkers} required)
            </p>
            {loadingAvailability ? (
              <p className="text-xs text-muted-foreground">Checking availability...</p>
            ) : (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                    Capacity now: {actualCurrentSlotUsed}/{totalSlotCapacity} busy.
                </p>
                {isOverCapacity && (
                  <p className="text-xs font-medium text-rose-500">
                    Maximum capacity reached for this time slot.
                  </p>
                )}
                {!isOverCapacity && willMaxOutSlot && (
                  <p className="text-xs font-medium text-amber-500">
                    This booking will max out this slot.
                  </p>
                )}
              </div>
            )}

            <div className="grid gap-2 sm:grid-cols-2">
              {workerSelections.map((selection, index) => {
                const selectedElsewhere = new Set(
                  workerSelections.filter((value, valueIndex) => valueIndex !== index && value),
                );

                return (
                  <Select
                    key={`worker-select-${index}`}
                    value={selection || "__none__"}
                    onValueChange={(value) => handleWorkerSelection(index, value === "__none__" ? "" : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Select Worker ${index + 1}`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Unassigned</SelectItem>
                      {workerOptions
                        .filter((worker) => !selectedElsewhere.has(worker.id) || worker.id === selection)
                        .map((worker) => (
                          <SelectItem key={worker.id} value={worker.id}>
                            {worker.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                );
              })}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional notes for the team"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          {initialAppointment && onDeleteAppointment && (
            <Button
              type="button"
              variant="destructive"
              className="mr-auto"
              onClick={handleDelete}
              disabled={submitting || deleting}
            >
              {deleting ? "Deleting..." : "Delete Appointment"}
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={submitting || deleting}>
            {submitting ? "Saving..." : initialAppointment ? "Update Appointment" : "Create Appointment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
