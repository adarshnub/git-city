import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { roundCoordinate, encodeGeohash } from "@/lib/geolocation";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { latitude, longitude, isSharing } = body;

  if (isSharing === false) {
    await supabase.from("user_locations").delete().eq("user_id", session.user.id);
    return NextResponse.json({ success: true });
  }

  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  const roundedLat = roundCoordinate(latitude);
  const roundedLng = roundCoordinate(longitude);
  const geohash = encodeGeohash(roundedLat, roundedLng);

  await supabase.from("user_locations").upsert(
    {
      user_id: session.user.id,
      latitude: roundedLat,
      longitude: roundedLng,
      geohash,
      is_sharing: true,
    },
    { onConflict: "user_id" }
  );

  return NextResponse.json({ success: true });
}
