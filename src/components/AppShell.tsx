"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useApp } from "./app-context";
import Sidebar from "./Sidebar";

export function Ambient({ soft }: { soft?: boolean }) {
  return (
    <div className={`ambient ${soft ? "ambient-soft" : ""}`} aria-hidden>
      <i className="blob blob-a" />
      <i className="blob blob-b" />
      <i className="blob blob-c" />
    </div>
  );
}

/** Sidebar + animated page area for /workspace, /library and /doc/[id]. */
export default function AppShell({ children }: { children: ReactNode }) {
  const { sidebarCollapsed, mobileNavOpen, setMobileNavOpen } = useApp();
  const pathname = usePathname();

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname, setMobileNavOpen]);

  const ease = "cubic-bezier(0.3, 0.9, 0.3, 1)";

  return (
    <div className="relative flex h-dvh w-full overflow-hidden bg-bg text-fg">
      <Ambient soft />

      {/* desktop sidebar: collapses with a width transition */}
      <div
        className="relative z-10 hidden flex-none overflow-hidden md:block"
        style={{
          width: sidebarCollapsed ? 0 : 252,
          visibility: sidebarCollapsed ? "hidden" : "visible",
          transition: `width 0.34s ${ease}, visibility 0s linear ${sidebarCollapsed ? "0.34s" : "0s"}`,
        }}
      >
        <div className="h-full w-[252px] border-r border-border">
          <Sidebar />
        </div>
      </div>

      {/* mobile drawer */}
      <div
        className="fixed inset-0 z-40 md:hidden"
        style={{ pointerEvents: mobileNavOpen ? "auto" : "none", visibility: mobileNavOpen ? "visible" : "hidden", transition: `visibility 0s linear ${mobileNavOpen ? "0s" : "0.3s"}` }}
      >
        <div
          className="absolute inset-0"
          style={{ background: "var(--overlay)", backdropFilter: "blur(4px)", opacity: mobileNavOpen ? 1 : 0, transition: "opacity 0.3s ease" }}
          onClick={() => setMobileNavOpen(false)}
        />
        <div
          className="absolute left-0 top-0 h-full w-[282px] border-r border-border"
          style={{ transform: mobileNavOpen ? "none" : "translateX(-100%)", transition: `transform 0.32s ${ease}` }}
        >
          <Sidebar onNavigate={() => setMobileNavOpen(false)} />
        </div>
      </div>

      <main className="relative z-10 flex min-w-0 flex-1 flex-col">
        <div key={pathname} className="page-in flex min-h-0 flex-1 flex-col">
          {children}
        </div>
      </main>
    </div>
  );
}
