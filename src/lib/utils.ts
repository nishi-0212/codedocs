import { FILE_MARKER_SOURCE } from "./protocol";

/** Some models wrap the whole answer in a ```markdown fence. Unwrap it (works while streaming). */
export function cleanOutput(md: string): string {
  const m = /^\s*```(?:markdown|md)[ \t]*\n/.exec(md);
  if (!m) return md;
  let rest = md.slice(m[0].length);
  const fences = (rest.match(/^```/gm) ?? []).length;
  if (fences % 2 === 1) rest = rest.replace(/\n```[ \t]*$/, "");
  return rest;
}

export function uid(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  } catch {
    /* insecure context */
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

export function deriveTitle(full: string): string {
  const code = full.slice(0, 4000);
  const file = new RegExp(FILE_MARKER_SOURCE, "m").exec(code);
  if (file) return file[1];
  const line = code
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l && !/^(#!|\/\/|\/\*|\*|#|--|<\?php|import |from |using |package )/.test(l));
  const fallback = code.split("\n").find((l) => l.trim())?.trim() ?? "Untitled";
  const t = (line ?? fallback).replace(/\s+/g, " ");
  return t.length > 44 ? t.slice(0, 44) + "…" : t;
}

export function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "documentation"
  );
}

export function groupByDay<T extends { createdAt: number }>(items: T[]): { label: string; items: T[] }[] {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const today = startOfDay(new Date());
  const day = 86_400_000;
  const groups: Record<string, T[]> = { Today: [], Yesterday: [], "Previous 7 days": [], Older: [] };
  for (const it of items) {
    const diff = today - startOfDay(new Date(it.createdAt));
    if (diff <= 0) groups.Today.push(it);
    else if (diff <= day) groups.Yesterday.push(it);
    else if (diff <= 7 * day) groups["Previous 7 days"].push(it);
    else groups.Older.push(it);
  }
  return Object.entries(groups)
    .filter(([, v]) => v.length > 0)
    .map(([label, v]) => ({ label, items: v }));
}

/** Title from the generated document's first H1 (ignoring anything inside code fences). */
export function extractTitle(md: string): string | null {
  const noCode = md.replace(/```[\s\S]*?(```|$)/g, "");
  const m = /^#\s+(.+?)\s*$/m.exec(noCode);
  if (!m) return null;
  const t = m[1].replace(/[`*_]/g, "").trim();
  if (!t) return null;
  return t.length > 70 ? t.slice(0, 70) + "\u2026" : t;
}

export function wordCount(md: string): number {
  const t = md.replace(/```[\s\S]*?```/g, " ").trim();
  return t ? t.split(/\s+/).length : 0;
}

/** Plain-text teaser for cards: first prose paragraph, markdown stripped. */
export function snippet(md: string, max = 150): string {
  const prose = md
    .replace(/```[\s\S]*?(```|$)/g, " ")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && !l.startsWith("|") && !/^[-*]{3,}$/.test(l))
    .join(" ")
    .replace(/[`*_>]|\[([^\]]+)\]\([^)]*\)/g, (_m, g1) => g1 ?? "")
    .replace(/\s+/g, " ")
    .trim();
  return prose.length > max ? prose.slice(0, max).trimEnd() + "\u2026" : prose;
}

export function timeAgo(ts: number, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d === 1) return "yesterday";
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric", year: d > 300 ? "numeric" : undefined });
}
