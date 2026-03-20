"use client";

import { createContext, useContext, useState, useCallback } from "react";
import NamePlate from "./NamePlate";

interface AdminOverrides {
  commits: number | null;
  achievements: number | null;
  edition: number | null;
}

interface AdminContextValue {
  isAdmin: boolean;
  overrides: AdminOverrides;
  setOverrides: (overrides: Partial<AdminOverrides>) => void;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function useAdmin(): AdminContextValue | null {
  return useContext(AdminContext);
}

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const isAdmin = process.env.NEXT_PUBLIC_IS_ADMIN === "true";
  const [overrides, setOverridesState] = useState<AdminOverrides>({
    commits: null,
    achievements: null,
    edition: null,
  });

  const setOverrides = useCallback((partial: Partial<AdminOverrides>) => {
    setOverridesState((prev) => ({ ...prev, ...partial }));
  }, []);

  return (
    <AdminContext.Provider value={{ isAdmin, overrides, setOverrides }}>
      {children}
      {isAdmin && <AdminPanel overrides={overrides} setOverrides={setOverrides} />}
    </AdminContext.Provider>
  );
}

function AdminPanel({
  overrides,
  setOverrides,
}: {
  overrides: AdminOverrides;
  setOverrides: (partial: Partial<AdminOverrides>) => void;
}) {
  const [collapsed, setCollapsed] = useState(true);
  const [enabled, setEnabled] = useState(false);

  const commits = overrides.commits ?? 500;
  const achievements = overrides.achievements ?? 2;
  const edition = overrides.edition ?? 0;

  return (
    <div className="fixed bottom-4 left-4 z-[9999]">
      {/* Toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="rounded-lg bg-red-600/80 backdrop-blur-sm px-3 py-1.5 text-xs font-bold text-white border border-red-500/50 hover:bg-red-500/80 transition-colors shadow-lg"
      >
        ADMIN {collapsed ? "▲" : "▼"}
      </button>

      {!collapsed && (
        <div className="mt-2 w-80 rounded-xl bg-gray-900/95 backdrop-blur-md border border-white/10 shadow-2xl overflow-hidden">
          <div className="p-3 border-b border-white/10 flex items-center justify-between">
            <span className="text-xs font-bold text-red-400 uppercase">
              Admin Debug Panel
            </span>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-[10px] text-white/40">Override</span>
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => {
                  setEnabled(e.target.checked);
                  if (!e.target.checked) {
                    setOverrides({ commits: null, achievements: null, edition: null });
                  } else {
                    setOverrides({ commits, achievements, edition });
                  }
                }}
                className="accent-red-500"
              />
            </label>
          </div>

          <div className="p-3 space-y-3">
            {/* Commits slider */}
            <div>
              <div className="flex justify-between text-[10px] text-white/50 mb-1">
                <span>Commits</span>
                <span className="font-mono text-white/70">
                  {enabled ? commits.toLocaleString() : "—"}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={50000}
                step={10}
                value={commits}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setOverrides({ commits: enabled ? v : null });
                  if (!enabled) setEnabled(true);
                  setOverrides({ commits: v });
                }}
                disabled={!enabled}
                className="w-full h-1.5 rounded-full appearance-none bg-white/10 accent-cyan-500 disabled:opacity-30"
              />
              <div className="flex justify-between text-[8px] text-white/20 mt-0.5">
                <span>0</span>
                <span>50</span>
                <span>250</span>
                <span>1K</span>
                <span>5K</span>
                <span>10K</span>
                <span>50K</span>
              </div>
            </div>

            {/* Achievements slider */}
            <div>
              <div className="flex justify-between text-[10px] text-white/50 mb-1">
                <span>Achievements</span>
                <span className="font-mono text-white/70">
                  {enabled ? achievements : "—"}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={7}
                step={1}
                value={achievements}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (!enabled) setEnabled(true);
                  setOverrides({ achievements: v });
                }}
                disabled={!enabled}
                className="w-full h-1.5 rounded-full appearance-none bg-white/10 accent-purple-500 disabled:opacity-30"
              />
            </div>

            {/* Edition slider */}
            <div>
              <div className="flex justify-between text-[10px] text-white/50 mb-1">
                <span>Edition #</span>
                <span className="font-mono text-white/70">
                  {enabled ? (edition === 0 ? "None" : `#${edition}`) : "—"}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                step={1}
                value={edition}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (!enabled) setEnabled(true);
                  setOverrides({ edition: v });
                }}
                disabled={!enabled}
                className="w-full h-1.5 rounded-full appearance-none bg-white/10 accent-amber-500 disabled:opacity-30"
              />
            </div>

            {/* Preview */}
            {enabled && (
              <div className="pt-2 border-t border-white/10">
                <p className="text-[10px] text-white/30 mb-2">Preview:</p>
                <div className="flex flex-col gap-2">
                  <NamePlate
                    username="preview_user"
                    totalCommits={commits}
                    achievementCount={achievements}
                    editionNumber={edition}
                    size="md"
                  />
                </div>
              </div>
            )}

            {/* Quick presets */}
            {enabled && (
              <div className="pt-2 border-t border-white/10">
                <p className="text-[10px] text-white/30 mb-1.5">Quick Presets:</p>
                <div className="flex flex-wrap gap-1">
                  {[
                    { label: "Min", c: 0, a: 0, e: 0 },
                    { label: "Tier 1", c: 50, a: 1, e: 0 },
                    { label: "Tier 2", c: 250, a: 2, e: 0 },
                    { label: "Tier 3", c: 1000, a: 3, e: 5 },
                    { label: "Tier 4", c: 5000, a: 5, e: 0 },
                    { label: "Max", c: 50000, a: 7, e: 1 },
                  ].map((p) => (
                    <button
                      key={p.label}
                      onClick={() =>
                        setOverrides({
                          commits: p.c,
                          achievements: p.a,
                          edition: p.e,
                        })
                      }
                      className="rounded bg-white/5 border border-white/10 px-2 py-0.5 text-[9px] text-white/50 hover:bg-white/10 hover:text-white/80 transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
