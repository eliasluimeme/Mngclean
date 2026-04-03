"use client";

import {
  format,
  getDay,
  parse,
  setHours,
  setMinutes,
  startOfWeek,
} from "date-fns";
import { enUS } from "date-fns/locale";
import { useMemo, useState } from "react";
import { Calendar as BigCalendar, dateFnsLocalizer, Views } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import type { CalendarRangeMode } from "@/components/appointments/appointments-topbar";
import { deriveTimeslotFromTime, getAppointmentDateRange } from "@/lib/appointments/time";
import type {
  AppointmentInput,
  AppointmentWithAssignments,
  Timeslot,
} from "@/lib/appointments/types";

interface CalendarViewProps {
  mode: CalendarRangeMode;
  selectedDate: Date;
  appointments: AppointmentWithAssignments[];
  onSelectDate: (date: Date) => void;
  onAddAppointment: (
    date: string,
    timeslot: Timeslot,
    startTime?: string,
    endTime?: string,
  ) => void;
  onEditAppointment: (appointment: AppointmentWithAssignments) => void;
  onRescheduleAppointment: (
    appointmentId: string,
    payload: Pick<AppointmentInput, "scheduled_date" | "timeslot" | "start_time" | "end_time">,
  ) => Promise<void>;
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales: {
    "en-US": enUS,
  },
});

const DraggableCalendar = withDragAndDrop(BigCalendar as any);

const VIEW_BY_MODE: Record<CalendarRangeMode, string> = {
  day: Views.DAY,
  week: Views.WEEK,
  month: Views.MONTH,
};

interface CalendarEventMeta {
  simultaneousCount: number;
  simultaneousIndex: number;
  overflowCount: number;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: false;
  resource: AppointmentWithAssignments;
  meta: CalendarEventMeta;
  durationMinutes: number;
}

function getEventTheme(appointment: AppointmentWithAssignments): {
  background: string;
  borderColor: string;
  textColor: string;
} {
  if (appointment.status === "cancelled") {
    return {
      background: "linear-gradient(135deg, #475569 0%, #334155 100%)",
      borderColor: "rgba(203, 213, 225, 0.45)",
      textColor: "#f8fafc",
    };
  }

  if (appointment.service_type === "grand") {
    return {
      background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)",
      borderColor: "rgba(147, 197, 253, 0.45)",
      textColor: "#eff6ff",
    };
  }

  return {
    background: "linear-gradient(135deg, #0f766e 0%, #0d9488 100%)",
    borderColor: "rgba(153, 246, 228, 0.45)",
    textColor: "#ecfeff",
  };
}

function asTimeLabel(date: Date): string {
  return format(date, "HH:mm");
}

function getClientInitials(name: string): string {
  const tokens = name.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return "CL";
  if (tokens.length === 1) return tokens[0].slice(0, 2).toUpperCase();
  return `${tokens[0][0]}${tokens[1][0]}`.toUpperCase();
}

function toCompactClientName(name: string): string {
  const compact = name.trim();
  if (compact.length <= 14) {
    return compact;
  }

  const tokens = compact.split(/\s+/).filter(Boolean);
  if (tokens.length > 1) {
    return `${tokens[0]} ${tokens[1][0]}.`;
  }

  return `${compact.slice(0, 13)}...`;
}

function buildCalendarEvents(appointments: AppointmentWithAssignments[]): CalendarEvent[] {
  const baseEvents = appointments.map((appointment) => {
    const { start, end } = getAppointmentDateRange(appointment);
    const durationMinutes = Math.max(15, Math.round((end.getTime() - start.getTime()) / (60 * 1000)));
    return {
      id: appointment.id,
      title: `${appointment.client_name} - ${asTimeLabel(start)} to ${asTimeLabel(end)}`,
      start,
      end,
      allDay: false as const,
      resource: appointment,
      durationMinutes,
    };
  });

  const groupedByTimeslot = new Map<string, Array<(typeof baseEvents)[number]>>();
  for (const event of baseEvents) {
    const key = `${event.start.toISOString()}|${event.end.toISOString()}`;
    const group = groupedByTimeslot.get(key);
    if (group) {
      group.push(event);
    } else {
      groupedByTimeslot.set(key, [event]);
    }
  }

  const eventMeta = new Map<string, CalendarEventMeta>();
  for (const group of groupedByTimeslot.values()) {
    const sortedGroup = [...group].sort((a, b) =>
      a.resource.client_name.localeCompare(b.resource.client_name),
    );

    sortedGroup.forEach((event, index) => {
      eventMeta.set(event.id, {
        simultaneousCount: sortedGroup.length,
        simultaneousIndex: index + 1,
        overflowCount: Math.max(0, sortedGroup.length - 2),
      });
    });
  }

  return baseEvents.map((event) => ({
    ...event,
    meta: eventMeta.get(event.id) ?? {
      simultaneousCount: 1,
      simultaneousIndex: 1,
      overflowCount: 0,
    },
  }));
}

export function CalendarView({
  mode,
  selectedDate,
  appointments,
  onSelectDate,
  onAddAppointment,
  onEditAppointment,
  onRescheduleAppointment,
}: CalendarViewProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const events = useMemo(() => buildCalendarEvents(appointments), [appointments]);

  const minTime = useMemo(
    () => setMinutes(setHours(new Date(selectedDate), 7), 0),
    [selectedDate],
  );
  const maxTime = useMemo(
    () => setMinutes(setHours(new Date(selectedDate), 20), 0),
    [selectedDate],
  );
  const scrollToTime = useMemo(
    () => setMinutes(setHours(new Date(selectedDate), 8), 0),
    [selectedDate],
  );

  const persistScheduleUpdate = async (event: any, start: Date, end: Date) => {
    const startTime = asTimeLabel(start);
    const endTime = asTimeLabel(end);

    setUpdatingId(event.id);
    try {
      await onRescheduleAppointment(event.id, {
        scheduled_date: format(start, "yyyy-MM-dd"),
        timeslot: deriveTimeslotFromTime(startTime),
        start_time: startTime,
        end_time: endTime,
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const onDrop = async ({ event, start, end }: any) => {
    await persistScheduleUpdate(event, new Date(start), new Date(end));
  };

  const onResize = async ({ event, start, end }: any) => {
    await persistScheduleUpdate(event, new Date(start), new Date(end));
  };

  const onSelectSlot = (slotInfo: any) => {
    const start = new Date(slotInfo.start);
    const end = new Date(slotInfo.end);
    const date = format(start, "yyyy-MM-dd");

    if (mode === "month") {
      onAddAppointment(date, "morning", "08:30", "10:00");
      return;
    }

    const startTime = asTimeLabel(start);
    const endTime =
      end > start ? asTimeLabel(end) : asTimeLabel(new Date(start.getTime() + 60 * 60 * 1000));
    onAddAppointment(date, deriveTimeslotFromTime(startTime), startTime, endTime);
  };

  return (
    <div className="rounded-2xl border border-border/65 bg-card p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="rounded-full border border-blue-400/40 bg-blue-500/10 px-2 py-1 text-blue-600 dark:text-blue-300">
          Grand Menage
        </span>
        <span className="rounded-full border border-teal-400/40 bg-teal-500/10 px-2 py-1 text-teal-600 dark:text-teal-300">
          Petit Menage
        </span>
        <span className="rounded-full border border-amber-400/45 bg-amber-500/10 px-2 py-1 text-amber-600 dark:text-amber-300">
          Same-time bookings auto-split
        </span>
        <span className="rounded-full border border-violet-400/45 bg-violet-500/10 px-2 py-1 text-violet-600 dark:text-violet-300">
          3+ overlap shows +N marker
        </span>
        <span className="rounded-full border border-border bg-muted/40 px-2 py-1">
          Drag to move or resize appointments
        </span>
      </div>

      <div className="appointments-calendar h-[720px] sm:h-[760px]">
        <DraggableCalendar
          localizer={localizer}
          events={events}
          date={selectedDate}
          view={VIEW_BY_MODE[mode] as any}
          onNavigate={onSelectDate}
          toolbar={false}
          popup
          selectable
          resizable={mode !== "month"}
          onSelectEvent={(event: any) => onEditAppointment(event.resource)}
          onSelectSlot={onSelectSlot}
          onEventDrop={onDrop}
          onEventResize={onResize}
          scrollToTime={scrollToTime}
          dayLayoutAlgorithm="no-overlap"
          tooltipAccessor={(event: any) => {
            const calendarEvent = event as CalendarEvent;
            const appointment = calendarEvent.resource;
            const overlapLabel =
              calendarEvent.meta.simultaneousCount > 1
                ? ` | Same-time ${calendarEvent.meta.simultaneousIndex}/${calendarEvent.meta.simultaneousCount}`
                : "";
            const overflowLabel =
              calendarEvent.meta.overflowCount > 0
                ? ` | +${calendarEvent.meta.overflowCount} more in this timeslot`
                : "";
            return `${appointment.client_name} | ${asTimeLabel(calendarEvent.start)} - ${asTimeLabel(calendarEvent.end)} | ${appointment.worker_ids.length}/${appointment.required_workers} workers${overlapLabel}${overflowLabel}`;
          }}
          eventPropGetter={(event: any) => {
            const calendarEvent = event as CalendarEvent;
            const isUpdating = updatingId === calendarEvent.id;
            const appointment = calendarEvent.resource;
            const theme = getEventTheme(appointment);
            const isSimultaneous = calendarEvent.meta.simultaneousCount > 1;
            const isDense = calendarEvent.meta.simultaneousCount >= 3;
            const isShort = calendarEvent.durationMinutes <= 45;

            return {
              style: {
                background: theme.background,
                borderRadius: isDense ? "10px" : "12px",
                border: `1px solid ${theme.borderColor}`,
                color: theme.textColor,
                boxShadow: isUpdating
                  ? "0 0 0 2px rgba(99, 102, 241, 0.55), 0 10px 20px rgba(15, 23, 42, 0.28)"
                  : isSimultaneous
                    ? "0 0 0 1px rgba(248, 250, 252, 0.42), 0 6px 14px rgba(15, 23, 42, 0.24)"
                    : "0 5px 12px rgba(15, 23, 42, 0.2)",
                opacity: isUpdating ? 0.65 : 1,
                letterSpacing: isShort ? "0.005em" : "normal",
              },
            };
          }}
          components={{
            event: ({ event }: any) => {
              const calendarEvent = event as CalendarEvent;
              const appointment = calendarEvent.resource;
              const serviceLabel = appointment.service_type === "grand" ? "Grand" : "Petit";
              const workerLabel = `${appointment.worker_ids.length}/${appointment.required_workers}`;
              const isTiny = calendarEvent.durationMinutes <= 30;
              const isShort = calendarEvent.durationMinutes <= 45;
              const isDense = calendarEvent.meta.simultaneousCount >= 3;
              const isMinimalDense = isDense && calendarEvent.meta.simultaneousIndex > 2;
              const useCompactLayout = isShort || isDense;
              const useCollapsedLayout = isTiny || isMinimalDense;
              const showOverflowMarker =
                calendarEvent.meta.overflowCount > 0 && calendarEvent.meta.simultaneousIndex === 1;
              const simultaneousLabel =
                calendarEvent.meta.simultaneousCount > 1
                  ? `${calendarEvent.meta.simultaneousIndex}/${calendarEvent.meta.simultaneousCount} same-time`
                  : null;
              const compactClientName = toCompactClientName(appointment.client_name);
              const clientInitials = getClientInitials(appointment.client_name);
              const collapsedClientLabel =
                appointment.client_name.trim().length <= 8 ? appointment.client_name.trim() : clientInitials;

              return (
                <div
                  className={`calendar-appointment-card ${useCompactLayout ? "is-compact" : ""} ${
                    isDense ? "is-dense" : ""
                  } ${
                    useCollapsedLayout ? "is-collapsed" : ""
                  }`}
                >
                  {useCollapsedLayout ? (
                    <div className="calendar-collapsed-row">
                      <p className="calendar-collapsed-client">{collapsedClientLabel}</p>
                      <div className="calendar-collapsed-right">
                        {showOverflowMarker ? (
                          <p className="calendar-overflow-marker">+{calendarEvent.meta.overflowCount}</p>
                        ) : null}
                        <p className="calendar-collapsed-time">{asTimeLabel(calendarEvent.start)}</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="calendar-appointment-top">
                        <p className="calendar-service-label">{serviceLabel}</p>
                        {showOverflowMarker ? (
                          <p className="calendar-overflow-marker">+{calendarEvent.meta.overflowCount}</p>
                        ) : simultaneousLabel ? (
                          <p className="calendar-density-pill">{simultaneousLabel}</p>
                        ) : (
                          <p className="calendar-worker-pill">{workerLabel} workers</p>
                        )}
                      </div>

                      {useCompactLayout ? (
                      <>
                        <p className="calendar-client-name">{compactClientName}</p>

                        <p className="calendar-compact-meta">
                            {asTimeLabel(calendarEvent.start)} - {asTimeLabel(calendarEvent.end)} - {workerLabel}w
                        </p>
                      </>
                      ) : (
                        <>
                          <p className="calendar-client-name">{compactClientName}</p>

                          <p className="calendar-appointment-meta">
                            {asTimeLabel(calendarEvent.start)} - {asTimeLabel(calendarEvent.end)} - {workerLabel} workers
                          </p>
                        </>
                      )}
                    </>
                  )}
                </div>
              );
            },
          }}
          step={15}
          timeslots={2}
          min={minTime}
          max={maxTime}
        />
      </div>
    </div>
  );
}
