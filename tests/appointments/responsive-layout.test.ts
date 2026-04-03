import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("appointments responsive layout", () => {
  it("uses responsive breakpoints and calendar mode controls in topbar", () => {
    const topbar = read("components/appointments/appointments-topbar.tsx");
    const shell = read("components/appointments/appointments-shell.tsx");

    expect(topbar).toContain("lg:flex-row");
    expect(topbar).toContain("flex-wrap");
    expect(topbar).toContain("CalendarUI");
    expect(topbar).toContain("Popover");
    expect(topbar).toContain("Day");
    expect(topbar).toContain("Week");
    expect(topbar).toContain("Month");
    expect(shell).toContain("min-h-[420px]");
    expect(shell).toContain("monthGridStart");
    expect(shell).toContain("monthGridEnd");
  });

  it("uses scheduler-specific rendering and keeps board overflow guards", () => {
    const calendar = read("components/appointments/calendar-view.tsx");
    const board = read("components/appointments/board-view.tsx");

    expect(calendar).toContain("appointments-calendar");
    expect(calendar).toContain("dayLayoutAlgorithm=\"no-overlap\"");
    expect(calendar).toContain("simultaneousCount");
    expect(calendar).toContain("overflowCount");
    expect(calendar).toContain("calendar-overflow-marker");
    expect(calendar).toContain("calendar-collapsed-row");
    expect(calendar).toContain("resizable={mode !== \"month\"}");
    expect(calendar).toContain("timeslots={2}");
    expect(board).toContain("sm:grid-cols-4");
    expect(board).toContain("overflow-x-auto");
  });

  it("uses responsive slot and modal form grids for mobile-first behavior", () => {
    const daySlot = read("components/appointments/day-slot-column.tsx");
    const addModal = read("components/appointments/add-appointment-modal.tsx");
    const workersModal = read("components/appointments/manage-workers-modal.tsx");

    expect(daySlot).toContain("space-y-3");
    expect(addModal).toContain("sm:grid-cols-2");
    expect(workersModal).toContain("sm:grid-cols-2");
  });
});
