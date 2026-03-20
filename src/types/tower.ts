export interface TowerParams {
  tier: number;
  height: number;
  width: number;
  floors: number;
  windowDensity: number;
  materialType: "wood" | "brick" | "concrete" | "glass" | "chrome" | "holographic";
  colorPrimary: string;
  colorSecondary: string;
  hasAntenna: boolean;
  hasSpire: boolean;
  hasCrown: boolean;
  glowIntensity: number;
  achievements: AchievementEffect[];
}

export interface AchievementEffect {
  type: string;
  name: string;
  tier: number;
  effect: string;
  color: string;
}

export interface TowerData {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  totalCommits: number;
  towerTier: number;
  userRole: string;
  editionNumber: number | null;
  params: TowerParams;
  commitStats: {
    totalCommits: number;
    totalRepos: number;
    longestStreak: number;
    currentStreak: number;
    yearlyCommits: Record<string, number> | null;
    languageStats: Record<string, number> | null;
  } | null;
  achievements: AchievementEffect[];
  position?: { x: number; z: number };
  distance?: number;
}
