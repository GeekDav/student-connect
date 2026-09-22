"use client";

import { useEffect, useId, useRef, useState } from "react";

const EMOJIS = [
  "😀",
  "😃",
  "😄",
  "😁",
  "😅",
  "😂",
  "🙂",
  "😉",
  "😊",
  "😍",
  "😘",
  "😎",
  "🤔",
  "😐",
  "😴",
  "😭",
  "😤",
  "🤯",
  "🥳",
  "😇",
  "👍",
  "👎",
  "👏",
  "🙌",
  "🤝",
  "✌️",
  "🤞",
  "💪",
  "🔥",
  "✨",
  "⭐",
  "💯",
  "❤️",
  "🧡",
  "💛",
  "💚",
  "💙",
  "💜",
  "🖤",
  "🤍",
  "💔",
  "🎉",
  "🎊",
  "🏠",
  "📚",
  "✏️",
  "💻",
  "🎮",
  "🍕",
  "☕",
  "🍺",
  "🏃",
  "⚽",
  "🎵",
  "📷",
  "💬",
  "📩",
  "🙏",
  "👀",
  "✅",
] as const;

export function insertEmojiAtCursor(
  value: string,
  emoji: string,
  start: number | null,
  end: number | null,
) {
  const from = start ?? value.length;
  const to = end ?? value.length;
  return {
    next: `${value.slice(0, from)}${emoji}${value.slice(to)}`,
    caret: from + emoji.length,
  };
}

export function EmojiPickerButton({
  onPick,
  disabled = false,
  align = "left",
}: {
  onPick: (emoji: string) => void;
  disabled?: boolean;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Insérer un émoji"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex size-10 items-center justify-center rounded-lg border border-line bg-surface text-base transition-colors hover:bg-wash disabled:opacity-50"
      >
        🙂
      </button>
      {open ? (
        <div
          id={panelId}
          role="listbox"
          aria-label="Émojis"
          className={`absolute z-40 mt-2 w-[17.5rem] rounded-xl border border-line bg-surface p-2 shadow-[0_12px_32px_rgba(19,32,41,0.14)] ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <div className="grid max-h-48 grid-cols-8 gap-0.5 overflow-y-auto">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                role="option"
                className="inline-flex size-8 items-center justify-center rounded-md text-lg transition-colors hover:bg-wash"
                onClick={() => {
                  onPick(emoji);
                  setOpen(false);
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
