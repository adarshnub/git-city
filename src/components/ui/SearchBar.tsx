"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface SearchResult {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  totalCommits: number;
  towerTier: number;
}

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
        setIsOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  const handleSelect = (username: string) => {
    setQuery("");
    setIsOpen(false);
    router.push(`/profile/${username}`);
  };

  return (
    <div ref={ref} className="relative hidden sm:block">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search users..."
        className="w-48 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 outline-none focus:border-cyan-500/50 focus:w-64 transition-all"
      />
      {loading && (
        <div className="absolute right-3 top-2.5">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-cyan-400" />
        </div>
      )}

      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-2 w-72 rounded-xl border border-white/10 bg-gray-900/95 backdrop-blur-xl shadow-2xl overflow-hidden">
          {results.map((user) => (
            <button
              key={user.username}
              onClick={() => handleSelect(user.username)}
              className="flex w-full items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
            >
              {user.avatarUrl && (
                <img
                  src={user.avatarUrl}
                  alt={user.username}
                  className="h-8 w-8 rounded-full"
                />
              )}
              <div className="text-left">
                <div className="text-sm font-medium text-white">
                  {user.displayName || user.username}
                </div>
                <div className="text-xs text-white/50">
                  @{user.username} &middot; {user.totalCommits.toLocaleString()} commits
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
