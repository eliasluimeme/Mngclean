"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { getRequiredWorkers, TOTAL_SLOT_CAPACITY } from "@/lib/appointments/capacity";
import { deriveTimeslotFromTime, ensureTimeRange, getDefaultTimeRangeForSlot } from "@/lib/appointments/time";
import type {
  AppointmentInput,
  AppointmentStatus,
  AppointmentWithAssignments,
  ServiceType,
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
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requiredWorkers = getRequiredWorkers(serviceType);

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

      const initialSelections = [...initialAppointment.worker_ids];
      while (initialSelections.length < getRequiredWorkers(initialAppointment.service_type)) {
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
    }

    setError(null);
  }, [open, initialAppointment, defaultDate, defaultTimeslot, defaultStartTime, defaultEndTime, preferredStatus]);

  useEffect(() => {
    const derivedTimeslot = deriveTimeslotFromTime(startTime, timeslot);
    if (derivedTimeslot !== timeslot) {
      setTimeslot(derivedTimeslot);
    }
  }, [startTime, timeslot]);

  useEffect(() => {
    setWorkerSelections((previous) => {
      const next = previous.slice(0, requiredWorkers);
      while (next.length < requiredWorkers) {
        next.push("");
      }
      return next;
    });
  }, [requiredWorkers]);

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
  const selectedServiceCost = getRequiredWorkers(serviceType);
  const isEditingSameSlotAsCurrent =
    !!initialAppointment &&
    initialAppointment.scheduled_date === scheduledDate &&
    initialAppointment.timeslot === availabilityTimeslot;
  const currentAppointmentCost =
    isEditingSameSlotAsCurrent && initialAppointment?.status !== "cancelled"
      ? getRequiredWorkers(initialAppointment.service_type)
      : 0;
  const actualCurrentSlotUsed = Math.min(TOTAL_SLOT_CAPACITY, currentSlotUsed + currentAppointmentCost);
  const shouldApplyCapacity = status !== "cancelled";
  const projectedSlotUsed = shouldApplyCapacity
    ? Math.min(TOTAL_SLOT_CAPACITY, currentSlotUsed + selectedServiceCost)
    : currentSlotUsed;
  const projectedRemaining = Math.max(0, TOTAL_SLOT_CAPACITY - projectedSlotUsed);

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

  const handleSave = async () => {
    const normalizedTimeRange = ensureTimeRange(timeslot, startTime, endTime);
    const effectiveTimeslot = normalizedTimeRange.timeslot;

    const cleanedWorkerIds = Array.from(
      new Set(workerSelections.map((workerId) => workerId.trim()).filter(Boolean)),
    );

    const needsAssignments = status !== "incoming" && status !== "cancelled";

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

    if (availability && status !== "cancelled") {
      if (serviceType === "grand" && !availability.capacity.can_fit_grand) {
        setError("Maximum capacity reached for this time slot.");
        return;
      }

      if (serviceType === "petit" && !availability.capacity.can_fit_petit) {
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
            Assign workers based on service type and current slot capacity.
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
                  <SelectItem value="grand">Grand Menage (2 workers)</SelectItem>
                  <SelectItem value="petit">Petit Menage (1 worker)</SelectItem>
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

          <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
            <p className="text-sm font-medium text-foreground">
              Worker Assignment ({requiredWorkers} required)
            </p>
            {loadingAvailability ? (
              <p className="text-xs text-muted-foreground">Checking availability...</p>
            ) : (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                    Capacity now: {actualCurrentSlotUsed}/{TOTAL_SLOT_CAPACITY} busy.
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
