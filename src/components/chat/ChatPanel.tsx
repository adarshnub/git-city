"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useChat } from "@/hooks/useChat";
import ChatInput from "./ChatInput";
import MessageBubble from "./MessageBubble";

interface ChatPanelProps {
  channel?: string;
  className?: string;
  collapsed?: boolean;
  onToggle?: () => void;
}

export default function ChatPanel({
  channel = "global",
  className = "",
  collapsed = false,
  onToggle,
}: ChatPanelProps) {
  const { data: session } = useSession();
  const { messages, loading, sending, sendMessage, sendFile, sendAudio, deleteMessage } = useChat({ channel });
  const isAdmin = process.env.NEXT_PUBLIC_IS_ADMIN === "true";
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  // Derive unique active users from recent messages (last 5 min)
  const activeUsers = useMemo(() => {
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    const recentUserIds = new Set<string>();
    messages.forEach((m) => {
      if (m.user?.id && new Date(m.createdAt).getTime() > fiveMinAgo) {
        recentUserIds.add(m.user.id);
      }
    });
    // Always count self if logged in
    if (session?.user?.id) recentUserIds.add(session.user.id);
    return recentUserIds.size;
  }, [messages, session?.user?.id]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, autoScroll]);

  // Detect manual scroll
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 50;
    setAutoScroll(atBottom);
  };

  if (collapsed) {
    return (
      <button
        onClick={onToggle}
        className="rounded-xl bg-gray-900/90 backdrop-blur-sm border border-white/10 px-4 py-2 flex items-center gap-2 hover:bg-gray-800/90 transition-colors shadow-lg"
      >
        <span className="text-sm">💬</span>
        <span className="text-xs text-white/70">Community Chat</span>
        <span className="text-[10px] text-cyan-400 bg-cyan-500/10 rounded-full px-1.5">
          {messages.length}
        </span>
      </button>
    );
  }

  return (
    <div
      className={`flex flex-col bg-gray-950/95 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-2xl ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-gray-900/50">
        <div className="flex items-center gap-2">
          <span className="text-sm">🌐</span>
          <span className="text-sm font-semibold text-white/90">
            {channel === "global" ? "Community Chat" : `#${channel}`}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-white/30">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
            {activeUsers} active
          </span>
        </div>
        {onToggle && (
          <button
            onClick={onToggle}
            className="text-white/30 hover:text-white/60 transition-colors text-sm"
          >
            ✕
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto min-h-0"
      >
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-cyan-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center px-4">
            <span className="text-2xl mb-2">🏙️</span>
            <p className="text-sm text-white/40">No messages yet.</p>
            <p className="text-xs text-white/20">Be the first to say hello!</p>
          </div>
        ) : (
          <div className="py-2">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.user?.id === session?.user?.id}
                isAdmin={isAdmin}
                onDelete={deleteMessage}
              />
            ))}
          </div>
        )}

        {/* New messages indicator */}
        {!autoScroll && (
          <button
            onClick={() => {
              setAutoScroll(true);
              if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
              }
            }}
            className="sticky bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-cyan-500/80 px-3 py-1 text-[10px] text-white shadow-lg hover:bg-cyan-500 transition-colors"
          >
            ↓ New messages
          </button>
        )}
      </div>

      {/* Input */}
      {session ? (
        <ChatInput
          onSendText={sendMessage}
          onSendFile={sendFile}
          onSendAudio={sendAudio}
          disabled={sending}
        />
      ) : (
        <div className="border-t border-white/10 px-4 py-3 text-center">
          <p className="text-xs text-white/40">
            <a href="/login" className="text-cyan-400 hover:text-cyan-300">
              Sign in
            </a>{" "}
            to join the conversation
          </p>
        </div>
      )}
    </div>
  );
}
