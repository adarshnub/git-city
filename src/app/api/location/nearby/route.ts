import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { haversineDistance } from "@/lib/geolocation";
import { NEARBY_RADIUS_METERS } from "@/lib/constants";
import { UserLocationData } from "@/types/location";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat") || "");
  const lng = parseFloat(searchParams.get("lng") || "");
  const radius = parseInt(searchParams.get("radius") || String(NEARBY_RADIUS_METERS));

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  // Fetch all sharing users with their user data
  const { data: locations } = await supabase
    .from("user_locations")
    .select("user_id, latitude, longitude, users(id, username, avatar_url, total_commits, tower_tier)")
    .eq("is_sharing", true)
    .neq("user_id", session.user.id);

  if (!locations) {
    return NextResponse.json([]);
  }

  // Filter by distance using Haversine
  const nearbyUsers: UserLocationData[] = locations
    .map((loc) => {
      const user = loc.users as unknown as {
        id: string;
        username: string;
        avatar_url: string | null;
        total_commits: number;
        tower_tier: number;
      };
      const distance = haversineDistance(lat, lng, loc.latitude, loc.longitude);
      return {
        userId: user.id,
        username: user.username,
        avatarUrl: user.avatar_url,
        totalCommits: user.total_commits,
        towerTier: user.tower_tier,
        latitude: loc.latitude,
        longitude: loc.longitude,
        distance,
      };
    })
    .filter((u) => u.distance <= radius)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 100);

  return NextResponse.json(nearbyUsers);
}
