"use client";

import { Home, ListChecks, PhoneCall, Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getAppointmentTimeLabel } from "@/lib/appointments/time";
import type { AppointmentWithAssignments } from "@/lib/appointments/types";

interface AppointmentCardProps {
  appointment: AppointmentWithAssignments;
  onEdit: (appointment: AppointmentWithAssignments) => void;
  onCallClient?: (appointment: AppointmentWithAssignments) => void;
  onViewChecklist?: (appointment: AppointmentWithAssignments) => void;
  draggable?: boolean;
  onDragStart?: (appointmentId: string) => void;
}

function getInitials(name: string): string {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 0) return "WK";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function AppointmentCard({
  appointment,
  onEdit,
  onCallClient,
  onViewChecklist,
  draggable = false,
  onDragStart,
}: AppointmentCardProps) {
  const isGrand = appointment.service_type === "grand";
  const themeColor = isGrand ? "#818CF8" : "#2DD4BF";
  const serviceLabel = isGrand ? "Grand Menage" : "Petit Menage";
  const missingWorkers = Math.max(0, appointment.required_workers - appointment.worker_ids.length);
  const workerLabel = `${appointment.worker_ids.length}/${appointment.required_workers}`;

  return (
    <Card
      className="cursor-pointer border-l-4 shadow-sm transition hover:shadow-md"
      style={{ borderLeftColor: themeColor }}
      draggable={draggable}
      onDragStart={(event) => {
        event.dataTransfer.setData("appointmentId", appointment.id);
        onDragStart?.(appointment.id);
      }}
      onClick={() => onEdit(appointment)}
    >
      <CardContent className="space-y-3 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-foreground">{appointment.client_name}</p>
            <p className="line-clamp-2 text-[11px] leading-4 text-muted-foreground">{appointment.address}</p>
          </div>
          <Badge
            className="shrink-0 border-transparent px-2 py-1 text-[10px] font-semibold text-white"
            style={{ backgroundColor: themeColor }}
          >
            <Home className="mr-1 h-3.5 w-3.5" />
            {serviceLabel}
          </Badge>
        </div>

        <div className="flex items-center justify-between gap-2 rounded-md border border-border/70 bg-muted/20 px-2 py-1.5">
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate text-[11px] font-semibold text-foreground">{getAppointmentTimeLabel(appointment)}</p>
            <span className="text-[10px] text-muted-foreground">{workerLabel} workers</span>
          </div>
          <div className="flex items-center -space-x-2">
            {appointment.assignments.map((assignment) => (
              <Avatar key={assignment.worker_id} className="relative h-7 w-7 border-2 border-background">
                <AvatarImage src={assignment.worker?.avatar_url || undefined} alt={assignment.worker?.name || "Worker"} />
                <AvatarFallback className="text-[10px]">
                  {getInitials(assignment.worker?.name || "Worker")}
                </AvatarFallback>
                {assignment.worker?.status === "on_site" && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-background bg-emerald-500" />
                )}
              </Avatar>
            ))}

            {Array.from({ length: missingWorkers }).map((_, index) => (
              <div
                key={`missing-${appointment.id}-${index}`}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-muted-foreground/50 bg-background text-muted-foreground"
              >
                <Plus className="h-3 w-3" />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-[11px]"
            onClick={(event) => {
              event.stopPropagation();
              onCallClient?.(appointment);
            }}
          >
            <PhoneCall className="mr-1 h-3.5 w-3.5" />
            Call Client
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-[11px]"
            onClick={(event) => {
              event.stopPropagation();
              onViewChecklist?.(appointment);
            }}
          >
            <ListChecks className="mr-1 h-3.5 w-3.5" />
            Checklist
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
