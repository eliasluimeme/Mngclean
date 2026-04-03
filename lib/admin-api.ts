import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth.server";

export async function requireAdminApiAccess(): Promise<NextResponse | null> {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session.user?.admin) {
    return NextResponse.json({ error: "Forbidden: admin access required." }, { status: 403 });
  }

  return null;
}
