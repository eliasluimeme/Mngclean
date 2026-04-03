"use client";

import {
  addDays,
  addMonths,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { useCallback, useMemo, useState } from "react";
import { AddAppointmentModal } from "@/components/appointments/add-appointment-modal";
import { AppointmentsTopbar, type CalendarRangeMode } from "@/components/appointments/appointments-topbar";
import { BoardView } from "@/components/appointments/board-view";
import { CalendarView } from "@/components/appointments/calendar-view";
import { ManageWorkersModal } from "@/components/appointments/manage-workers-modal";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { evaluateBoardMoveGuard } from "@/lib/appointments/drag-drop-guards";
import { getDefaultTimeRangeForSlot } from "@/lib/appointments/time";
import { AppointmentInput, AppointmentStatus, AppointmentWithAssignments, Timeslot } from "@/lib/appointments/types";
import { useAppointments } from "@/hooks/use-appointments";

export function AppointmentsShell() {
  const [view, setView] = useState<"calendar" | "board">("calendar");
  const [calendarRangeMode, setCalendarRangeMode] = useState<CalendarRangeMode>("week");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isWorkersModalOpen, setIsWorkersModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<AppointmentWithAssignments | null>(null);
  const [defaultDate, setDefaultDate] = useState<string | undefined>(undefined);
  const [defaultTimeslot, setDefaultTimeslot] = useState<Timeslot | undefined>(undefined);
  const [defaultStartTime, setDefaultStartTime] = useState<string | undefined>(undefined);
  const [defaultEndTime, setDefaultEndTime] = useState<string | undefined>(undefined);
  const [preferredStatus, setPreferredStatus] = useState<AppointmentStatus | undefined>(undefined);
  const [statusError, setStatusError] = useState<string | null>(null);

  const queryRange = useMemo(() => {
    if (calendarRangeMode === "day") {
      const from = format(startOfDay(selectedDate), "yyyy-MM-dd");
      const to = format(endOfDay(selectedDate), "yyyy-MM-dd");
      return { from, to };
    }

    if (calendarRangeMode === "month") {
      const monthStart = startOfMonth(selectedDate);
      const monthEnd = endOfMonth(selectedDate);
      const monthGridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
      const monthGridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
      return {
        from: format(monthGridStart, "yyyy-MM-dd"),
        to: format(monthGridEnd, "yyyy-MM-dd"),
      };
    }

    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });

    return {
      from: format(weekStart, "yyyy-MM-dd"),
      to: format(weekEnd, "yyyy-MM-dd"),
    };
  }, [calendarRangeMode, selectedDate]);

  const {
    appointments,
    workers,
    loading,
    error,
    createAppointment,
    updateAppointment,
    updateAppointmentStatus,
    deleteAppointment,
    createWorker,
    updateWorker,
    deleteWorker,
  } = useAppointments(queryRange);

  const weekStart = useMemo(() => startOfWeek(selectedDate, { weekStartsOn: 1 }), [selectedDate]);

  const rangeLabel = useMemo(() => {
    if (calendarRangeMode === "day") {
      return format(selectedDate, "EEE, MMM d, yyyy");
    }

    if (calendarRangeMode === "month") {
      return format(selectedDate, "MMMM yyyy");
    }

    return `${format(weekStart, "MMM d")} - ${format(addDays(weekStart, 6), "MMM d, yyyy")}`;
  }, [calendarRangeMode, selectedDate, weekStart]);

  const shiftDateByRange = useCallback(
    (direction: -1 | 1) => {
      setSelectedDate((previous) => {
        if (calendarRangeMode === "day") {
          return addDays(previous, direction);
        }

        if (calendarRangeMode === "month") {
          return addMonths(previous, direction);
        }

        return addDays(startOfWeek(previous, { weekStartsOn: 1 }), direction * 7);
      });
    },
    [calendarRangeMode],
  );

  const openCreateModal = () => {
    const defaults = getDefaultTimeRangeForSlot("morning");
    setEditingAppointment(null);
    setDefaultDate(format(selectedDate, "yyyy-MM-dd"));
    setDefaultTimeslot("morning");
    setDefaultStartTime(defaults.start);
    setDefaultEndTime(defaults.end);
    setPreferredStatus(undefined);
    setStatusError(null);
    setIsAddModalOpen(true);
  };

  const openCreateModalForSlot = (
    date: string,
    timeslot: Timeslot,
    startTime?: string,
    endTime?: string,
  ) => {
    const defaults = getDefaultTimeRangeForSlot(timeslot);
    setEditingAppointment(null);
    setDefaultDate(date);
    setDefaultTimeslot(timeslot);
    setDefaultStartTime(startTime || defaults.start);
    setDefaultEndTime(endTime || defaults.end);
    setPreferredStatus(undefined);
    setStatusError(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (appointment: AppointmentWithAssignments) => {
    setEditingAppointment(appointment);
    setDefaultDate(undefined);
    setDefaultTimeslot(undefined);
    setDefaultStartTime(undefined);
    setDefaultEndTime(undefined);
    setPreferredStatus(undefined);
    setStatusError(null);
    setIsAddModalOpen(true);
  };

  const handleSaveAppointment = async (payload: AppointmentInput, appointmentId?: string) => {
    if (appointmentId) {
      await updateAppointment(appointmentId, payload);
    } else {
      await createAppointment(payload);
    }

    setIsAddModalOpen(false);
    setEditingAppointment(null);
    setPreferredStatus(undefined);
    setDefaultDate(undefined);
    setDefaultTimeslot(undefined);
    setDefaultStartTime(undefined);
    setDefaultEndTime(undefined);
  };

  const handleCalendarScheduleChange = async (
    appointmentId: string,
    payload: Pick<AppointmentInput, "scheduled_date" | "timeslot" | "start_time" | "end_time">,
  ) => {
    try {
      await updateAppointment(appointmentId, payload);
      setStatusError(null);
    } catch (err: any) {
      setStatusError(err?.message || "Unable to reschedule appointment.");
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    await deleteAppointment(appointmentId);
    setIsAddModalOpen(false);
    setEditingAppointment(null);
    setPreferredStatus(undefined);
    setDefaultDate(undefined);
    setDefaultTimeslot(undefined);
    setDefaultStartTime(undefined);
    setDefaultEndTime(undefined);
    setStatusError(null);
  };

  const handleMoveCard = async (appointmentId: string, targetStatus: AppointmentStatus) => {
    const appointment = appointments.find((item) => item.id === appointmentId);
    const guard = evaluateBoardMoveGuard(appointment, targetStatus);
    if (guard.blocked) {
      setStatusError(guard.error || "Unable to move appointment.");
      if (appointment) {
        setEditingAppointment(appointment);
        setIsAddModalOpen(true);
      }
      if (guard.preferredStatus) {
        setPreferredStatus(guard.preferredStatus);
      }
      return;
    }

    try {
      await updateAppointmentStatus(appointmentId, targetStatus);
      setStatusError(null);
    } catch (err: any) {
      setStatusError(err?.message || "Unable to move appointment.");
    }
  };

  return (
    <div className="space-y-4">
      <AppointmentsTopbar
        view={view}
        onChangeView={setView}
        calendarRangeMode={calendarRangeMode}
        onChangeCalendarRangeMode={setCalendarRangeMode}
        onPreviousRange={() => shiftDateByRange(-1)}
        onNextRange={() => shiftDateByRange(1)}
        onToday={() => setSelectedDate(new Date())}
        rangeLabel={rangeLabel}
        onOpenAddAppointment={openCreateModal}
        onOpenManageWorkers={() => setIsWorkersModalOpen(true)}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      {(error || statusError) && (
        <Alert variant="destructive">
          <AlertDescription>{error || statusError}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex min-h-[420px] items-center justify-center rounded-xl border bg-card">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading appointments...</p>
          </div>
        </div>
      ) : view === "calendar" ? (
        <CalendarView
          mode={calendarRangeMode}
          selectedDate={selectedDate}
          appointments={appointments}
          onSelectDate={setSelectedDate}
          onAddAppointment={openCreateModalForSlot}
          onEditAppointment={openEditModal}
          onRescheduleAppointment={handleCalendarScheduleChange}
        />
      ) : (
        <BoardView appointments={appointments} onMoveCard={handleMoveCard} onEditAppointment={openEditModal} />
      )}

      <AddAppointmentModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSubmit={handleSaveAppointment}
        onDeleteAppointment={handleDeleteAppointment}
        initialAppointment={editingAppointment}
        defaultDate={defaultDate}
        defaultTimeslot={defaultTimeslot}
        defaultStartTime={defaultStartTime}
        defaultEndTime={defaultEndTime}
        preferredStatus={preferredStatus}
      />

      <ManageWorkersModal
        open={isWorkersModalOpen}
        onOpenChange={setIsWorkersModalOpen}
        workers={workers}
        onCreateWorker={createWorker}
        onUpdateWorker={updateWorker}
        onDeleteWorker={deleteWorker}
      />
    </div>
  );
}
