"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import ChatPanel from "@/components/chat/ChatPanel";

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-cyan-400" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col lg:flex-row">
      {/* Main chat */}
      <div className="flex-1 flex flex-col">
        <ChatPanel channel="global" className="flex-1 rounded-none border-0" />
      </div>

      {/* Sidebar - online users / info */}
      <div className="hidden lg:block w-72 border-l border-white/10 bg-gray-950">
        <div className="p-4">
          <h2 className="text-sm font-semibold text-white/60 uppercase mb-4">
            About Community Chat
          </h2>
          <div className="space-y-3 text-xs text-white/40">
            <p>
              Welcome to the Git City community! Chat with developers from
              around the world.
            </p>
            <div className="border-t border-white/10 pt-3">
              <h3 className="text-white/50 font-medium mb-2">Features</h3>
              <ul className="space-y-1.5">
                <li className="flex items-center gap-2">
                  <span>😀</span> Emoji support
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-mono text-[10px]">{"</>"}</span> Code
                  snippets
                </li>
                <li className="flex items-center gap-2">
                  <span>🔗</span> Auto link detection
                </li>
                <li className="flex items-center gap-2">
                  <span>📎</span> File attachments (10MB max)
                </li>
                <li className="flex items-center gap-2">
                  <span>🎙️</span> Voice messages
                </li>
              </ul>
            </div>
            <div className="border-t border-white/10 pt-3">
              <h3 className="text-white/50 font-medium mb-2">Name Plates</h3>
              <p>
                Your name frame evolves as you earn more commits and unlock
                GitHub achievements. The first 10 users get a special edition
                badge!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
