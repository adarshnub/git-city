import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { scrapeAchievements } from "@/lib/github-achievements";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.username || !session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const achievements = await scrapeAchievements(session.user.username);

    for (const achievement of achievements) {
      await supabase.from("user_achievements").upsert(
        {
          user_id: session.user.id,
          achievement_type: achievement.type,
          tier: achievement.tier,
        },
        { onConflict: "user_id,achievement_type" }
      );
    }

    return NextResponse.json({ achievements });
  } catch (error) {
    console.error("Achievement fetch failed:", error);
    return NextResponse.json({ error: "Failed to fetch achievements" }, { status: 500 });
  }
}
