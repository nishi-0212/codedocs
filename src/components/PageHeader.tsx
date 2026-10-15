"use client";

import type { ReactNode } from "react";
import { useApp } from "./app-context";
import { Icon } from "./icons";

/** Top bar shared by every app page. Shows sidebar toggles and an optional progress sweep. */
export default function PageHeader({
  left,
  right,
  progress,
}: {
  left: ReactNode;
  right?: ReactNode;
  progress?: boolean;
}) {
  const { sidebarCollapsed, toggleSidebar, setMobileNavOpen } = useApp();
  return (
    <header className="relative z-20 flex h-12 flex-none items-center gap-2 border-b border-border bg-[color-mix(in_srgb,var(--bg)_80%,transparent)] px-3 backdrop-blur-md md:px-4">
      {progress && <div className="progress" />}
      <button type="button" className="icon-btn md:hidden" onClick={() => setMobileNavOpen(true)} aria-label="Open sidebar">
        <Icon.Menu />
      </button>
      {sidebarCollapsed && (
        <button type="button" className="icon-btn hidden md:inline-grid" onClick={toggleSidebar} aria-label="Show sidebar" title="Show sidebar">
          <Icon.Panel />
        </button>
      )}
      <div className="flex min-w-0 flex-1 items-center gap-2">{left}</div>
      <div className="flex flex-none items-center gap-2">{right}</div>
    </header>
  );
}
