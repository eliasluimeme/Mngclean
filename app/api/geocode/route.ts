import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json({ error: "Missing coordinates" }, { status: 400 });
  }

  const response = await fetch(
    `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${process.env.OPENCAGE_API_KEY}&language=fr&pretty=1`
  );
  const data = await response.json();

  return NextResponse.json(data);
} 