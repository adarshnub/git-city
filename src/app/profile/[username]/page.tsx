"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { TowerData } from "@/types/tower";
import { formatNumber } from "@/utils/format";
import { TOWER_TIERS } from "@/lib/constants";
import { getNextTierProgress, getTierName } from "@/lib/tower-calculator";

// Dynamic import for 3D components (SSR disabled)
const CityScene = dynamic(() => import("@/components/city/CityScene"), {
  ssr: false,
});
const Tower = dynamic(() => import("@/components/tower/Tower"), {
  ssr: false,
});

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [towerData, setTowerData] = useState<TowerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [geoCoords, setGeoCoords] = useState<{ lat: number; lng: number } | null>(null);
  const geoRequested = useRef(false);

  // Silently try to get geolocation for globe positioning (no prompt if denied)
  useEffect(() => {
    if (geoRequested.current) return;
    geoRequested.current = true;
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGeoCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {} // silently ignore errors
      );
    }
  }, []);

  useEffect(() => {
    if (!username) return;

    setLoading(true);
    fetch(`/api/users/${username}`)
      .then((res) => {
        if (!res.ok) throw new Error("User not found");
        return res.json();
      })
      .then((data) => {
        setTowerData(data);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-cyan-400" />
          <p className="mt-4 text-white/50">Loading tower...</p>
        </div>
      </div>
    );
  }

  if (error || !towerData) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold text-white/80">User not found</p>
          <p className="mt-2 text-white/40">
            @{username} hasn&apos;t joined Git City yet, or hasn&apos;t synced
            their commits.
          </p>
        </div>
      </div>
    );
  }

  const tierConfig = TOWER_TIERS[towerData.towerTier];
  const progress = getNextTierProgress(towerData.totalCommits);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col lg:flex-row">
      {/* 3D Tower View */}
      <div className="relative h-[50vh] lg:h-auto lg:flex-1">
        <CityScene
          cameraPosition={[
            towerData.params.width * 3,
            towerData.params.height * 0.8,
            towerData.params.width * 3,
          ]}
          autoRotate
          showGround
          showEarth
          userLat={geoCoords?.lat ?? null}
          userLng={geoCoords?.lng ?? null}
        >
          <Tower
            params={towerData.params}
            username={towerData.username}
            totalCommits={towerData.totalCommits}
            userRole={towerData.userRole}
            editionNumber={towerData.editionNumber}
            showLabel={false}
          />
        </CityScene>

        {/* Tower tier badge overlay */}
        <div className="absolute bottom-4 left-4 rounded-xl bg-black/60 backdrop-blur-sm px-4 py-2 border border-white/10">
          <span className="text-sm font-semibold" style={{ color: tierConfig.colorPrimary }}>
            {tierConfig.name}
          </span>
        </div>

        {/* Zoom hint */}
        <div className="absolute bottom-4 right-4 rounded-xl bg-black/40 backdrop-blur-sm px-3 py-1.5 border border-white/5">
          <span className="text-[10px] text-white/30">
            Scroll to zoom · See Earth view
          </span>
        </div>
      </div>

      {/* Profile Info Sidebar */}
      <div className="w-full lg:w-96 border-l border-white/10 bg-gray-950 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* User Header */}
          <div className="flex items-center gap-4">
            {towerData.avatarUrl && (
              <img
                src={towerData.avatarUrl}
                alt={towerData.username}
                className="h-16 w-16 rounded-full border-2 border-white/10"
              />
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">
                  {towerData.displayName || towerData.username}
                </h1>
                {towerData.userRole === "master" && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold border"
                    style={{
                      color: "#ff4500",
                      borderColor: "rgba(255,69,0,0.5)",
                      background: "linear-gradient(135deg, rgba(255,69,0,0.2), rgba(255,165,0,0.15))",
                      textShadow: "0 0 6px rgba(255,69,0,0.5)",
                    }}
                  >
                    MASTER
                  </span>
                )}
                {towerData.editionNumber != null && towerData.editionNumber > 0 && towerData.editionNumber <= 10 && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold border"
                    style={{
                      color: "#ffd700",
                      borderColor: "rgba(255,215,0,0.4)",
                      background: "rgba(255,215,0,0.1)",
                    }}
                  >
                    #{towerData.editionNumber}
                  </span>
                )}
              </div>
              <p className="text-white/50">@{towerData.username}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-white/40 uppercase">Total Commits</p>
              <p className="text-2xl font-bold text-cyan-400">
                {formatNumber(towerData.totalCommits)}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-white/40 uppercase">Tower Tier</p>
              <p
                className="text-lg font-bold"
                style={{ color: tierConfig.colorPrimary }}
              >
                {tierConfig.name}
              </p>
            </div>
            {towerData.commitStats && (
              <>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-white/40 uppercase">Repos</p>
                  <p className="text-2xl font-bold text-purple-400">
                    {towerData.commitStats.totalRepos}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-white/40 uppercase">Best Streak</p>
                  <p className="text-2xl font-bold text-amber-400">
                    {towerData.commitStats.longestStreak}d
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Tier Progress */}
          {progress.nextTier !== null && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/60">
                  Next: {getTierName(progress.nextTier)}
                </span>
                <span className="text-white/40">
                  {progress.commitsNeeded.toLocaleString()} to go
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-500"
                  style={{ width: `${progress.progress * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Achievements */}
          {towerData.achievements.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-white/80 mb-3">
                Achievements
              </h2>
              <div className="space-y-2">
                {towerData.achievements.map((a) => (
                  <div
                    key={a.type}
                    className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  >
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: a.color }}
                    />
                    <div>
                      <p className="text-sm font-medium">{a.name}</p>
                      <p className="text-xs text-white/40">
                        Tier {a.tier} &middot; {a.effect} effect
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Yearly Commits */}
          {towerData.commitStats?.yearlyCommits && (
            <div>
              <h2 className="text-sm font-semibold text-white/80 mb-3">
                Yearly Commits
              </h2>
              <div className="space-y-2">
                {Object.entries(towerData.commitStats.yearlyCommits)
                  .sort(([a], [b]) => parseInt(b) - parseInt(a))
                  .map(([year, count]) => (
                    <div key={year} className="flex items-center justify-between text-sm">
                      <span className="text-white/50">{year}</span>
                      <span className="font-medium text-cyan-400">
                        {count.toLocaleString()}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Top Languages */}
          {towerData.commitStats?.languageStats &&
            Object.keys(towerData.commitStats.languageStats).length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-white/80 mb-3">
                  Top Languages
                </h2>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(towerData.commitStats.languageStats)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 8)
                    .map(([lang]) => (
                      <span
                        key={lang}
                        className="rounded-md bg-white/5 border border-white/10 px-2 py-1 text-xs"
                      >
                        {lang}
                      </span>
                    ))}
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
