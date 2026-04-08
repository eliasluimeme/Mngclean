CREATE TABLE IF NOT EXISTS appointment_settings (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (id = TRUE),
  grand_workers INTEGER NOT NULL DEFAULT 2 CHECK (grand_workers > 0),
  petit_workers INTEGER NOT NULL DEFAULT 1 CHECK (petit_workers > 0),
  total_slot_capacity INTEGER NOT NULL DEFAULT 5 CHECK (total_slot_capacity > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT appointment_settings_capacity_check CHECK (
    total_slot_capacity >= grand_workers
    AND total_slot_capacity >= petit_workers
  )
);

INSERT INTO appointment_settings (id, grand_workers, petit_workers, total_slot_capacity)
VALUES (TRUE, 2, 1, 5)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION set_appointment_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_appointment_settings_updated_at ON appointment_settings;

CREATE TRIGGER trg_appointment_settings_updated_at
BEFORE UPDATE ON appointment_settings
FOR EACH ROW
EXECUTE FUNCTION set_appointment_settings_updated_at();
