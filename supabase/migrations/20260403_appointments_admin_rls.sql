-- Admin-only RLS for appointments feature tables.
-- This secures direct Supabase access while API routes enforce admin session checks.

CREATE OR REPLACE FUNCTION public.is_appointments_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles AS p
    WHERE p.id = auth.uid()
      AND COALESCE(p.admin, false) = true
  );
$$;

REVOKE ALL ON FUNCTION public.is_appointments_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_appointments_admin() TO anon, authenticated;

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_assignments ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.appointments FORCE ROW LEVEL SECURITY;
ALTER TABLE public.workers FORCE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_assignments FORCE ROW LEVEL SECURITY;

DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('appointments', 'workers', 'appointment_assignments')
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  END LOOP;
END
$$;

CREATE POLICY appointments_admin_select
  ON public.appointments
  FOR SELECT
  TO authenticated
  USING (public.is_appointments_admin());

CREATE POLICY appointments_admin_insert
  ON public.appointments
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_appointments_admin());

CREATE POLICY appointments_admin_update
  ON public.appointments
  FOR UPDATE
  TO authenticated
  USING (public.is_appointments_admin())
  WITH CHECK (public.is_appointments_admin());

CREATE POLICY appointments_admin_delete
  ON public.appointments
  FOR DELETE
  TO authenticated
  USING (public.is_appointments_admin());

CREATE POLICY workers_admin_select
  ON public.workers
  FOR SELECT
  TO authenticated
  USING (public.is_appointments_admin());

CREATE POLICY workers_admin_insert
  ON public.workers
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_appointments_admin());

CREATE POLICY workers_admin_update
  ON public.workers
  FOR UPDATE
  TO authenticated
  USING (public.is_appointments_admin())
  WITH CHECK (public.is_appointments_admin());

CREATE POLICY workers_admin_delete
  ON public.workers
  FOR DELETE
  TO authenticated
  USING (public.is_appointments_admin());

CREATE POLICY assignments_admin_select
  ON public.appointment_assignments
  FOR SELECT
  TO authenticated
  USING (public.is_appointments_admin());

CREATE POLICY assignments_admin_insert
  ON public.appointment_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_appointments_admin());

CREATE POLICY assignments_admin_update
  ON public.appointment_assignments
  FOR UPDATE
  TO authenticated
  USING (public.is_appointments_admin())
  WITH CHECK (public.is_appointments_admin());

CREATE POLICY assignments_admin_delete
  ON public.appointment_assignments
  FOR DELETE
  TO authenticated
  USING (public.is_appointments_admin());

NOTIFY pgrst, 'reload schema';
