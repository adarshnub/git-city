"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
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
  locationName?: string;
  countryCode?: string;
}

const TIER_COMPONENTS = [
  ShackTower,
  BrickTower,
  OfficeTower,
  GlassTower,
  SkyscraperTower,
  FuturisticTower,
];

// Simple country code to flag emoji
function countryFlag(code: string): string {
  if (!code || code.length !== 2) return "📍";
  const offset = 127397;
  return String.fromCodePoint(
    code.toUpperCase().charCodeAt(0) + offset,
    code.toUpperCase().charCodeAt(1) + offset
  );
}

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
  locationName,
  countryCode,
}: TowerProps) {
  const TierComponent = TIER_COMPONENTS[params.tier] ?? ShackTower;
  const flagRef = useRef<THREE.Group>(null);

  // Get timezone info
  const tzInfo = useMemo(() => {
    const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    return {
      name: tz.split("/").pop()?.replace(/_/g, " ") || "",
      time: getLocalTime(tz),
      offset: getUtcOffset(tz),
    };
  }, [timezone]);

  // Gentle flag wave animation
  useFrame((state) => {
    if (flagRef.current) {
      flagRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.1;
    }
  });

  // Flag pole height based on tower
  const flagY = params.height + (params.hasSpire ? params.height * 0.15 + 4 : 3.5);

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

      {/* Location flag on top of tower */}
      <group ref={flagRef} position={[0, flagY, 0]}>
        {/* Flag pole */}
        <mesh position={[0, 0.6, 0]}>
          <cylinderGeometry args={[0.015, 0.02, 1.2, 6]} />
          <meshStandardMaterial color="#c0c0c0" roughness={0.2} metalness={0.8} />
        </mesh>
        {/* Flag body */}
        <mesh position={[0.25, 1.05, 0]}>
          <planeGeometry args={[0.5, 0.3]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#334455"
            emissiveIntensity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Location label on the flag */}
        <Html
          position={[0.25, 1.05, 0.01]}
          center
          distanceFactor={15}
          style={{ pointerEvents: "none" }}
        >
          <div className="whitespace-nowrap text-[8px] font-bold select-none">
            {countryCode ? countryFlag(countryCode) : "📍"}
          </div>
        </Html>
        {/* Flag pole ball top */}
        <mesh position={[0, 1.25, 0]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color="#ffd700" roughness={0.1} metalness={0.9} />
        </mesh>
      </group>

      {/* Floating label with timezone + location */}
      {showLabel && username && (
        <Html
          position={[0, flagY + 1, 0]}
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
            {(locationName || tzInfo.name) && (
              <div className="mt-1 pt-1 border-t border-white/10">
                {locationName && (
                  <div className="text-[10px] text-white/60">
                    {countryCode ? countryFlag(countryCode) + " " : "📍 "}
                    {locationName}
                  </div>
                )}
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
