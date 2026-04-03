-- Normalize legacy appointment statuses and align DB check constraint
-- with API enum values used by the appointments board/calendar.

UPDATE public.appointments
SET status = CASE
  WHEN status IS NULL THEN 'incoming'
  WHEN lower(trim(status)) IN ('incoming', 'new') THEN 'incoming'
  WHEN lower(trim(status)) = 'scheduled' THEN 'scheduled'
  WHEN lower(trim(status)) IN ('on_site', 'on-site', 'on site', 'onsite', 'in_progress', 'in-progress', 'in progress') THEN 'on_site'
  WHEN lower(trim(status)) IN ('pending_review', 'pending-review', 'pending review', 'pendingreview') THEN 'pending_review'
  WHEN lower(trim(status)) IN ('completed', 'done') THEN 'completed'
  WHEN lower(trim(status)) IN ('cancelled', 'canceled') THEN 'cancelled'
  ELSE 'incoming'
END;

ALTER TABLE public.appointments
  ALTER COLUMN status SET DEFAULT 'incoming';

ALTER TABLE public.appointments
  ALTER COLUMN status SET NOT NULL;

ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS appointments_status_check;

ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_status_check
  CHECK (status IN ('incoming', 'scheduled', 'on_site', 'pending_review', 'completed', 'cancelled'));

NOTIFY pgrst, 'reload schema';
