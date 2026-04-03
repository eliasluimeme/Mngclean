CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS workers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'on_site', 'off_duty')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_name TEXT NOT NULL,
  address TEXT NOT NULL,
  service_type TEXT NOT NULL CHECK (service_type IN ('grand', 'petit')),
  scheduled_date DATE NOT NULL,
  timeslot TEXT NOT NULL CHECK (timeslot IN ('morning', 'evening')),
  status TEXT NOT NULL DEFAULT 'incoming' CHECK (
    status IN ('incoming', 'scheduled', 'on_site', 'pending_review', 'completed', 'cancelled')
  ),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointment_assignments (
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (appointment_id, worker_id)
);

CREATE INDEX IF NOT EXISTS idx_appointments_date_timeslot
  ON appointments (scheduled_date, timeslot);

CREATE INDEX IF NOT EXISTS idx_appointments_status
  ON appointments (status);

CREATE INDEX IF NOT EXISTS idx_appointment_assignments_worker_id
  ON appointment_assignments (worker_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_workers_phone_unique
  ON workers (phone)
  WHERE phone IS NOT NULL;

INSERT INTO workers (name, phone, is_active, status)
SELECT 'Yassine Amrani', '+212600000001', true, 'available'
WHERE NOT EXISTS (SELECT 1 FROM workers LIMIT 1);

INSERT INTO workers (name, phone, is_active, status)
SELECT 'Salma Idrissi', '+212600000002', true, 'available'
WHERE NOT EXISTS (SELECT 1 FROM workers WHERE phone = '+212600000002');

INSERT INTO workers (name, phone, is_active, status)
SELECT 'Karim Bennis', '+212600000003', true, 'available'
WHERE NOT EXISTS (SELECT 1 FROM workers WHERE phone = '+212600000003');

INSERT INTO workers (name, phone, is_active, status)
SELECT 'Nadia El Fassi', '+212600000004', true, 'available'
WHERE NOT EXISTS (SELECT 1 FROM workers WHERE phone = '+212600000004');

INSERT INTO workers (name, phone, is_active, status)
SELECT 'Rachid Tazi', '+212600000005', true, 'available'
WHERE NOT EXISTS (SELECT 1 FROM workers WHERE phone = '+212600000005');
