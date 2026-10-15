"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "./icons";

export interface Command {
  id: string;
  label: string;
  section: string;
  hint?: string;
  disabled?: boolean;
  run: () => void;
}

export default function CommandPalette({
  onClose,
  commands,
}: {
  onClose: () => void;
  commands: Command[];
}) {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    return commands.filter((c) => {
      if (c.disabled) return false;
      const hay = `${c.section} ${c.label}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }, [commands, query]);

  useEffect(() => setIndex(0), [query]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-i="${index}"]`)?.scrollIntoView({ block: "nearest" });
  }, [index]);

  const runAt = (i: number) => {
    const c = filtered[i];
    if (!c) return;
    onClose();
    // let the palette unmount before the command (e.g. a file dialog) runs
    setTimeout(c.run, 0);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndex((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      runAt(index);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  let lastSection = "";
  return (
    <div
      className="fixed inset-0 z-[70] flex animate-fadeIn items-start justify-center px-4 pt-[13vh]"
      style={{ background: "var(--overlay)", backdropFilter: "blur(6px)" }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="w-full max-w-[580px] animate-popIn overflow-hidden rounded-2xl border border-border-strong bg-surface"
        style={{ boxShadow: "var(--shadow)" }}
        onKeyDown={onKeyDown}
      >
        <div className="flex h-[52px] items-center gap-3 border-b border-border px-4">
          <Icon.Search className="h-4 w-4 text-subtle" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={"Search documents or run a command…"}
            className="h-full flex-1 bg-transparent text-[14px] text-fg outline-none placeholder:text-subtle"
            aria-label="Search commands"
          />
          <span className="kbd">Esc</span>
        </div>
        <div ref={listRef} className="max-h-[360px] overflow-y-auto p-1.5">
          {filtered.length === 0 && <div className="px-3 py-8 text-center text-[13px] text-subtle">No matching commands</div>}
          {filtered.map((c, i) => {
            const showSection = c.section !== lastSection;
            lastSection = c.section;
            return (
              <div key={c.id}>
                {showSection && <div className="px-2.5 pb-1 pt-2.5 text-[11px] font-medium text-subtle">{c.section}</div>}
                <button
                  type="button"
                  data-i={i}
                  onMouseMove={() => setIndex(i)}
                  onClick={() => runAt(i)}
                  className={`flex h-9 w-full items-center justify-between rounded-lg px-2.5 text-left text-[13px] transition-colors ${
                    i === index ? "bg-active text-fg" : "text-muted"
                  }`}
                >
                  <span className="truncate">{c.label}</span>
                  {c.hint && <span className="kbd ml-3 flex-none">{c.hint}</span>}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
