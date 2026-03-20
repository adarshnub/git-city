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
  userRole?: string;
  editionNumber?: number | null;
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
  userRole,
  editionNumber,
}: TowerProps) {
  const TierComponent = TIER_COMPONENTS[params.tier] ?? ShackTower;
  const flagRef = useRef<THREE.Group>(null);
  const creatorRingRef = useRef<THREE.Group>(null);
  const creatorBeaconRef = useRef<THREE.Mesh>(null);
  const creatorCrownRef = useRef<THREE.Group>(null);

  const isCreator = userRole === "master";

  // Get timezone info
  const tzInfo = useMemo(() => {
    const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    return {
      name: tz.split("/").pop()?.replace(/_/g, " ") || "",
      time: getLocalTime(tz),
      offset: getUtcOffset(tz),
    };
  }, [timezone]);

  // Animations
  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Flag wave
    if (flagRef.current) {
      flagRef.current.rotation.y = Math.sin(t * 0.8) * 0.1;
    }

    // Creator ring rotation
    if (creatorRingRef.current) {
      creatorRingRef.current.rotation.y = t * 0.3;
    }

    // Creator beacon pulse
    if (creatorBeaconRef.current) {
      const mat = creatorBeaconRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 1.5 + Math.sin(t * 2) * 0.8;
      creatorBeaconRef.current.scale.setScalar(1 + Math.sin(t * 1.5) * 0.05);
    }

    // Creator crown orbit
    if (creatorCrownRef.current) {
      creatorCrownRef.current.rotation.y = t * 0.5;
      creatorCrownRef.current.position.y =
        params.height + 2 + Math.sin(t * 0.8) * 0.3;
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

      {/* === CREATOR-ONLY EFFECTS === */}
      {isCreator && (
        <>
          {/* Base: glowing golden-red platform */}
          <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}>
            <ringGeometry args={[params.width * 0.8, params.width * 1.2, 6]} />
            <meshStandardMaterial
              color="#ff6600"
              emissive="#ff4400"
              emissiveIntensity={1.5}
              transparent
              opacity={0.4}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Rotating hexagonal rings at different heights */}
          <group ref={creatorRingRef}>
            {[0.25, 0.5, 0.75].map((frac, i) => (
              <mesh
                key={`cring-${i}`}
                rotation-x={Math.PI / 2}
                position={[0, params.height * frac, 0]}
              >
                <ringGeometry
                  args={[
                    params.width * (0.9 + i * 0.15),
                    params.width * (0.95 + i * 0.15),
                    6,
                  ]}
                />
                <meshStandardMaterial
                  color={i === 1 ? "#ff4400" : "#ffa500"}
                  emissive={i === 1 ? "#ff2200" : "#ff6600"}
                  emissiveIntensity={1.2}
                  transparent
                  opacity={0.3 - i * 0.05}
                  side={THREE.DoubleSide}
                />
              </mesh>
            ))}
          </group>

          {/* Vertical energy beams at corners */}
          {[0, Math.PI / 3, (2 * Math.PI) / 3, Math.PI, (4 * Math.PI) / 3, (5 * Math.PI) / 3].map(
            (angle, i) => (
              <mesh
                key={`cbeam-${i}`}
                position={[
                  Math.cos(angle) * params.width * 0.85,
                  params.height * 0.5,
                  Math.sin(angle) * params.width * 0.85,
                ]}
              >
                <cylinderGeometry args={[0.02, 0.02, params.height, 4]} />
                <meshStandardMaterial
                  color="#ff6600"
                  emissive="#ff4400"
                  emissiveIntensity={2}
                  transparent
                  opacity={0.25}
                />
              </mesh>
            )
          )}

          {/* Crown: floating diamond above tower */}
          <group ref={creatorCrownRef} position={[0, params.height + 2, 0]}>
            <mesh ref={creatorBeaconRef}>
              <octahedronGeometry args={[0.6, 0]} />
              <meshStandardMaterial
                color="#ff4400"
                emissive="#ff6600"
                emissiveIntensity={2}
                metalness={0.9}
                roughness={0.1}
              />
            </mesh>
            {/* Orbiting mini-gems */}
            {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((offset, i) => (
              <mesh
                key={`gem-${i}`}
                position={[
                  Math.cos(offset) * 1.2,
                  0,
                  Math.sin(offset) * 1.2,
                ]}
              >
                <octahedronGeometry args={[0.15, 0]} />
                <meshStandardMaterial
                  color="#ffd700"
                  emissive="#ffa500"
                  emissiveIntensity={1.5}
                  metalness={0.8}
                  roughness={0.1}
                />
              </mesh>
            ))}
          </group>

          {/* Creator point light — warm glow */}
          <pointLight
            position={[0, params.height * 0.5, 0]}
            intensity={2}
            color="#ff6600"
            distance={params.width * 4}
            decay={2}
          />
        </>
      )}

      {/* Location flag on top of tower */}
      <group ref={flagRef} position={[0, flagY, 0]}>
        {/* Flag pole */}
        <mesh position={[0, 0.6, 0]}>
          <cylinderGeometry args={[0.015, 0.02, 1.2, 6]} />
          <meshStandardMaterial
            color={isCreator ? "#ffd700" : "#c0c0c0"}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
        {/* Flag body */}
        <mesh position={[0.25, 1.05, 0]}>
          <planeGeometry args={[0.5, 0.3]} />
          <meshStandardMaterial
            color={isCreator ? "#ff4400" : "#ffffff"}
            emissive={isCreator ? "#ff2200" : "#334455"}
            emissiveIntensity={isCreator ? 0.8 : 0.3}
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

      {/* Floating label with timezone + location + badges */}
      {showLabel && username && (
        <Html
          position={[0, flagY + 1, 0]}
          center
          distanceFactor={30}
          style={{ pointerEvents: "none" }}
        >
          <div
            className="whitespace-nowrap rounded-lg backdrop-blur-sm px-3 py-2 text-center border shadow-lg"
            style={{
              background: isCreator
                ? "rgba(30, 10, 0, 0.9)"
                : "rgba(0, 0, 0, 0.8)",
              borderColor: isCreator
                ? "rgba(255, 100, 0, 0.4)"
                : "rgba(255, 255, 255, 0.1)",
              boxShadow: isCreator
                ? "0 0 20px rgba(255, 100, 0, 0.3)"
                : "0 4px 12px rgba(0, 200, 255, 0.1)",
            }}
          >
            {/* Badges row */}
            <div className="flex items-center justify-center gap-1.5 mb-0.5">
              {isCreator && (
                <span
                  className="text-[8px] font-bold rounded-full px-1.5 py-0.5 border"
                  style={{
                    color: "#ff4500",
                    borderColor: "rgba(255,69,0,0.5)",
                    background:
                      "linear-gradient(135deg, rgba(255,69,0,0.25), rgba(255,165,0,0.2))",
                    textShadow: "0 0 6px rgba(255,69,0,0.6)",
                  }}
                >
                  CREATOR
                </span>
              )}
              {editionNumber != null &&
                editionNumber > 0 &&
                editionNumber <= 10 && (
                  <span
                    className="text-[8px] font-bold rounded-full px-1.5 py-0.5 border"
                    style={{
                      color: "#ffd700",
                      borderColor: "rgba(255,215,0,0.4)",
                      background: "rgba(255,215,0,0.15)",
                    }}
                  >
                    #{editionNumber}
                  </span>
                )}
            </div>
            <div
              className="text-xs font-semibold"
              style={{ color: isCreator ? "#ff8844" : "#ffffff" }}
            >
              {username}
            </div>
            {totalCommits !== undefined && (
              <div
                className="text-[10px]"
                style={{ color: isCreator ? "#ff6633" : "#22d3ee" }}
              >
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
