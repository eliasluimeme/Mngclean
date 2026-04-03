ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS start_time TIME,
  ADD COLUMN IF NOT EXISTS end_time TIME;

UPDATE appointments
SET
  start_time = CASE
    WHEN timeslot = 'morning' THEN TIME '08:30'
    ELSE TIME '14:00'
  END,
  end_time = CASE
    WHEN timeslot = 'morning' THEN TIME '10:00'
    ELSE TIME '15:30'
  END
WHERE start_time IS NULL OR end_time IS NULL;

-- Ensure Supabase API sees the new columns immediately.
NOTIFY pgrst, 'reload schema';
