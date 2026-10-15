"use client";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { HistoryItem } from "@/lib/history";
import { styleMeta } from "@/lib/styles";
import { groupByDay } from "@/lib/utils";
import { useApp } from "./app-context";
import { useWorkspace } from "./workspace-context";
import { InlineEdit, Kbd } from "./ui";
import { Icon } from "./icons";

const RECENT_LIMIT = 24;

function NavLink({
  href,
  active,
  icon,
  label,
  badge,
  onNavigate,
}: {
  href: string;
  active: boolean;
  icon: ReactNode;
  label: string;
  badge?: number;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`group relative flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium transition-colors ${
        active ? "bg-active text-fg" : "text-muted hover:bg-hover hover:text-fg"
      }`}
    >
      <span className={`transition-colors ${active ? "text-lavender" : "text-subtle group-hover:text-muted"}`}>{icon}</span>
      <span className="flex-1">{label}</span>
      {badge ? <span className="text-[11px] font-normal text-subtle">{badge}</span> : null}
    </Link>
  );
}

function RecentItem({ item, active, onNavigate }: { item: HistoryItem; active: boolean; onNavigate?: () => void }) {
  const { renameDoc, deleteDoc } = useApp();
  const [editing, setEditing] = useState(false);
  const tone = styleMeta(item.style).tone;

  return (
    <div
      className={`tone-${tone} group relative flex h-8 items-center rounded-lg transition-colors ${
        active ? "bg-active text-fg shadow-[inset_2px_0_0_var(--t)]" : "text-muted hover:bg-hover hover:text-fg"
      }`}
    >
      {editing ? (
        <div className="flex min-w-0 flex-1 items-center gap-2 px-2">
          <span className="h-1.5 w-1.5 flex-none rounded-full" style={{ background: "var(--t)" }} />
          <InlineEdit
            value={item.title}
            className="h-6 flex-1 text-[13px]"
            onCommit={(v) => {
              renameDoc(item.id, v);
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        </div>
      ) : (
        <>
          <Link
            href={`/doc/${item.id}`}
            onClick={onNavigate}
            onDoubleClick={(e) => {
              e.preventDefault();
              setEditing(true);
            }}
            title={`${item.title} — double-click to rename`}
            className="flex h-full min-w-0 flex-1 items-center gap-2 rounded-lg px-2"
          >
            <span className="h-1.5 w-1.5 flex-none rounded-full" style={{ background: "var(--t)", opacity: active ? 1 : 0.7 }} />
            <span className="truncate text-[13px]">{item.title}</span>
          </Link>
          <div
            className="absolute inset-y-0 right-0 hidden items-center gap-0.5 rounded-r-lg pl-6 pr-1 group-hover:flex group-focus-within:flex"
            style={{ background: `linear-gradient(90deg, transparent, ${active ? "var(--active)" : "var(--hover)"} 40%)` }}
          >
            <button
              type="button"
              className="icon-btn !h-6 !w-6"
              aria-label={`Rename ${item.title}`}
              title="Rename"
              onClick={() => setEditing(true)}
            >
              <Icon.Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="icon-btn !h-6 !w-6 hover:!text-danger"
              aria-label={`Delete ${item.title}`}
              title="Delete"
              onClick={() => deleteDoc(item.id)}
            >
              <Icon.Trash className="h-3.5 w-3.5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname() ?? "";
  const { items, theme, toggleTheme, modKey, setPaletteOpen, toggleSidebar, clearAll, setMobileNavOpen } = useApp();
  const ws = useWorkspace();

  const recents = useMemo(() => items.slice(0, RECENT_LIMIT), [items]);
  const groups = useMemo(() => groupByDay(recents), [recents]);
  const activeDocId = pathname.startsWith("/doc/") ? pathname.slice(5) : null;

  const nav = () => {
    onNavigate?.();
    setMobileNavOpen(false);
  };

  return (
    <aside className="flex h-full w-full flex-col bg-sidebar">
      {/* brand */}
      <div className="flex h-12 flex-none items-center justify-between pl-4 pr-2">
        <Link href="/" onClick={nav} className="flex items-center gap-2" title="Home">
          <Icon.Logo className="h-[18px] w-[18px]" />
          <span className="text-[13.5px] font-semibold tracking-[-0.01em]">CodeDocs</span>
        </Link>
        <button type="button" className="icon-btn hidden md:inline-grid" onClick={toggleSidebar} aria-label="Hide sidebar" title={`Hide sidebar (${modKey}\\)`}>
          <Icon.Panel />
        </button>
        <button type="button" className="icon-btn md:hidden" onClick={() => setMobileNavOpen(false)} aria-label="Close sidebar">
          <Icon.Close />
        </button>
      </div>

      {/* primary action + search */}
      <div className="flex flex-none flex-col gap-2 px-3 pb-2">
        <button
          type="button"
          className="btn btn-primary w-full justify-between"
          onClick={() => {
            ws.newDoc();
            nav();
          }}
        >
          <span className="inline-flex items-center gap-2">
            <Icon.Plus className="h-3.5 w-3.5" />
            New document
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            nav();
            setPaletteOpen(true);
          }}
          className="flex h-8 w-full items-center gap-2 rounded-lg border border-border px-2.5 text-[12.5px] text-subtle transition-colors hover:border-border-strong hover:bg-hover hover:text-muted"
        >
          <Icon.Search className="h-3.5 w-3.5" />
          <span className="flex-1 text-left">Search</span>
          <Kbd>{modKey}K</Kbd>
        </button>
      </div>

      {/* nav */}
      <nav className="flex flex-none flex-col gap-0.5 px-2 pb-1" aria-label="Main">
        <NavLink href="/workspace" active={pathname === "/workspace"} icon={<Icon.Code />} label="Workspace" onNavigate={nav} />
        <NavLink
          href="/library"
          active={pathname === "/library" || pathname.startsWith("/doc/")}
          icon={<Icon.Library />}
          label="Library"
          badge={items.length || undefined}
          onNavigate={nav}
        />
      </nav>

      {/* recents */}
      <div className="mt-2 flex flex-none items-center justify-between px-4 pb-1 pt-2">
        <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-subtle">Recent</span>
        <div className="flex items-center gap-0.5">
          {items.length > RECENT_LIMIT && (
            <Link href="/library" onClick={nav} className="rounded-md px-1.5 py-0.5 text-[11px] text-subtle transition-colors hover:bg-hover hover:text-fg">
              View all
            </Link>
          )}
          <button
            type="button"
            onClick={clearAll}
            disabled={items.length === 0}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-subtle transition-colors hover:bg-hover hover:text-danger disabled:pointer-events-none disabled:opacity-40"
            title="Delete all recents"
          >
            <Icon.Trash className="h-3 w-3" />
            Clear all
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2" aria-label="Recent documents">
        {groups.length === 0 ? (
          <div className="px-3 py-8 text-center text-[12.5px] leading-relaxed text-subtle">
            Nothing here yet.
            <br />
            Generated docs are saved in this browser.
          </div>
        ) : (
          groups.map((g) => (
            <div key={g.label} className="mb-2">
              <div className="px-2 pb-1 pt-2 text-[11px] text-subtle">{g.label}</div>
              <div className="stagger flex flex-col gap-px">
                {g.items.map((it, i) => (
                  <div key={it.id} style={{ "--i": Math.min(i, 8) } as CSSProperties}>
                    <RecentItem item={it} active={it.id === activeDocId} onNavigate={nav} />
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* footer */}
      <div className="flex h-11 flex-none items-center justify-between border-t border-border px-3">
        <span className="text-[11px] text-subtle">Powered by Groq</span>
        <button type="button" onClick={toggleTheme} title="Toggle theme" aria-label="Toggle theme" className="icon-btn">
          <span key={theme} className="inline-grid animate-popIn">
            {theme === "dark" ? <Icon.Sun /> : <Icon.Moon />}
          </span>
        </button>
      </div>
    </aside>
  );
}
