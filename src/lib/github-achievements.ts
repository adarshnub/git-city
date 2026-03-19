import { AchievementEffect } from "@/types/tower";
import { GITHUB_ACHIEVEMENTS, AchievementKey } from "./constants";

export async function scrapeAchievements(
  username: string
): Promise<AchievementEffect[]> {
  try {
    const response = await fetch(`https://github.com/${username}`, {
      headers: {
        "User-Agent": "GitCity/1.0",
        Accept: "text/html",
      },
    });

    if (!response.ok) return [];

    const html = await response.text();
    const achievements: AchievementEffect[] = [];

    // Parse achievement badges from GitHub profile HTML
    // GitHub renders achievements with specific data attributes
    for (const [key, config] of Object.entries(GITHUB_ACHIEVEMENTS)) {
      const achievementName = config.name.toLowerCase().replace(/\s+/g, "-");

      // Check various patterns GitHub uses for achievements
      if (
        html.includes(achievementName) ||
        html.includes(key.toLowerCase().replace(/_/g, "-"))
      ) {
        // Try to detect tier from the HTML context
        let tier = 1;
        const tierPatterns = [/gold/i, /silver/i, /bronze/i];
        const surroundingText = extractSurroundingText(html, achievementName);

        if (tierPatterns[0].test(surroundingText)) tier = 3;
        else if (tierPatterns[1].test(surroundingText)) tier = 2;
        else if (tierPatterns[2].test(surroundingText)) tier = 1;

        achievements.push({
          type: key,
          name: config.name,
          tier: Math.min(tier, config.maxTiers),
          effect: config.effect,
          color: config.color,
        });
      }
    }

    return achievements;
  } catch {
    console.error("Failed to scrape achievements for", username);
    return [];
  }
}

function extractSurroundingText(html: string, keyword: string): string {
  const index = html.indexOf(keyword);
  if (index === -1) return "";
  const start = Math.max(0, index - 200);
  const end = Math.min(html.length, index + 200);
  return html.substring(start, end);
}

export function mapDbAchievementsToEffects(
  dbAchievements: { achievementType: string; tier: number }[]
): AchievementEffect[] {
  const results: AchievementEffect[] = [];
  for (const a of dbAchievements) {
    const config = GITHUB_ACHIEVEMENTS[a.achievementType as AchievementKey];
    if (!config) continue;
    results.push({
      type: a.achievementType,
      name: config.name as string,
      tier: a.tier,
      effect: config.effect as string,
      color: config.color as string,
    });
  }
  return results;
}
