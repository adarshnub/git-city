"use client";

import { useMemo } from "react";
import { useAdmin } from "./AdminControls";

interface NamePlateProps {
  username: string;
  totalCommits: number;
  achievementCount?: number;
  avatarUrl?: string | null;
  editionNumber?: number | null; // 1-10 for first users
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}

const PLATE_TIERS = [
  { name: "Newcomer", min: 0, borderColor: "#555555", glowColor: "transparent", bgGradient: "linear-gradient(135deg, #1a1a2e, #16213e)" },
  { name: "Builder", min: 50, borderColor: "#cd7f32", glowColor: "rgba(205,127,50,0.2)", bgGradient: "linear-gradient(135deg, #2a1f10, #1a1505)" },
  { name: "Architect", min: 250, borderColor: "#c0c0c0", glowColor: "rgba(192,192,192,0.25)", bgGradient: "linear-gradient(135deg, #1a1a2e, #2a2a3e)" },
  { name: "Master", min: 1000, borderColor: "#ffd700", glowColor: "rgba(255,215,0,0.3)", bgGradient: "linear-gradient(135deg, #2a2510, #1a1a05)" },
  { name: "Legend", min: 5000, borderColor: "#00d4ff", glowColor: "rgba(0,212,255,0.35)", bgGradient: "linear-gradient(135deg, #0a1a2e, #051525)" },
  { name: "Mythic", min: 10000, borderColor: "#ff00ff", glowColor: "rgba(255,0,255,0.3)", bgGradient: "linear-gradient(135deg, #1a0a2e, #0a0520)" },
];

function getTier(commits: number): number {
  for (let i = PLATE_TIERS.length - 1; i >= 0; i--) {
    if (commits >= PLATE_TIERS[i].min) return i;
  }
  return 0;
}

export default function NamePlate({
  username,
  totalCommits,
  achievementCount = 0,
  avatarUrl,
  editionNumber,
  size = "md",
  onClick,
}: NamePlateProps) {
  const admin = useAdmin();

  // Use admin overrides if available
  const effectiveCommits = admin?.overrides.commits ?? totalCommits;
  const effectiveAchievements = admin?.overrides.achievements ?? achievementCount;
  const effectiveEdition = admin?.overrides.edition ?? editionNumber;

  const tier = getTier(effectiveCommits);
  const config = PLATE_TIERS[tier];

  const sizeClasses = {
    sm: { wrapper: "px-2 py-1", text: "text-[11px]", avatar: "h-5 w-5", badge: "text-[8px] px-1" },
    md: { wrapper: "px-3 py-1.5", text: "text-xs", avatar: "h-7 w-7", badge: "text-[9px] px-1.5" },
    lg: { wrapper: "px-4 py-2", text: "text-sm", avatar: "h-9 w-9", badge: "text-[10px] px-2" },
  };
  const s = sizeClasses[size];

  // Achievement dot colors
  const achievementColors = ["#00BFFF", "#FFD700", "#FF4500", "#9B59B6", "#FFFF00", "#1E90FF", "#00FF00"];

  const animationStyle = useMemo(() => {
    const base: React.CSSProperties = {
      background: config.bgGradient,
      borderColor: config.borderColor,
      boxShadow: `0 0 ${tier >= 3 ? 12 : tier >= 1 ? 6 : 0}px ${config.glowColor}`,
      transition: "all 0.5s ease",
    };

    if (tier >= 5) {
      // Mythic: rainbow border animation
      return {
        ...base,
        borderImage: "linear-gradient(var(--nameplate-angle, 0deg), #ff0000, #ff7700, #ffff00, #00ff00, #0077ff, #ff00ff, #ff0000) 1",
        animation: "nameplate-rainbow 3s linear infinite, nameplate-glow 2s ease-in-out infinite",
      };
    }
    if (tier >= 4) {
      // Legend: sparkle shimmer
      return {
        ...base,
        animation: "nameplate-shimmer 2s ease-in-out infinite, nameplate-glow 1.5s ease-in-out infinite",
      };
    }
    if (tier >= 3) {
      // Master: gold glow
      return {
        ...base,
        animation: "nameplate-glow 2s ease-in-out infinite",
      };
    }
    if (tier >= 2) {
      // Architect: subtle shimmer
      return {
        ...base,
        animation: "nameplate-shimmer 3s ease-in-out infinite",
      };
    }
    if (tier >= 1) {
      // Builder: subtle pulse
      return {
        ...base,
        animation: "nameplate-pulse 3s ease-in-out infinite",
      };
    }
    return base;
  }, [tier, config]);

  return (
    <>
      {/* Keyframe animations injected once */}
      <style>{`
        @keyframes nameplate-pulse {
          0%, 100% { opacity: 0.85; }
          50% { opacity: 1; }
        }
        @keyframes nameplate-shimmer {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.15); }
        }
        @keyframes nameplate-glow {
          0%, 100% { box-shadow: 0 0 8px ${config.glowColor}; }
          50% { box-shadow: 0 0 18px ${config.glowColor}, 0 0 30px ${config.glowColor}; }
        }
        @keyframes nameplate-rainbow {
          0% { --nameplate-angle: 0deg; border-color: #ff0000; }
          16% { border-color: #ff7700; }
          33% { border-color: #ffff00; }
          50% { border-color: #00ff00; }
          66% { border-color: #0077ff; }
          83% { border-color: #ff00ff; }
          100% { --nameplate-angle: 360deg; border-color: #ff0000; }
        }
      `}</style>
      <div
        className={`inline-flex items-center gap-2 rounded-lg border-2 backdrop-blur-sm cursor-pointer hover:brightness-110 transition-all ${s.wrapper}`}
        style={animationStyle}
        onClick={onClick}
      >
        {/* Avatar */}
        {avatarUrl && (
          <img
            src={avatarUrl}
            alt=""
            className={`${s.avatar} rounded-full border border-white/20`}
          />
        )}

        {/* Name + info */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className={`${s.text} font-semibold text-white`}>
              {username}
            </span>

            {/* Edition badge for first 10 */}
            {effectiveEdition != null && effectiveEdition > 0 && effectiveEdition <= 10 && (
              <span
                className={`${s.badge} rounded-full font-bold border`}
                style={{
                  color: "#ffd700",
                  borderColor: "rgba(255,215,0,0.4)",
                  background: "rgba(255,215,0,0.1)",
                }}
              >
                #{effectiveEdition}
              </span>
            )}

            {/* Tier badge */}
            <span
              className={`${s.badge} rounded py-0.5 font-medium`}
              style={{
                color: config.borderColor,
                background: `${config.borderColor}15`,
              }}
            >
              {config.name}
            </span>
          </div>

          {/* Commits + achievement dots */}
          <div className="flex items-center gap-1">
            <span className={`${s.badge} text-white/40`}>
              {effectiveCommits.toLocaleString()} commits
            </span>
            {/* Achievement dots */}
            {effectiveAchievements > 0 && (
              <div className="flex items-center gap-0.5 ml-1">
                {Array.from({ length: Math.min(effectiveAchievements, 7) }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-full"
                    style={{
                      width: size === "sm" ? 4 : size === "md" ? 5 : 6,
                      height: size === "sm" ? 4 : size === "md" ? 5 : 6,
                      backgroundColor: achievementColors[i % achievementColors.length],
                      boxShadow: `0 0 4px ${achievementColors[i % achievementColors.length]}`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
