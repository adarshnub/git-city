import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { calculateTowerParams } from "@/lib/tower-calculator";
import { mapDbAchievementsToEffects } from "@/lib/github-achievements";
import { TowerData } from "@/types/tower";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const { data: user } = await supabase
    .from("users")
    .select("id, username, display_name, avatar_url, total_commits, tower_tier")
    .eq("username", username)
    .single();

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Fetch commit stats
  const { data: commitStats } = await supabase
    .from("commit_stats")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Fetch achievements
  const { data: achievements } = await supabase
    .from("user_achievements")
    .select("achievement_type, tier")
    .eq("user_id", user.id);

  const achievementEffects = mapDbAchievementsToEffects(
    (achievements || []).map((a) => ({
      achievementType: a.achievement_type,
      tier: a.tier,
    }))
  );

  const towerParams = calculateTowerParams(user.total_commits, achievementEffects);

  const towerData: TowerData = {
    username: user.username,
    displayName: user.display_name,
    avatarUrl: user.avatar_url,
    totalCommits: user.total_commits,
    towerTier: user.tower_tier,
    params: towerParams,
    commitStats: commitStats
      ? {
          totalCommits: commitStats.total_commits,
          totalRepos: commitStats.total_repos,
          longestStreak: commitStats.longest_streak,
          currentStreak: commitStats.current_streak,
          yearlyCommits: commitStats.yearly_commits,
          languageStats: commitStats.language_stats,
        }
      : null,
    achievements: achievementEffects,
  };

  return NextResponse.json(towerData);
}
