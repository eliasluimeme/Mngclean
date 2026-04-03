"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppointmentCard } from "@/components/appointments/appointment-card";
import type { AppointmentStatus, AppointmentWithAssignments } from "@/lib/appointments/types";

interface BoardColumnProps {
  title: string;
  status: AppointmentStatus;
  appointments: AppointmentWithAssignments[];
  onMoveCard: (appointmentId: string, targetStatus: AppointmentStatus) => void;
  onEditAppointment: (appointment: AppointmentWithAssignments) => void;
}

export function BoardColumn({
  title,
  status,
  appointments,
  onMoveCard,
  onEditAppointment,
}: BoardColumnProps) {
  return (
    <Card
      className="min-h-[520px] rounded-xl border bg-card/70 shadow-sm"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const appointmentId = event.dataTransfer.getData("appointmentId");
        if (appointmentId) {
          onMoveCard(appointmentId, status);
        }
      }}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span>{title}</span>
          <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {appointments.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {appointments.map((appointment) => (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
            onEdit={onEditAppointment}
            draggable
          />
        ))}

        {appointments.length === 0 && (
          <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
            Drop appointments here
          </div>
        )}
      </CardContent>
    </Card>
  );
}
