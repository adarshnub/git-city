"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import LoginButton from "@/components/auth/LoginButton";
import SearchBar from "@/components/ui/SearchBar";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
              GC
            </div>
            <span className="text-lg font-bold text-white">
              Git City
            </span>
          </Link>

          {session && (
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href={`/profile/${session.user?.username}`}
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                My Tower
              </Link>
              <Link
                href="/city"
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                City View
              </Link>
              <Link
                href="/chat"
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                Chat
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <SearchBar />
          <LoginButton />
        </div>
      </div>
    </nav>
  );
}
