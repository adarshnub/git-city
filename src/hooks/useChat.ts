"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface ChatMessage {
  id: string;
  content: string | null;
  type: "text" | "code" | "audio" | "file" | "link";
  metadata: Record<string, unknown>;
  fileUrl: string | null;
  fileName: string | null;
  createdAt: string;
  channel: string;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    totalCommits: number;
    towerTier: number;
    userRole: string;
    editionNumber: number | null;
  } | null;
}

interface UseChatOptions {
  channel?: string;
  pollInterval?: number;
}

export function useChat({ channel = "global", pollInterval = 3000 }: UseChatOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const lastTimestampRef = useRef<string | null>(null);
  const initialLoadDone = useRef(false);

  // Fetch messages
  const fetchMessages = useCallback(async (isInitial = false) => {
    try {
      const params = new URLSearchParams({ channel });
      if (!isInitial && lastTimestampRef.current) {
        params.set("after", lastTimestampRef.current);
      }
      if (isInitial) {
        params.set("limit", "50");
      }

      const res = await fetch(`/api/chat/messages?${params}`);
      if (!res.ok) return;

      const data = await res.json();
      const newMessages: ChatMessage[] = data.messages || [];

      if (newMessages.length > 0) {
        lastTimestampRef.current = newMessages[newMessages.length - 1].createdAt;

        if (isInitial) {
          setMessages(newMessages);
        } else {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const unique = newMessages.filter((m) => !existingIds.has(m.id));
            return unique.length > 0 ? [...prev, ...unique] : prev;
          });
        }
      }
    } catch (err) {
      console.error("[CHAT] Fetch error:", err);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [channel]);

  // Initial load
  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      fetchMessages(true);
    }
  }, [fetchMessages]);

  // Poll for new messages
  useEffect(() => {
    const interval = setInterval(() => fetchMessages(false), pollInterval);
    return () => clearInterval(interval);
  }, [fetchMessages, pollInterval]);

  // Send text message
  const sendMessage = useCallback(
    async (content: string, type: "text" | "code" | "link" = "text", metadata: Record<string, unknown> = {}) => {
      setSending(true);
      try {
        const res = await fetch("/api/chat/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, type, channel, metadata }),
        });
        if (res.ok) {
          // Fetch immediately to get the new message
          await fetchMessages(false);
        }
        return res.ok;
      } catch {
        return false;
      } finally {
        setSending(false);
      }
    },
    [channel, fetchMessages]
  );

  // Send file message
  const sendFile = useCallback(
    async (file: File) => {
      setSending(true);
      try {
        // Upload file
        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await fetch("/api/chat/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) return false;

        const uploadData = await uploadRes.json();

        // Determine type
        const isAudio = file.type.startsWith("audio/");
        const isImage = file.type.startsWith("image/");
        const msgType = isAudio ? "audio" : "file";

        // Send message with file
        const res = await fetch("/api/chat/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: isImage ? null : file.name,
            type: msgType,
            channel,
            metadata: {
              fileType: file.type,
              fileSize: file.size,
              isImage,
            },
            fileUrl: uploadData.url,
            fileName: uploadData.fileName,
          }),
        });

        if (res.ok) {
          await fetchMessages(false);
        }
        return res.ok;
      } catch {
        return false;
      } finally {
        setSending(false);
      }
    },
    [channel, fetchMessages]
  );

  // Send audio recording
  const sendAudio = useCallback(
    async (blob: Blob) => {
      const file = new File([blob], `audio-${Date.now()}.webm`, {
        type: blob.type || "audio/webm",
      });
      return sendFile(file);
    },
    [sendFile]
  );

  // Delete a message
  const deleteMessage = useCallback(
    async (messageId: string) => {
      try {
        const res = await fetch(`/api/chat/messages?id=${messageId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setMessages((prev) => prev.filter((m) => m.id !== messageId));
        }
        return res.ok;
      } catch {
        return false;
      }
    },
    []
  );

  return { messages, loading, sending, sendMessage, sendFile, sendAudio, deleteMessage };
}
