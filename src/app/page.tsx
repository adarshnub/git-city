"use client";

import { useSession } from "next-auth/react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-transparent to-purple-500/10" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-cyan-500/20 blur-[120px]" />
      <div className="absolute bottom-1/4 left-1/3 h-64 w-64 rounded-full bg-purple-500/20 blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
        {/* Hero icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-cyan-500/25">
              <svg
                className="h-12 w-12 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008V7.5Z"
                />
              </svg>
            </div>
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-600 opacity-30 blur-lg" />
          </div>
        </div>

        {/* Title */}
        <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-7xl">
          <span className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
            Your Commits.
          </span>
          <br />
          <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            Your Skyscraper.
          </span>
        </h1>

        {/* Description */}
        <p className="mx-auto mb-10 max-w-2xl text-lg text-white/60 leading-relaxed">
          Connect your GitHub account and watch your commit history transform
          into a stunning 3D skyscraper. The more you commit, the taller and
          more magnificent your tower becomes. See nearby developers&apos; towers
          and build a city together.
        </p>

        {/* Features */}
        <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-3 text-3xl">🏗️</div>
            <h3 className="mb-1 text-sm font-semibold text-white">
              6 Tower Tiers
            </h3>
            <p className="text-xs text-white/50">
              From humble shacks to futuristic skyscrapers
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-3 text-3xl">🏆</div>
            <h3 className="mb-1 text-sm font-semibold text-white">
              Achievement Effects
            </h3>
            <p className="text-xs text-white/50">
              GitHub badges add visual buffs to your tower
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-3 text-3xl">🌆</div>
            <h3 className="mb-1 text-sm font-semibold text-white">
              City View
            </h3>
            <p className="text-xs text-white/50">
              See nearby developers&apos; towers in real-time
            </p>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={() => signIn("github")}
          disabled={status === "loading"}
          className="inline-flex items-center gap-3 rounded-xl bg-white px-8 py-4 text-base font-semibold text-black shadow-2xl shadow-white/10 hover:bg-gray-100 transition-all hover:scale-105 disabled:opacity-50"
        >
          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          Connect with GitHub
        </button>

        <p className="mt-4 text-sm text-white/30">
          Free &middot; No data stored except commit counts &middot; Open source
        </p>
      </div>
    </div>
  );
}
