CREATE TABLE IF NOT EXISTS appointment_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_name TEXT NOT NULL,
  address TEXT NOT NULL,
  service_type TEXT NOT NULL CHECK (service_type IN ('grand', 'petit')),
  start_date DATE NOT NULL,
  timeslot TEXT NOT NULL CHECK (timeslot IN ('morning', 'evening')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'incoming' CHECK (
    status IN ('incoming', 'scheduled', 'on_site', 'pending_review', 'completed', 'cancelled')
  ),
  notes TEXT,
  cadence TEXT NOT NULL DEFAULT 'weekly' CHECK (cadence IN ('weekly', 'biweekly')),
  repeat_every_weeks SMALLINT NOT NULL DEFAULT 1 CHECK (repeat_every_weeks IN (1, 2)),
  duration_unit TEXT NOT NULL CHECK (duration_unit IN ('weeks', 'months')),
  duration_count INTEGER NOT NULL CHECK (duration_count > 0),
  weekdays SMALLINT[] NOT NULL CHECK (cardinality(weekdays) > 0),
  weekday_time_overrides JSONB NOT NULL DEFAULT '[]'::JSONB,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT appointment_subscriptions_weekdays_valid CHECK (
    weekdays <@ ARRAY[1,2,3,4,5,6,7]::SMALLINT[]
  ),
  CONSTRAINT appointment_subscriptions_weekday_time_overrides_is_array CHECK (
    jsonb_typeof(weekday_time_overrides) = 'array'
  ),
  CONSTRAINT appointment_subscriptions_cadence_repeat_consistent CHECK (
    (cadence = 'weekly' AND repeat_every_weeks = 1)
    OR (cadence = 'biweekly' AND repeat_every_weeks = 2)
  )
);

CREATE INDEX IF NOT EXISTS idx_appointment_subscriptions_start_date
  ON appointment_subscriptions (start_date);

CREATE INDEX IF NOT EXISTS idx_appointment_subscriptions_active
  ON appointment_subscriptions (is_active);
