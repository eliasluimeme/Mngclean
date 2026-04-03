# Appointments Feature Brainstorm and Task Plan

## 1) Product Goal
Build a dedicated `/appointments` experience that lets managers do two things quickly:
1. See slot capacity at a glance (not only time).
2. Move jobs through operations from booking to completion.

Primary constraint: each time slot has a maximum capacity of 5 workers.

## 2) Design Direction (Inspired by Reference Images)
### Propio-inspired elements
- Left sidebar for stable navigation.
- Capacity-first calendar feeling (clear day columns, lightweight grid).
- Visible timeline indicator to show where the current time sits.
- Fast assignment cues with avatar chips and add-worker affordances.

### Task.Co-inspired elements
- Top view switcher between Calendar and Board.
- Operational board with clear status columns and drag-and-drop flow.
- Card-level quick actions to reduce context switching.

### Google Calendar-inspired elements
- Mini-calendar on the left for fast date jumps.
- Familiar weekly rhythm and day scanning behavior.

## 3) Core UX Modes
## Calendar View (Planning)
- Purpose: answer "Can we accept this booking in this slot?"
- Weekly grid split by day columns.
- Each day has 2 slot lanes:
  - Morning (08:00-12:00)
  - Evening (13:00-17:00)
- Each day+slot shows:
  - Capacity bar: `Workers Busy: X/5`
  - Remaining capacity hint: `Remaining: N workers (1 Grand or 2 Petit)` where relevant.

## Board View (Operations)
- Purpose: answer "Where are today jobs in execution?"
- Columns:
  - Incoming/New
  - Scheduled
  - On-Site
  - Pending Review
  - Completed (optional if Pending Review is used as quality gate)
- Move cards by drag and drop; enforce assignment requirements before status updates.

## 4) Information Architecture
- Route: `/appointments`
- Top bar controls:
  - View switcher: Calendar | Board
  - `+ Add Appointment`
  - `Manage Workers`
  - Optional date range selector and week navigation
- Left rail:
  - Mini calendar
  - Worker quick filter (All, Active only, On-Site)
  - Service type filter (Grand, Petit)

## 5) Calendar View Specification (Capacity Grid)
## Slot model
- A slot is uniquely identified by `(scheduled_date, timeslot)`.
- Capacity is computed per slot, not per full day.

## Card style
- Grand Menage card:
  - Color: `#818CF8` (indigo)
  - Worker requirement: 2
  - Icon: house-plus style icon
- Petit Menage card:
  - Color: `#2DD4BF` (teal)
  - Worker requirement: 1
  - Icon: spray bottle style icon
- Unassigned cue:
  - Dotted avatar placeholder with `+`
- On-Site cue:
  - Small green status dot on avatar

## Card content
- Client name
- Service type badge
- Address snippet
- Time label (within morning/evening lane)
- Assigned worker avatars
- Inline actions:
  - `Call Client`
  - `View Checklist`

## Timeline indicator
- Horizontal line across the active day lane to indicate current time progression.
- If line crosses beyond slot expectation, surface subtle overrun warning.

## 6) Board View Specification (Management Hub)
## Column rules
- Incoming/New: newly booked, no final assignment.
- Scheduled: assignment complete and capacity-valid.
- On-Site: worker check-in confirmed.
- Pending Review: service completed, awaiting photo check/invoice.
- Completed: review done and closed.

## Card move rules
- Incoming -> Scheduled:
  - Must satisfy required worker count.
  - Must pass slot capacity validation.
- Scheduled -> On-Site:
  - At least one assigned worker marked checked-in.
- On-Site -> Pending Review:
  - Job marked done by field workflow.
- Pending Review -> Completed:
  - Review checklist and invoice state complete.

## 7) Capacity Brain (Business Rules)
## Constants
- `TOTAL_SLOT_CAPACITY = 5`
- `SERVICE_COST.grand = 2`
- `SERVICE_COST.petit = 1`

## Core formulas
- Slot used credits:
  - `used = sum(cost(appointment.service_type))`
- Remaining credits:
  - `remaining = TOTAL_SLOT_CAPACITY - used`
- Can schedule?
  - `used + cost(new_service_type) <= TOTAL_SLOT_CAPACITY`

## Worker requirements
- Grand requires exactly 2 assigned workers.
- Petit requires exactly 1 assigned worker.

## Worker availability rule
- A worker cannot be assigned to more than one appointment in the same `(date, timeslot)`.

## Validation messaging
- Capacity hard-stop:
  - `Maximum capacity reached for this time slot.`
- Near-limit warning:
  - `This booking will max out this slot.`
- Assignment hard-stop:
  - `Grand Menage requires 2 available workers.`

## 8) Database Schema (Supabase/PostgreSQL)
Use this script as the base.

```sql
-- Enable extension for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Workers Table
CREATE TABLE IF NOT EXISTS workers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'on_site', 'off_duty')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_name TEXT NOT NULL,
  address TEXT NOT NULL,
  service_type TEXT NOT NULL CHECK (service_type IN ('grand', 'petit')),
  scheduled_date DATE NOT NULL,
  timeslot TEXT NOT NULL CHECK (timeslot IN ('morning', 'evening')),
  status TEXT DEFAULT 'incoming' CHECK (
    status IN ('incoming', 'scheduled', 'on_site', 'pending_review', 'completed', 'cancelled')
  ),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Junction table for Worker Assignment
CREATE TABLE IF NOT EXISTS appointment_assignments (
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (appointment_id, worker_id)
);

-- Helpful indexes for scheduler lookups
CREATE INDEX IF NOT EXISTS idx_appointments_date_timeslot
  ON appointments (scheduled_date, timeslot);

CREATE INDEX IF NOT EXISTS idx_assignments_worker
  ON appointment_assignments (worker_id);
```

## Recommended SQL constraints and checks
- Enforce max worker count per appointment in app logic:
  - grand -> 2 assignments
  - petit -> 1 assignment
- Enforce per-slot worker uniqueness in app logic or RPC query:
  - worker cannot appear in same `(date, timeslot)` across different appointments.

## 9) API and Server Logic Plan
## Appointments
- `GET /api/appointments?from=YYYY-MM-DD&to=YYYY-MM-DD`
- `POST /api/appointments`
- `PATCH /api/appointments/:id`
- `PATCH /api/appointments/:id/status`
- `DELETE /api/appointments/:id`

## Workers
- `GET /api/workers`
- `POST /api/workers`
- `PATCH /api/workers/:id`
- `DELETE /api/workers/:id`

## Availability
- `GET /api/availability?date=YYYY-MM-DD&timeslot=morning|evening`
- Returns:
  - used credits
  - remaining credits
  - available workers list
  - whether grand/petit can still fit

## 10) Frontend Component Plan
## Route and shells
- `app/appointments/page.tsx`
- `components/appointments/appointments-shell.tsx`
- `components/appointments/appointments-topbar.tsx`

## Calendar side
- `components/appointments/calendar-view.tsx`
- `components/appointments/day-slot-column.tsx`
- `components/appointments/capacity-meter.tsx`
- `components/appointments/appointment-card.tsx`
- `components/appointments/mini-calendar-sidebar.tsx`

## Board side
- `components/appointments/board-view.tsx`
- `components/appointments/board-column.tsx`

## Modals
- `components/appointments/add-appointment-modal.tsx`
- `components/appointments/manage-workers-modal.tsx`

## Hooks and utils
- `hooks/use-appointments.ts`
- `hooks/use-worker-availability.ts`
- `lib/appointments/capacity.ts`
- `lib/appointments/types.ts`
- `lib/appointments/validators.ts`

## 11) Detailed Implementation Task Checklist
## Phase 1 - Data Layer
- [x] Create SQL migration for workers, appointments, appointment_assignments.
- [x] Add indexes for date/timeslot and assignment lookups.
- [x] Implement typed data models in TypeScript.
- [x] Seed 5 workers for local testing.

## Phase 2 - API Layer
- [x] Build workers CRUD endpoints.
- [x] Build appointments CRUD endpoints.
- [x] Build availability endpoint for date+timeslot filtering.
- [x] Add server-side validation for capacity and assignment counts.

## Phase 3 - Calendar View (MVP)
- [x] Build `/appointments` page skeleton with sidebar + topbar.
- [x] Add view switcher and week navigation.
- [x] Implement split grid (morning/evening) for each day.
- [x] Render capacity meter per slot.
- [x] Render appointment cards with service color, avatars, actions.
- [x] Add timeline indicator for current day/time.

## Phase 4 - Board View (MVP)
- [x] Build board columns (Incoming, Scheduled, On-Site, Pending Review, Completed).
- [x] Render card metadata (service, client, workers).
- [x] Add drag-and-drop with status transition guards.
- [x] Show warning UI when transition violates assignment/capacity rules.

## Phase 5 - Add Appointment Modal
- [x] Build form fields (client, address, date, slot, service, notes).
- [x] Show dynamic worker selectors based on service type.
- [x] Filter worker options by live availability.
- [x] Block save when required worker count is not met.
- [x] Show max-capacity warning and prevent invalid submit.

## Phase 6 - Manage Workers Modal
- [x] List workers with active/inactive toggle.
- [x] Add worker form (name, avatar_url, phone).
- [x] Edit worker details.
- [x] Delete worker with confirmation.

## Phase 7 - QA and Hardening
- [x] Write unit tests for capacity formulas and validators.
- [x] Add integration tests for add-appointment flow.
- [x] Add tests for worker availability filtering.
- [x] Validate mobile layout and responsive behavior.
- [x] Add empty/loading/error states.

## 12) Acceptance Criteria
- Manager can switch between Calendar and Board without losing selected week/date context.
- Every day+slot shows `X/5` capacity and remaining capacity hint.
- Grand appointment cannot be saved without 2 available workers.
- Petit appointment cannot be saved without 1 available worker.
- Worker already assigned in same date+slot is excluded from selection.
- If slot is full, user sees clear blocking warning and cannot save.
- Board drag-and-drop prevents invalid transitions and explains why.
- Worker management CRUD updates selectors and cards without full page reload.

## 13) Edge Cases to Test
- Booking exactly at capacity limit (allowed).
- Booking above capacity limit (blocked).
- Switching service type from petit -> grand in modal updates required selectors.
- Deactivating a worker who is assigned to future jobs (warn and handle gracefully).
- Deleting a worker with assignments (confirm behavior and preserve history).
- Concurrent bookings by two admins (server-side validation must remain source of truth).

## 14) Suggested Delivery Milestones
- Milestone A (1-2 days): schema + API + capacity engine.
- Milestone B (2-3 days): calendar view + add appointment modal.
- Milestone C (1-2 days): board view + transition guards.
- Milestone D (1 day): worker management modal + QA polish.

## 15) Future Enhancements
- Auto-assignment suggestions based on availability and worker load balance.
- Travel-time aware scheduling by area/zone.
- SLA risk badges (late start, overrun risk).
- Invoice and photo checklist automation in Pending Review stage.
