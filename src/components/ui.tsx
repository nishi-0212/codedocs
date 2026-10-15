"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Icon } from "./icons";
import type { Tone } from "@/lib/styles";

/** Pastel chip. `tone` picks the colour; `dot` adds a glowing dot. */
export function Chip({ tone, dot, children, className = "" }: { tone?: Tone; dot?: boolean; children: ReactNode; className?: string }) {
  return <span className={`chip ${tone ? `tone-${tone}` : ""} ${dot ? "chip-dot" : ""} ${className}`}>{children}</span>;
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="kbd">{children}</kbd>;
}

/** Segmented control with a sliding highlight pill. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  role,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode }[];
  label: string;
  role?: "tablist";
}) {
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  return (
    <div className="seg" role={role} aria-label={label} style={{ "--n": options.length, "--i": index } as CSSProperties}>
      <span className="seg-pill" aria-hidden />
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role={role ? "tab" : undefined}
          aria-selected={role ? value === o.value : undefined}
          aria-pressed={role ? undefined : value === o.value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Native select with the app's styling. */
export function Select({
  value,
  onChange,
  options,
  label,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  label: string;
  className?: string;
}) {
  return (
    <label className={`relative inline-flex items-center ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        title={label}
        className="field cursor-pointer appearance-none pr-7 text-muted hover:text-fg"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <Icon.Chevron className="pointer-events-none absolute right-2 h-3 w-3 text-subtle" />
    </label>
  );
}

/** Text that turns into an input. Enter/blur saves, Escape cancels. */
export function InlineEdit({
  value,
  onCommit,
  onCancel,
  className = "",
  label = "Rename",
}: {
  value: string;
  onCommit: (v: string) => void;
  onCancel: () => void;
  className?: string;
  label?: string;
}) {
  const [v, setV] = useState(value);
  const ref = useRef<HTMLInputElement>(null);
  const done = useRef(false);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  const finish = (commit: boolean) => {
    if (done.current) return;
    done.current = true;
    const t = v.trim();
    if (commit && t && t !== value) onCommit(t);
    else onCancel();
  };

  return (
    <input
      ref={ref}
      value={v}
      maxLength={80}
      aria-label={label}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => finish(true)}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Enter") finish(true);
        else if (e.key === "Escape") finish(false);
      }}
      className={`min-w-0 rounded-md border border-[var(--accent-line)] bg-surface px-1.5 text-fg outline-none ring-2 ring-[var(--accent-soft)] ${className}`}
    />
  );
}

/** Soft orb used in empty states. */
export function Orb({ tone = "lavender", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <div
      className={`tone-${tone} relative mx-auto grid h-14 w-14 place-items-center rounded-2xl`}
      style={{
        color: "var(--t)",
        background: "linear-gradient(145deg, var(--t-bg), transparent)",
        border: "1px solid var(--t-bd)",
        boxShadow: "0 14px 40px -16px var(--t)",
      }}
    >
      {children}
    </div>
  );
}
