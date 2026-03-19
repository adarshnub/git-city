import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { fetchAllContributions, fetchUserRepoCount, fetchLanguageStats } from "@/lib/github";
import { calculateTowerTier } from "@/lib/tower-calculator";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user with access token
  const { data: user } = await supabase
    .from("users")
    .select("id, username, access_token, sync_status")
    .eq("username", session.user.username)
    .single();

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.sync_status === "SYNCING") {
    return NextResponse.json({ error: "Sync already in progress" }, { status: 409 });
  }

  if (!user.access_token) {
    return NextResponse.json({ error: "No access token" }, { status: 401 });
  }

  // Mark as syncing
  await supabase.from("users").update({ sync_status: "SYNCING" }).eq("id", user.id);

  try {
    const [contributions, repoCount, languageStats] = await Promise.all([
      fetchAllContributions(user.access_token, user.username),
      fetchUserRepoCount(user.access_token),
      fetchLanguageStats(user.access_token),
    ]);

    const towerTier = calculateTowerTier(contributions.totalCommits);

    // Upsert commit stats
    await supabase.from("commit_stats").upsert(
      {
        user_id: user.id,
        total_commits: contributions.totalCommits,
        total_repos: repoCount,
        longest_streak: contributions.longestStreak,
        current_streak: contributions.currentStreak,
        first_commit_date: contributions.firstCommitDate,
        yearly_commits: contributions.yearlyCommits,
        language_stats: languageStats,
      },
      { onConflict: "user_id" }
    );

    // Update user totals
    await supabase
      .from("users")
      .update({
        total_commits: contributions.totalCommits,
        tower_tier: towerTier,
        sync_status: "COMPLETED",
        last_synced_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    return NextResponse.json({
      totalCommits: contributions.totalCommits,
      towerTier,
      yearlyCommits: contributions.yearlyCommits,
      longestStreak: contributions.longestStreak,
      currentStreak: contributions.currentStreak,
    });
  } catch (error) {
    console.error("Sync failed:", error);
    await supabase.from("users").update({ sync_status: "FAILED" }).eq("id", user.id);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: user } = await supabase
    .from("users")
    .select("sync_status, last_synced_at, total_commits, tower_tier")
    .eq("username", session.user.username)
    .single();

  return NextResponse.json(user);
}
