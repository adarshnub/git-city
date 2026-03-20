"use client";

import { useState } from "react";
import { ChatMessage } from "@/hooks/useChat";
import NamePlate from "@/components/ui/NamePlate";

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  isAdmin: boolean;
  onDelete?: (id: string) => Promise<boolean>;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

// Auto-link URLs in text
function renderTextWithLinks(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, i) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-400 hover:text-cyan-300 underline break-all"
        >
          {part}
        </a>
      );
    }
    urlRegex.lastIndex = 0;
    return <span key={i}>{part}</span>;
  });
}

export default function MessageBubble({ message, isOwn, isAdmin, onDelete }: MessageBubbleProps) {
  const user = message.user;
  const canDelete = isOwn || isAdmin;
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    await onDelete(message.id);
    setDeleting(false);
    setShowConfirm(false);
  };

  return (
    <div className="group flex gap-2 px-3 py-1.5 hover:bg-white/[0.02] transition-colors relative">
      {/* Avatar column */}
      <div className="flex-shrink-0 w-8 pt-1">
        {user?.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt=""
            className="h-8 w-8 rounded-full border border-white/10"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/40">
            ?
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Name plate + time + delete */}
        <div className="flex items-center gap-2 mb-0.5">
          {user && (
            <NamePlate
              username={user.username}
              totalCommits={user.totalCommits}
              achievementCount={0}
              userRole={user.userRole}
              editionNumber={user.editionNumber}
              size="sm"
            />
          )}
          <span className="text-[10px] text-white/20 flex-shrink-0">
            {formatTime(message.createdAt)}
          </span>

          {/* Delete button - visible on hover */}
          {canDelete && !showConfirm && (
            <button
              onClick={() => setShowConfirm(true)}
              className="opacity-0 group-hover:opacity-100 text-[10px] text-red-400/50 hover:text-red-400 transition-all ml-auto"
              title={isAdmin && !isOwn ? "Delete (admin)" : "Delete"}
            >
              🗑️
            </button>
          )}

          {/* Delete confirmation */}
          {showConfirm && (
            <div className="flex items-center gap-1 ml-auto">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-[10px] rounded bg-red-500/20 border border-red-500/30 px-1.5 py-0.5 text-red-400 hover:bg-red-500/30 disabled:opacity-50"
              >
                {deleting ? "..." : "Delete"}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="text-[10px] rounded bg-white/5 border border-white/10 px-1.5 py-0.5 text-white/40 hover:text-white/60"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Message content based on type */}
        <div className="pl-0.5">
          {message.type === "text" && message.content && (
            <p className="text-sm text-white/80 whitespace-pre-wrap break-words">
              {renderTextWithLinks(message.content)}
            </p>
          )}

          {message.type === "link" && message.content && (
            <p className="text-sm text-white/80 whitespace-pre-wrap break-words">
              {renderTextWithLinks(message.content)}
            </p>
          )}

          {message.type === "code" && message.content && (
            <div className="mt-1 rounded-lg overflow-hidden border border-white/10">
              <div className="flex items-center justify-between bg-white/5 px-3 py-1">
                <span className="text-[10px] text-white/40 font-mono">
                  {(message.metadata?.language as string) || "code"}
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(message.content || "")}
                  className="text-[10px] text-white/30 hover:text-white/60 transition-colors"
                >
                  Copy
                </button>
              </div>
              <pre className="p-3 bg-black/40 overflow-x-auto text-xs">
                <code className="text-green-300 font-mono whitespace-pre">
                  {message.content}
                </code>
              </pre>
            </div>
          )}

          {message.type === "audio" && message.fileUrl && (
            <div className="mt-1 flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2 max-w-xs">
              <span className="text-lg">🎙️</span>
              <audio
                src={message.fileUrl}
                controls
                className="h-8 flex-1"
                style={{ maxWidth: "200px" }}
              />
            </div>
          )}

          {message.type === "file" && message.fileUrl && (
            <div className="mt-1">
              {(message.metadata?.isImage as boolean) ? (
                <div className="rounded-lg overflow-hidden border border-white/10 max-w-sm">
                  <img
                    src={message.fileUrl}
                    alt={message.fileName || "image"}
                    className="max-h-64 w-auto object-contain"
                    loading="lazy"
                  />
                  {message.fileName && (
                    <div className="bg-white/5 px-2 py-1 text-[10px] text-white/40">
                      {message.fileName}
                      {typeof message.metadata?.fileSize === "number" && (
                        <span className="ml-2">
                          {formatFileSize(message.metadata.fileSize)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <a
                  href={message.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-cyan-400 hover:bg-white/10 transition-colors"
                >
                  <span>📄</span>
                  <span className="truncate max-w-48">
                    {message.fileName || "Download file"}
                  </span>
                  {typeof message.metadata?.fileSize === "number" && (
                    <span className="text-[10px] text-white/30">
                      {formatFileSize(message.metadata.fileSize)}
                    </span>
                  )}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
