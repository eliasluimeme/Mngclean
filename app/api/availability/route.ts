import { NextResponse } from "next/server";
import { requireAdminApiAccess } from "@/lib/admin-api";
import { getRemainingCapacityHint } from "@/lib/appointments/capacity";
import { getSlotAvailability } from "@/lib/appointments/server";
import { isTimeslot } from "@/lib/appointments/validators";

export async function GET(request: Request) {
  const authError = await requireAdminApiAccess();
  if (authError) {
    return authError;
  }

  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const timeslot = searchParams.get("timeslot");
    const excludeAppointmentId = searchParams.get("excludeAppointmentId") || undefined;

    if (!date) {
      return NextResponse.json({ error: "Date is required." }, { status: 400 });
    }

    if (!timeslot || !isTimeslot(timeslot)) {
      return NextResponse.json({ error: "Valid timeslot is required." }, { status: 400 });
    }

    const availability = await getSlotAvailability(date, timeslot, excludeAppointmentId);

    return NextResponse.json({
      ...availability,
      capacity_hint: getRemainingCapacityHint(availability.capacity.remaining),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch availability." }, { status: 500 });
  }
}
