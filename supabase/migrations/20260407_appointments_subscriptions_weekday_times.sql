ALTER TABLE IF EXISTS appointment_subscriptions
  ADD COLUMN IF NOT EXISTS weekday_time_overrides JSONB NOT NULL DEFAULT '[]'::JSONB;

ALTER TABLE IF EXISTS appointment_subscriptions
  ADD COLUMN IF NOT EXISTS cadence TEXT NOT NULL DEFAULT 'weekly';

ALTER TABLE IF EXISTS appointment_subscriptions
  ADD COLUMN IF NOT EXISTS repeat_every_weeks SMALLINT NOT NULL DEFAULT 1;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'appointment_subscriptions'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'appointment_subscriptions_weekday_time_overrides_is_array'
    ) THEN
      ALTER TABLE appointment_subscriptions
        ADD CONSTRAINT appointment_subscriptions_weekday_time_overrides_is_array
        CHECK (jsonb_typeof(weekday_time_overrides) = 'array');
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'appointment_subscriptions'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'appointment_subscriptions_cadence_valid'
    ) THEN
      ALTER TABLE appointment_subscriptions
        ADD CONSTRAINT appointment_subscriptions_cadence_valid
        CHECK (cadence IN ('weekly', 'biweekly'));
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'appointment_subscriptions_repeat_every_weeks_valid'
    ) THEN
      ALTER TABLE appointment_subscriptions
        ADD CONSTRAINT appointment_subscriptions_repeat_every_weeks_valid
        CHECK (repeat_every_weeks IN (1, 2));
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'appointment_subscriptions_cadence_repeat_consistent'
    ) THEN
      ALTER TABLE appointment_subscriptions
        ADD CONSTRAINT appointment_subscriptions_cadence_repeat_consistent
        CHECK (
          (cadence = 'weekly' AND repeat_every_weeks = 1)
          OR (cadence = 'biweekly' AND repeat_every_weeks = 2)
        );
    END IF;
  END IF;
END $$;
