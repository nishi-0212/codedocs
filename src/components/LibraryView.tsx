"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { DOC_STYLES, styleMeta, type DocStyle } from "@/lib/styles";
import { languageLabel } from "@/lib/languages";
import { snippet, timeAgo, wordCount } from "@/lib/utils";
import type { HistoryItem } from "@/lib/history";
import { useApp } from "./app-context";
import { useWorkspace } from "./workspace-context";
import PageHeader from "./PageHeader";
import { Chip, InlineEdit, Orb } from "./ui";
import { Icon } from "./icons";

function DocCard({ item, index }: { item: HistoryItem; index: number }) {
  const router = useRouter();
  const { renameDoc, deleteDoc } = useApp();
  const [editing, setEditing] = useState(false);
  const meta = styleMeta(item.style);
  const open = () => router.push(`/doc/${item.id}`);

  return (
    <div
      className={`card card-hover tone-${meta.tone} group flex h-[184px] flex-col p-4`}
      style={{ "--i": Math.min(index, 12) } as CSSProperties}
      role="link"
      tabIndex={0}
      aria-label={`Open ${item.title}`}
      onClick={() => !editing && open()}
      onKeyDown={(e) => {
        if (e.key === "Enter" && e.target === e.currentTarget) open();
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <Chip tone={meta.tone} dot>
            {meta.short}
          </Chip>
          {item.language !== "auto" && <Chip>{languageLabel(item.language)}</Chip>}
        </div>
        <span className="flex-none text-[11.5px] text-subtle group-hover:hidden group-focus-within:hidden">{timeAgo(item.createdAt)}</span>
        <div className="hidden flex-none items-center gap-0.5 group-hover:flex group-focus-within:flex" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="icon-btn !h-6 !w-6" title="Rename" aria-label={`Rename ${item.title}`} onClick={() => setEditing(true)}>
            <Icon.Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="icon-btn !h-6 !w-6 hover:!text-danger"
            title="Delete"
            aria-label={`Delete ${item.title}`}
            onClick={() => deleteDoc(item.id)}
          >
            <Icon.Trash className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-3 min-h-[24px]">
        {editing ? (
          <InlineEdit
            value={item.title}
            className="h-7 w-full text-[15px] font-semibold"
            onCommit={(v) => {
              renameDoc(item.id, v);
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <h3 className="truncate text-[15px] font-semibold tracking-[-0.01em]" title={item.title}>
            {item.title}
          </h3>
        )}
      </div>

      <p className="mt-1.5 line-clamp-3 flex-1 text-[12.5px] leading-relaxed text-muted">{snippet(item.output, 150) || "No preview available."}</p>

      <div className="mt-2 flex items-center gap-1.5 text-[11.5px] text-subtle">
        <span>{wordCount(item.output).toLocaleString()} words</span>
        <span>·</span>
        <span>{item.code.split("\n").length.toLocaleString()} lines of code</span>
      </div>
    </div>
  );
}

export default function LibraryView() {
  const { items, historyReady, clearAll } = useApp();
  const ws = useWorkspace();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | DocStyle>("all");

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    for (const it of items) c[it.style] = (c[it.style] ?? 0) + 1;
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    return items.filter((it) => {
      if (filter !== "all" && it.style !== filter) return false;
      if (words.length === 0) return true;
      const hay = `${it.title} ${it.language} ${styleMeta(it.style).label} ${snippet(it.output, 400)}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }, [items, q, filter]);

  return (
    <>
      <PageHeader
        left={
          <>
            <span className="text-[13px] font-medium">Library</span>
            {historyReady && items.length > 0 && <span className="chip">{items.length}</span>}
          </>
        }
        right={
          <>
            <div className="relative hidden sm:block">
              <Icon.Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-subtle" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search documents"
                aria-label="Search documents"
                className="field w-[210px] pl-8"
              />
            </div>
            <button type="button" className="btn btn-ghost btn-danger" onClick={clearAll} disabled={items.length === 0}>
              <Icon.Trash className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Clear all</span>
            </button>
            <button type="button" className="btn btn-primary" onClick={ws.newDoc}>
              <Icon.Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New document</span>
            </button>
          </>
        }
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1120px] px-4 py-7 md:px-8">
          <div className="rise">
            <h1 className="text-[26px] font-semibold tracking-[-0.03em]">Library</h1>
            <p className="mt-1 text-[13.5px] text-muted">Everything you&apos;ve generated. Saved in this browser only.</p>
          </div>

          {/* mobile search */}
          <div className="relative mt-4 sm:hidden">
            <Icon.Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-subtle" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search documents" aria-label="Search documents" className="field w-full pl-8" />
          </div>

          {/* filters */}
          {items.length > 0 && (
            <div className="rise no-scrollbar mt-5 flex items-center gap-1.5 overflow-x-auto pb-1" style={{ "--i": 1 } as CSSProperties}>
              <button type="button" className="pill tone-lavender" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>
                All <span className="opacity-60">{counts.all}</span>
              </button>
              {DOC_STYLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`pill tone-${s.tone}`}
                  aria-pressed={filter === s.id}
                  onClick={() => setFilter(filter === s.id ? "all" : s.id)}
                >
                  {s.short} <span className="opacity-60">{counts[s.id] ?? 0}</span>
                </button>
              ))}
            </div>
          )}

          {/* content */}
          {!historyReady ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="skeleton h-[184px] rounded-2xl" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="rise mx-auto mt-20 max-w-sm text-center" style={{ "--i": 2 } as CSSProperties}>
              <Orb>
                <Icon.Library className="h-6 w-6" />
              </Orb>
              <h2 className="mt-5 text-[16px] font-semibold tracking-[-0.01em]">No documents yet</h2>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">Generate your first doc in the workspace. It will be saved here automatically.</p>
              <button type="button" className="btn btn-primary mt-5" onClick={ws.newDoc}>
                Open workspace
                <Icon.Arrow className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rise mx-auto mt-20 max-w-sm text-center">
              <h2 className="text-[15px] font-semibold">No matches</h2>
              <p className="mt-1.5 text-[13px] text-muted">Try a different search or clear the filter.</p>
              <button
                type="button"
                className="btn btn-ghost mt-4"
                onClick={() => {
                  setQ("");
                  setFilter("all");
                }}
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="stagger mt-5 grid gap-3 pb-16 sm:grid-cols-2 xl:grid-cols-3" key={`${filter}|${q}`}>
              {filtered.map((it, i) => (
                <DocCard key={it.id} item={it} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
