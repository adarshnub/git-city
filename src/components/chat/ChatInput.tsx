"use client";

import { useState, useRef, useCallback } from "react";

// Common emojis grid
const EMOJI_LIST = [
  "😀", "😂", "😍", "🤩", "😎", "🤔", "😅", "🥳",
  "👍", "👎", "👏", "🙌", "🔥", "⭐", "💯", "❤️",
  "🚀", "💻", "🐛", "🎉", "✅", "❌", "⚡", "🔧",
  "📦", "🌟", "🎯", "💡", "🔒", "🧪", "📊", "🏆",
  "🤖", "👾", "🎮", "🌍", "⏰", "📝", "🗂️", "🔗",
  "😈", "💀", "🤡", "🙈", "🐍", "🦀", "🐹", "🦊",
];

interface ChatInputProps {
  onSendText: (content: string, type: "text" | "code" | "link", metadata?: Record<string, unknown>) => Promise<boolean>;
  onSendFile: (file: File) => Promise<boolean>;
  onSendAudio: (blob: Blob) => Promise<boolean>;
  disabled?: boolean;
}

export default function ChatInput({
  onSendText,
  onSendFile,
  onSendAudio,
  disabled,
}: ChatInputProps) {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"text" | "code" | "emoji">("text");
  const [codeLang, setCodeLang] = useState("javascript");
  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (mode === "code") {
      const ok = await onSendText(trimmed, "code", { language: codeLang });
      if (ok) { setText(""); setMode("text"); }
    } else {
      // Auto-detect links
      const urlRegex = /https?:\/\/[^\s]+/;
      const type = urlRegex.test(trimmed) ? "link" : "text";
      const ok = await onSendText(trimmed, type);
      if (ok) setText("");
    }
  }, [text, mode, codeLang, onSendText]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && mode !== "code") {
      e.preventDefault();
      handleSend();
    }
    if (e.key === "Enter" && e.ctrlKey && mode === "code") {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onSendFile(file);
      e.target.value = "";
    }
  };

  const toggleRecording = async () => {
    if (recording) {
      // Stop
      mediaRecorderRef.current?.stop();
      setRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordTime(0);
    } else {
      // Start
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop());
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          if (blob.size > 0) {
            await onSendAudio(blob);
          }
        };

        mediaRecorder.start();
        mediaRecorderRef.current = mediaRecorder;
        setRecording(true);
        setRecordTime(0);

        timerRef.current = setInterval(() => {
          setRecordTime((t) => t + 1);
        }, 1000);
      } catch (err) {
        console.error("Microphone access denied:", err);
      }
    }
  };

  const insertEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
    setMode("text");
  };

  return (
    <div className="border-t border-white/10 bg-gray-900/80">
      {/* Mode bar */}
      <div className="flex items-center gap-1 px-3 pt-2">
        {/* Emoji toggle */}
        <button
          onClick={() => setMode(mode === "emoji" ? "text" : "emoji")}
          className={`rounded-md px-2 py-1 text-sm transition-colors ${
            mode === "emoji" ? "bg-amber-500/20 text-amber-400" : "text-white/40 hover:text-white/60"
          }`}
          title="Emojis"
        >
          😀
        </button>

        {/* Code toggle */}
        <button
          onClick={() => setMode(mode === "code" ? "text" : "code")}
          className={`rounded-md px-2 py-1 text-[11px] font-mono transition-colors ${
            mode === "code" ? "bg-green-500/20 text-green-400" : "text-white/40 hover:text-white/60"
          }`}
          title="Code snippet"
        >
          {"</>"}
        </button>

        {/* File upload */}
        <button
          onClick={() => fileRef.current?.click()}
          className="rounded-md px-2 py-1 text-sm text-white/40 hover:text-white/60 transition-colors"
          title="Upload file"
        >
          📎
        </button>
        <input
          ref={fileRef}
          type="file"
          onChange={handleFileUpload}
          className="hidden"
          accept="image/*,audio/*,.pdf,.txt,.md,.js,.ts,.py,.go,.rs,.json,.csv,.zip"
        />

        {/* Audio record */}
        <button
          onClick={toggleRecording}
          className={`rounded-md px-2 py-1 text-sm transition-colors ${
            recording ? "bg-red-500/20 text-red-400 animate-pulse" : "text-white/40 hover:text-white/60"
          }`}
          title={recording ? "Stop recording" : "Record audio"}
        >
          🎙️
        </button>

        {recording && (
          <span className="text-xs text-red-400 ml-1 font-mono">
            {Math.floor(recordTime / 60)}:{String(recordTime % 60).padStart(2, "0")}
          </span>
        )}

        {mode === "code" && (
          <select
            value={codeLang}
            onChange={(e) => setCodeLang(e.target.value)}
            className="ml-auto rounded bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-white/60"
          >
            {["javascript", "typescript", "python", "go", "rust", "java", "c", "cpp", "html", "css", "sql", "bash", "json", "yaml", "markdown", "other"].map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        )}
      </div>

      {/* Emoji picker */}
      {mode === "emoji" && (
        <div className="px-3 py-2 grid grid-cols-8 gap-1 max-h-32 overflow-y-auto">
          {EMOJI_LIST.map((e) => (
            <button
              key={e}
              onClick={() => insertEmoji(e)}
              className="rounded p-1 text-lg hover:bg-white/10 transition-colors"
            >
              {e}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2 p-3">
        {mode === "code" ? (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste your code here... (Ctrl+Enter to send)"
            className="flex-1 rounded-lg bg-black/40 border border-green-500/20 px-3 py-2 text-sm text-green-300 font-mono placeholder-white/20 resize-none focus:outline-none focus:border-green-500/40"
            rows={4}
            disabled={disabled}
          />
        ) : (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Enter to send)"
            className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-white/20 resize-none focus:outline-none focus:border-white/20"
            rows={1}
            disabled={disabled}
            style={{ minHeight: "38px", maxHeight: "120px" }}
          />
        )}

        <button
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          className="rounded-lg bg-cyan-500/80 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 disabled:opacity-30 disabled:hover:bg-cyan-500/80 transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
