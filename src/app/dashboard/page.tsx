"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { formatNumber } from "@/utils/format";
import { TOWER_TIERS } from "@/lib/constants";
import { getNextTierProgress } from "@/lib/tower-calculator";

interface SyncData {
  totalCommits: number;
  towerTier: number;
  yearlyCommits: Record<string, number>;
  longestStreak: number;
  currentStreak: number;
}

interface CommitStats {
  totalCommits: number;
  totalRepos: number;
  longestStreak: number;
  currentStreak: number;
  yearlyCommits: Record<string, number> | null;
  languageStats: Record<string, number> | null;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [syncData, setSyncData] = useState<SyncData | null>(null);
  const [stats, setStats] = useState<CommitStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch existing stats
  useEffect(() => {
    if (!session?.user?.username) return;

    fetch(`/api/users/${session.user.username}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.commitStats) {
          setStats(data.commitStats);
          setSyncData({
            totalCommits: data.totalCommits,
            towerTier: data.towerTier,
            yearlyCommits: data.commitStats.yearlyCommits || {},
            longestStreak: data.commitStats.longestStreak,
            currentStreak: data.commitStats.currentStreak,
          });
        }
      })
      .catch(() => {});
  }, [session?.user?.username]);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch("/api/github/commits", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Sync failed");
      }
      const data = await res.json();
      setSyncData(data);

      // Refresh stats
      const statsRes = await fetch(`/api/users/${session?.user?.username}`);
      const statsData = await statsRes.json();
      if (statsData.commitStats) setStats(statsData.commitStats);

      // Also sync achievements
      await fetch("/api/github/achievements", { method: "POST" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }, [session?.user?.username]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-cyan-400" />
      </div>
    );
  }

  if (!session) return null;

  const totalCommits = syncData?.totalCommits ?? session.user.totalCommits ?? 0;
  const towerTier = syncData?.towerTier ?? session.user.towerTier ?? 0;
  const tierConfig = TOWER_TIERS[towerTier];
  const progress = getNextTierProgress(totalCommits);

  const yearlyCommits = syncData?.yearlyCommits || stats?.yearlyCommits || {};
  const sortedYears = Object.entries(yearlyCommits).sort(
    ([a], [b]) => parseInt(b) - parseInt(a)
  );
  const maxYearCommits = Math.max(...Object.values(yearlyCommits), 1);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {session.user.image && (
            <img
              src={session.user.image}
              alt=""
              className="h-16 w-16 rounded-full border-2 border-white/10"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold">{session.user.name}</h1>
            <p className="text-white/50">@{session.user.username}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-2.5 text-sm font-medium text-white hover:from-cyan-400 hover:to-blue-400 transition-all disabled:opacity-50"
          >
            {syncing ? "Syncing..." : "Sync Commits"}
          </button>
          <button
            onClick={() => router.push(`/profile/${session.user.username}`)}
            className="rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition-colors"
          >
            View Tower
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs text-white/40 uppercase tracking-wider">Total Commits</p>
          <p className="mt-1 text-3xl font-bold text-cyan-400">
            {formatNumber(totalCommits)}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs text-white/40 uppercase tracking-wider">Tower Tier</p>
          <p className="mt-1 text-3xl font-bold text-purple-400">{tierConfig.name}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs text-white/40 uppercase tracking-wider">Longest Streak</p>
          <p className="mt-1 text-3xl font-bold text-amber-400">
            {stats?.longestStreak ?? syncData?.longestStreak ?? 0} days
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs text-white/40 uppercase tracking-wider">Current Streak</p>
          <p className="mt-1 text-3xl font-bold text-green-400">
            {stats?.currentStreak ?? syncData?.currentStreak ?? 0} days
          </p>
        </div>
      </div>

      {/* Tower Progress */}
      {progress.nextTier !== null && (
        <div className="mb-8 rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-white/60">
              Progress to {TOWER_TIERS[progress.nextTier].name}
            </span>
            <span className="text-sm text-white/40">
              {progress.commitsNeeded.toLocaleString()} commits needed
            </span>
          </div>
          <div className="h-3 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
              style={{ width: `${progress.progress * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Yearly Commits Chart */}
      {sortedYears.length > 0 && (
        <div className="mb-8 rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-lg font-semibold">Commits by Year</h2>
          <div className="space-y-3">
            {sortedYears.map(([year, count]) => (
              <div key={year} className="flex items-center gap-4">
                <span className="w-12 text-sm text-white/50 text-right">{year}</span>
                <div className="flex-1 h-8 rounded-lg bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-lg bg-gradient-to-r from-cyan-500/80 to-blue-500/80 flex items-center px-3"
                    style={{
                      width: `${Math.max(5, (count / maxYearCommits) * 100)}%`,
                    }}
                  >
                    <span className="text-xs font-medium text-white whitespace-nowrap">
                      {count.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Language Stats */}
      {stats?.languageStats && Object.keys(stats.languageStats).length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-lg font-semibold">Top Languages</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.languageStats)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 12)
              .map(([lang, count]) => (
                <span
                  key={lang}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm"
                >
                  {lang}{" "}
                  <span className="text-white/40">
                    ({count} {count === 1 ? "repo" : "repos"})
                  </span>
                </span>
              ))}
          </div>
        </div>
      )}

      {/* First time hint */}
      {!syncData && totalCommits === 0 && (
        <div className="mt-8 text-center">
          <p className="text-white/40">
            Click &quot;Sync Commits&quot; to fetch your GitHub commit history
            and build your tower.
          </p>
        </div>
      )}
    </div>
  );
}
