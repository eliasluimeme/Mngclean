"use client";

import { AppointmentsShell } from "@/components/appointments/appointments-shell";
import { MainLayout } from "@/components/layout/main-layout";

export default function AppointmentsPage() {
  return (
    <MainLayout
      title="Appointments"
      subtitle="Resource-aware scheduling for morning and evening slots"
    >
      <AppointmentsShell />
    </MainLayout>
  );
}
