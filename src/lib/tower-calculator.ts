import { TowerParams, AchievementEffect } from "@/types/tower";
import { TOWER_TIERS } from "./constants";

export function calculateTowerTier(totalCommits: number): number {
  for (let i = TOWER_TIERS.length - 1; i >= 0; i--) {
    if (totalCommits >= TOWER_TIERS[i].minCommits) {
      return i;
    }
  }
  return 0;
}

export function calculateTowerParams(
  totalCommits: number,
  achievements: AchievementEffect[] = []
): TowerParams {
  const tier = calculateTowerTier(totalCommits);
  const tierConfig = TOWER_TIERS[tier];

  // Logarithmic height: 1 commit = 0, 10 = 10, 100 = 20, 1000 = 30, 10000 = 40
  const baseHeight = totalCommits > 0 ? Math.log10(totalCommits) * 10 : 2;

  // Achievement height bonus: each achievement adds 5% height + 1 unit per tier
  const achievementHeightBonus = achievements.reduce(
    (sum, a) => sum + 1 + (a.tier - 1) * 0.5,
    0
  );
  const height = baseHeight + achievementHeightBonus;

  // Width scales slightly with tier + minor achievement boost
  const width = 2 + tier * 0.5 + Math.min(achievements.length * 0.1, 0.5);

  // Floors based on height
  const floors = Math.max(1, Math.floor(height / 2));

  // Achievement buffs: each achievement adds glow boost, scaled by tier
  const achievementGlowBoost = achievements.reduce(
    (sum, a) => sum + 0.05 * a.tier,
    0
  );

  return {
    tier,
    height: Math.max(2, height),
    width,
    floors,
    windowDensity: tierConfig.windowDensity,
    materialType: tierConfig.material,
    colorPrimary: tierConfig.colorPrimary,
    colorSecondary: tierConfig.colorSecondary,
    hasAntenna: tierConfig.hasAntenna,
    hasSpire: tierConfig.hasSpire,
    hasCrown: tierConfig.hasCrown,
    glowIntensity: Math.min(1, tierConfig.glowIntensity + achievementGlowBoost),
    achievements,
  };
}

export function getTierName(tier: number): string {
  return TOWER_TIERS[tier]?.name ?? "Unknown";
}

export function getTierDescription(tier: number): string {
  return TOWER_TIERS[tier]?.description ?? "";
}

export function getNextTierProgress(totalCommits: number): {
  currentTier: number;
  nextTier: number | null;
  progress: number;
  commitsNeeded: number;
} {
  const currentTier = calculateTowerTier(totalCommits);

  if (currentTier >= TOWER_TIERS.length - 1) {
    return { currentTier, nextTier: null, progress: 1, commitsNeeded: 0 };
  }

  const nextTierConfig = TOWER_TIERS[currentTier + 1];
  const currentTierConfig = TOWER_TIERS[currentTier];
  const range = nextTierConfig.minCommits - currentTierConfig.minCommits;
  const progress = (totalCommits - currentTierConfig.minCommits) / range;
  const commitsNeeded = nextTierConfig.minCommits - totalCommits;

  return {
    currentTier,
    nextTier: currentTier + 1,
    progress: Math.min(1, Math.max(0, progress)),
    commitsNeeded: Math.max(0, commitsNeeded),
  };
}
