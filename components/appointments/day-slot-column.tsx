"use client";

import { format } from "date-fns";
import { Plus } from "lucide-react";
import { AppointmentCard } from "@/components/appointments/appointment-card";
import { CapacityMeter } from "@/components/appointments/capacity-meter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRemainingCapacityHint, getSlotUsedCredits, TOTAL_SLOT_CAPACITY } from "@/lib/appointments/capacity";
import type { AppointmentWithAssignments, Timeslot } from "@/lib/appointments/types";
import { cn } from "@/lib/utils";

interface DaySlotColumnProps {
  date: Date;
  morningAppointments: AppointmentWithAssignments[];
  eveningAppointments: AppointmentWithAssignments[];
  onAddAppointment: (date: string, timeslot: Timeslot) => void;
  onEditAppointment: (appointment: AppointmentWithAssignments) => void;
  timelinePercent: number | null;
}

function SlotSection({
  label,
  timeLabel,
  timeslot,
  appointments,
  date,
  onAddAppointment,
  onEditAppointment,
}: {
  label: string;
  timeLabel: string;
  timeslot: Timeslot;
  appointments: AppointmentWithAssignments[];
  date: Date;
  onAddAppointment: (date: string, timeslot: Timeslot) => void;
  onEditAppointment: (appointment: AppointmentWithAssignments) => void;
}) {
  const used = getSlotUsedCredits(appointments);
  const remainingHint = getRemainingCapacityHint(Math.max(0, TOTAL_SLOT_CAPACITY - used));

  return (
    <div className="space-y-3 rounded-lg border border-border/60 bg-muted/10 p-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-foreground">{label}</h4>
          <p className="text-[11px] text-muted-foreground">{timeLabel}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => onAddAppointment(format(date, "yyyy-MM-dd"), timeslot)}
        >
          <Plus className="mr-1 h-3 w-3" />
          Add
        </Button>
      </div>

      <CapacityMeter used={used} total={TOTAL_SLOT_CAPACITY} label="Workers Busy" />
      <p className="text-[11px] text-muted-foreground">{remainingHint}</p>

      <div className="space-y-2">
        {appointments.map((appointment) => (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
            onEdit={onEditAppointment}
            onCallClient={(item) => {
              window.alert(`Call ${item.client_name} at saved contact details.`);
            }}
            onViewChecklist={(item) => {
              window.alert(`Open checklist for ${item.client_name}.`);
            }}
          />
        ))}

        {appointments.length === 0 && (
          <div className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
            No appointments in this slot
          </div>
        )}
      </div>
    </div>
  );
}

export function DaySlotColumn({
  date,
  morningAppointments,
  eveningAppointments,
  onAddAppointment,
  onEditAppointment,
  timelinePercent,
}: DaySlotColumnProps) {
  return (
    <Card className="relative rounded-xl border border-border/60 bg-card/70 shadow-sm backdrop-blur-sm">
      <CardHeader className="pb-2 pt-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span>{format(date, "EEE")}</span>
          <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
            {format(date, "MMM d")}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-1">
        <SlotSection
          label="Morning"
          timeLabel="08:00 - 12:00"
          timeslot="morning"
          appointments={morningAppointments}
          date={date}
          onAddAppointment={onAddAppointment}
          onEditAppointment={onEditAppointment}
        />

        <SlotSection
          label="Evening"
          timeLabel="13:00 - 17:00"
          timeslot="evening"
          appointments={eveningAppointments}
          date={date}
          onAddAppointment={onAddAppointment}
          onEditAppointment={onEditAppointment}
        />
      </CardContent>

      {timelinePercent !== null && (
        <div
          className={cn("pointer-events-none absolute left-0 right-0 z-10 h-0.5 bg-sky-500")}
          style={{ top: `${Math.min(97, Math.max(9, timelinePercent))}%` }}
        />
      )}
    </Card>
  );
}
