"use client";

import { TowerParams } from "@/types/tower";
import { Html } from "@react-three/drei";
import ShackTower from "./tiers/ShackTower";
import BrickTower from "./tiers/BrickTower";
import OfficeTower from "./tiers/OfficeTower";
import GlassTower from "./tiers/GlassTower";
import SkyscraperTower from "./tiers/SkyscraperTower";
import FuturisticTower from "./tiers/FuturisticTower";
import TowerEffects from "./TowerEffects";

interface TowerProps {
  params: TowerParams;
  position?: [number, number, number];
  username?: string;
  totalCommits?: number;
  onClick?: () => void;
  showLabel?: boolean;
}

const TIER_COMPONENTS = [
  ShackTower,
  BrickTower,
  OfficeTower,
  GlassTower,
  SkyscraperTower,
  FuturisticTower,
];

export default function Tower({
  params,
  position = [0, 0, 0],
  username,
  totalCommits,
  onClick,
  showLabel = true,
}: TowerProps) {
  const TierComponent = TIER_COMPONENTS[params.tier] ?? ShackTower;

  return (
    <group position={position} onClick={onClick}>
      {/* Tower geometry based on tier */}
      <TierComponent params={params} />

      {/* Achievement effects */}
      {params.achievements.length > 0 && (
        <TowerEffects
          achievements={params.achievements}
          towerHeight={params.height}
          towerWidth={params.width}
        />
      )}

      {/* Floating label */}
      {showLabel && username && (
        <Html
          position={[0, params.height + 2, 0]}
          center
          distanceFactor={30}
          style={{ pointerEvents: "none" }}
        >
          <div className="whitespace-nowrap rounded-lg bg-black/80 backdrop-blur-sm px-3 py-1.5 text-center border border-white/10">
            <div className="text-xs font-semibold text-white">{username}</div>
            {totalCommits !== undefined && (
              <div className="text-[10px] text-cyan-400">
                {totalCommits.toLocaleString()} commits
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}
