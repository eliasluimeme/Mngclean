"use client";

import { format } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, LayoutGrid, Plus, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type CalendarRangeMode = "day" | "week" | "month";

interface AppointmentsTopbarProps {
  view: "calendar" | "board";
  onChangeView: (view: "calendar" | "board") => void;
  calendarRangeMode: CalendarRangeMode;
  onChangeCalendarRangeMode: (mode: CalendarRangeMode) => void;
  onPreviousRange: () => void;
  onNextRange: () => void;
  onToday: () => void;
  rangeLabel: string;
  onOpenAddAppointment: () => void;
  onOpenManageWorkers: () => void;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export function AppointmentsTopbar({
  view,
  onChangeView,
  calendarRangeMode,
  onChangeCalendarRangeMode,
  onPreviousRange,
  onNextRange,
  onToday,
  rangeLabel,
  onOpenAddAppointment,
  onOpenManageWorkers,
  selectedDate,
  onSelectDate,
}: AppointmentsTopbarProps) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border bg-muted/30 p-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "rounded-md",
                view === "calendar" && "bg-background text-foreground shadow-sm",
              )}
              onClick={() => onChangeView("calendar")}
            >
              Calendar View
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "rounded-md",
                view === "board" && "bg-background text-foreground shadow-sm",
              )}
              onClick={() => onChangeView("board")}
            >
              <LayoutGrid className="mr-1 h-4 w-4" />
              Board View
            </Button>
          </div>

          <div className="inline-flex rounded-lg border bg-muted/30 p-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "rounded-md",
                calendarRangeMode === "day" && "bg-background text-foreground shadow-sm",
              )}
              onClick={() => onChangeCalendarRangeMode("day")}
            >
              Day
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "rounded-md",
                calendarRangeMode === "week" && "bg-background text-foreground shadow-sm",
              )}
              onClick={() => onChangeCalendarRangeMode("week")}
            >
              Week
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "rounded-md",
                calendarRangeMode === "month" && "bg-background text-foreground shadow-sm",
              )}
              onClick={() => onChangeCalendarRangeMode("month")}
            >
              Month
            </Button>
          </div>

          <div className="ml-0 flex items-center gap-1 lg:ml-3">
            <Button type="button" variant="outline" size="icon" onClick={onPreviousRange}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button type="button" variant="outline" size="icon" onClick={onNextRange}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onToday}>
              Today
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {format(selectedDate, "MMM d, yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarUI
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      onSelectDate(date);
                    }
                  }}
                />
              </PopoverContent>
            </Popover>
            <p className="ml-2 text-sm font-medium text-muted-foreground">{rangeLabel}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={onOpenManageWorkers}>
            <UsersRound className="mr-2 h-4 w-4" />
            Manage Workers
          </Button>
          <Button type="button" onClick={onOpenAddAppointment}>
            <Plus className="mr-2 h-4 w-4" />
            Add Appointment
          </Button>
        </div>
      </div>
    </div>
  );
}
