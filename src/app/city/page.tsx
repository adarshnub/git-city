"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useNearbyUsers } from "@/hooks/useNearbyUsers";
import { geoToScenePosition, latLngToGlobePosition } from "@/lib/geolocation";
import { calculateTowerParams } from "@/lib/tower-calculator";
import { TowerData } from "@/types/tower";
import { NEARBY_RADIUS_OPTIONS } from "@/lib/constants";
import ChatPanel from "@/components/chat/ChatPanel";

const CityScene = dynamic(() => import("@/components/city/CityScene"), {
  ssr: false,
});
const Tower = dynamic(() => import("@/components/tower/Tower"), {
  ssr: false,
});
const GlobePositionedTower = dynamic(
  () => import("@/components/city/GlobePositionedTower"),
  { ssr: false }
);

export default function CityPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSharing, setIsSharing] = useState(false);
  const [myTowerData, setMyTowerData] = useState<TowerData | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [radius, setRadius] = useState(50000);
  const geo = useGeolocation();
  const { nearbyUsers, loading: nearbyLoading } = useNearbyUsers(
    geo.latitude,
    geo.longitude,
    isSharing,
    radius
  );

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch own tower data
  useEffect(() => {
    if (!session?.user?.username) return;
    fetch(`/api/users/${session.user.username}`)
      .then((res) => res.json())
      .then((data) => setMyTowerData(data))
      .catch(() => {});
  }, [session?.user?.username]);

  // Dynamically compute scale so all nearby towers fit within scene bounds at ground level
  const sceneScale = useMemo(() => {
    if (!nearbyUsers.length) return 0.05;
    const maxDist = Math.max(...nearbyUsers.map((u) => u.distance));
    if (maxDist <= 0) return 0.05;
    const targetSceneRadius = 30;
    const scale = targetSceneRadius / maxDist;
    return Math.min(Math.max(scale, 0.0001), 0.1);
  }, [nearbyUsers]);

  const handleEnableSharing = () => {
    geo.requestLocation();
    setIsSharing(true);
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-cyan-400" />
      </div>
    );
  }

  if (!session) return null;

  // Not sharing yet - show prompt
  if (!isSharing || !geo.latitude) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center border border-white/10">
            <svg
              className="h-10 w-10 text-cyan-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
              />
            </svg>
          </div>
          <h1 className="mb-3 text-2xl font-bold">City View</h1>
          <p className="mb-6 text-white/50">
            Enable location sharing to see towers from GitHub developers near
            you. Your location is rounded to ~100m and only shared while this
            page is open.
          </p>
          {geo.error && (
            <p className="mb-4 text-sm text-red-400">{geo.error}</p>
          )}
          <button
            onClick={handleEnableSharing}
            disabled={geo.loading}
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-8 py-3 font-medium text-white hover:from-cyan-400 hover:to-blue-400 transition-all disabled:opacity-50"
          >
            {geo.loading ? "Getting Location..." : "Enable Location Sharing"}
          </button>
          <p className="mt-4 text-xs text-white/30">
            You can disable sharing at any time by leaving this page.
          </p>
        </div>
      </div>
    );
  }

  // City view with 3D scene + chat
  return (
    <div className="relative h-[calc(100vh-4rem)]">
      <CityScene cameraPosition={[20, 25, 30]} showGround autoRotate={false} showEarth userLat={geo.latitude} userLng={geo.longitude}>
        {/* My tower at center */}
        {myTowerData && (
          <Tower
            params={myTowerData.params}
            position={[0, 0, 0]}
            username={myTowerData.username}
            totalCommits={myTowerData.totalCommits}
            userRole={myTowerData.userRole}
            editionNumber={myTowerData.editionNumber}
            onClick={() => router.push(`/profile/${myTowerData.username}`)}
          />
        )}

        {/* Nearby users' towers — positioned on globe surface when zoomed out */}
        {nearbyUsers.map((user) => {
          // Flat position for ground-level view
          const flatPos = geo.latitude && geo.longitude
            ? geoToScenePosition(
                user.latitude,
                user.longitude,
                geo.latitude,
                geo.longitude,
                sceneScale
              )
            : { x: 0, z: 0 };
          const flatPosition: [number, number, number] = [
            Math.max(-40, Math.min(40, flatPos.x)),
            0,
            Math.max(-40, Math.min(40, flatPos.z)),
          ];

          // Globe surface position for Earth-level view
          const globePosition: [number, number, number] =
            geo.latitude && geo.longitude
              ? latLngToGlobePosition(
                  user.latitude,
                  user.longitude,
                  geo.latitude,
                  geo.longitude
                )
              : [0, 0, 0];

          const commits = user.totalCommits || 0;
          const towerParams = calculateTowerParams(commits);

          return (
            <GlobePositionedTower
              key={user.userId}
              flatPosition={flatPosition}
              globePosition={globePosition}
            >
              <Tower
                params={towerParams}
                username={user.username}
                totalCommits={commits}
                onClick={() => router.push(`/profile/${user.username}`)}
              />
            </GlobePositionedTower>
          );
        })}
      </CityScene>

      {/* HUD Overlay */}
      <div className="absolute top-4 left-4 rounded-xl bg-black/60 backdrop-blur-sm border border-white/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm text-white/80">
            {nearbyLoading
              ? "Scanning..."
              : `${nearbyUsers.length} developer${nearbyUsers.length !== 1 ? "s" : ""} nearby`}
          </span>
        </div>
      </div>

      {/* Radius selector */}
      <div className="absolute top-16 left-4 rounded-xl bg-black/60 backdrop-blur-sm border border-white/10 px-4 py-3">
        <p className="text-[10px] text-white/40 uppercase mb-2">Search Radius</p>
        <div className="flex flex-wrap gap-1.5">
          {NEARBY_RADIUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRadius(opt.value)}
              className={`rounded-md px-2 py-1 text-xs transition-colors ${
                radius === opt.value
                  ? "bg-cyan-500/30 text-cyan-300 border border-cyan-500/50"
                  : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat panel - floating */}
      <div className="absolute bottom-4 right-4 z-50">
        {chatOpen ? (
          <ChatPanel
            channel="global"
            className="w-96 h-[500px]"
            onToggle={() => setChatOpen(false)}
          />
        ) : (
          <ChatPanel
            channel="global"
            collapsed
            onToggle={() => setChatOpen(true)}
          />
        )}
      </div>

      {/* Nearby Users List */}
      {nearbyUsers.length > 0 && (
        <div className="absolute bottom-4 left-4 max-h-64 w-72 overflow-y-auto rounded-xl bg-black/60 backdrop-blur-sm border border-white/10">
          <div className="p-3">
            <h3 className="text-xs font-semibold text-white/50 uppercase mb-2">
              Nearby Developers
            </h3>
            {nearbyUsers.slice(0, 10).map((user) => (
              <button
                key={user.userId}
                onClick={() => router.push(`/profile/${user.username}`)}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/5 transition-colors"
              >
                {user.avatarUrl && (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="h-8 w-8 rounded-full"
                  />
                )}
                <div className="text-left flex-1">
                  <p className="text-sm font-medium text-white">
                    {user.username}
                  </p>
                  <p className="text-xs text-white/40">
                    {user.totalCommits.toLocaleString()} commits &middot;{" "}
                    {user.distance >= 1000
                      ? `${(user.distance / 1000).toFixed(1)}km`
                      : `${Math.round(user.distance)}m`}{" "}
                    away
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stop sharing button */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => {
            setIsSharing(false);
            fetch("/api/location/update", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ isSharing: false }),
            });
          }}
          className="rounded-lg bg-red-500/20 border border-red-500/30 px-4 py-2 text-sm text-red-400 hover:bg-red-500/30 transition-colors"
        >
          Stop Sharing
        </button>
      </div>
    </div>
  );
}
