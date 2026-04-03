"use client";

import { BoardColumn } from "@/components/appointments/board-column";
import { Card, CardContent } from "@/components/ui/card";
import type { AppointmentStatus, AppointmentWithAssignments } from "@/lib/appointments/types";

interface BoardViewProps {
  appointments: AppointmentWithAssignments[];
  onMoveCard: (appointmentId: string, targetStatus: AppointmentStatus) => void;
  onEditAppointment: (appointment: AppointmentWithAssignments) => void;
}

const COLUMNS: { status: AppointmentStatus; title: string }[] = [
  { status: "incoming", title: "Incoming / New" },
  { status: "scheduled", title: "Scheduled" },
  { status: "on_site", title: "On-Site" },
  { status: "pending_review", title: "Pending Review" },
  { status: "completed", title: "Completed" },
];

export function BoardView({ appointments, onMoveCard, onEditAppointment }: BoardViewProps) {
  const counts = {
    total: appointments.length,
    incoming: appointments.filter((appointment) => appointment.status === "incoming").length,
    onSite: appointments.filter((appointment) => appointment.status === "on_site").length,
    pendingReview: appointments.filter((appointment) => appointment.status === "pending_review").length,
  };

  return (
    <div className="space-y-4">
      <Card className="rounded-xl border">
        <CardContent className="grid grid-cols-2 gap-3 p-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-muted-foreground">Total Jobs</p>
            <p className="text-lg font-semibold">{counts.total}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Incoming</p>
            <p className="text-lg font-semibold">{counts.incoming}</p>
          </div>
          <div>
            <p className="text-muted-foreground">On-Site</p>
            <p className="text-lg font-semibold">{counts.onSite}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Pending Review</p>
            <p className="text-lg font-semibold">{counts.pendingReview}</p>
          </div>
        </CardContent>
      </Card>

      <div className="overflow-x-auto">
        <div className="grid min-w-[1350px] grid-cols-5 gap-3">
          {COLUMNS.map((column) => (
            <BoardColumn
              key={column.status}
              title={column.title}
              status={column.status}
              appointments={appointments.filter((appointment) => appointment.status === column.status)}
              onMoveCard={onMoveCard}
              onEditAppointment={onEditAppointment}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
