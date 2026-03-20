"use client";

import { useMemo } from "react";
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
  timezone?: string;
}

const TIER_COMPONENTS = [
  ShackTower,
  BrickTower,
  OfficeTower,
  GlassTower,
  SkyscraperTower,
  FuturisticTower,
];

function getLocalTime(tz: string): string {
  try {
    return new Date().toLocaleTimeString("en-US", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
}

function getUtcOffset(tz: string): string {
  try {
    const now = new Date();
    const formatted = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    }).format(now);
    const match = formatted.match(/GMT([+-]\d+(?::\d+)?)/);
    return match ? `UTC${match[1]}` : "";
  } catch {
    return "";
  }
}

export default function Tower({
  params,
  position = [0, 0, 0],
  username,
  totalCommits,
  onClick,
  showLabel = true,
  timezone,
}: TowerProps) {
  const TierComponent = TIER_COMPONENTS[params.tier] ?? ShackTower;

  // Get timezone info
  const tzInfo = useMemo(() => {
    const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    return {
      name: tz.split("/").pop()?.replace(/_/g, " ") || "",
      time: getLocalTime(tz),
      offset: getUtcOffset(tz),
    };
  }, [timezone]);

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

      {/* Floating label with timezone */}
      {showLabel && username && (
        <Html
          position={[0, params.height + 3, 0]}
          center
          distanceFactor={30}
          style={{ pointerEvents: "none" }}
        >
          <div className="whitespace-nowrap rounded-lg bg-black/80 backdrop-blur-sm px-3 py-2 text-center border border-white/10 shadow-lg shadow-cyan-500/10">
            <div className="text-xs font-semibold text-white">{username}</div>
            {totalCommits !== undefined && (
              <div className="text-[10px] text-cyan-400">
                {totalCommits.toLocaleString()} commits
              </div>
            )}
            {tzInfo.name && (
              <div className="mt-1 pt-1 border-t border-white/10">
                <div className="text-[10px] text-amber-400/90 font-medium">
                  {tzInfo.time}
                </div>
                <div className="text-[9px] text-white/30">
                  {tzInfo.name} · {tzInfo.offset}
                </div>
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}
