import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  const { data: users } = await supabase
    .from("users")
    .select("username, display_name, avatar_url, total_commits, tower_tier")
    .ilike("username", `%${query}%`)
    .limit(10);

  return NextResponse.json(
    (users || []).map((u) => ({
      username: u.username,
      displayName: u.display_name,
      avatarUrl: u.avatar_url,
      totalCommits: u.total_commits,
      towerTier: u.tower_tier,
    }))
  );
}
