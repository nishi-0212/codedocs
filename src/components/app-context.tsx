"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { useHistory, type HistoryItem } from "@/lib/history";

export type Theme = "dark" | "light";

export interface ToastData {
  id: number;
  message: string;
  action?: { label: string; run: () => void };
}

export interface ConfirmData {
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
}

interface AppCtx {
  isMac: boolean;
  modKey: string;

  theme: Theme;
  toggleTheme: () => void;

  paletteOpen: boolean;
  setPaletteOpen: (v: boolean | ((o: boolean) => boolean)) => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (v: boolean) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  toast: ToastData | null;
  notify: (message: string, action?: ToastData["action"]) => void;
  dismissToast: () => void;

  confirm: ConfirmData | null;
  askConfirm: (c: ConfirmData) => void;
  closeConfirm: () => void;

  fileInputRef: RefObject<HTMLInputElement>;
  pickFiles: () => void;

  items: HistoryItem[];
  historyReady: boolean;
  saveDoc: (item: HistoryItem) => void;
  renameDoc: (id: string, title: string) => void;
  deleteDoc: (id: string) => void;
  clearAll: () => void;
}

const Ctx = createContext<AppCtx | null>(null);

export function useApp(): AppCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used inside <AppProvider>");
  return v;
}

const SIDEBAR_KEY = "cd-sidebar";

export function AppProvider({ children }: { children: ReactNode }) {
  const { items, ready, upsert, rename, remove, clear } = useHistory();

  const [isMac, setIsMac] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [confirm, setConfirm] = useState<ConfirmData | null>(null);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastId = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ---- init ---- */
  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform));
    const t = document.documentElement.dataset.theme;
    if (t === "light" || t === "dark") setTheme(t);
    try {
      if (localStorage.getItem(SIDEBAR_KEY) === "1") setSidebarCollapsed(true);
    } catch {
      /* ignore */
    }
  }, []);

  /* ---- global shortcuts ---- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      } else if ((e.metaKey || e.ctrlKey) && e.key === "\\") {
        e.preventDefault();
        setSidebarCollapsed((c) => {
          try {
            localStorage.setItem(SIDEBAR_KEY, c ? "0" : "1");
          } catch {
            /* ignore */
          }
          return !c;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ---- theme + sidebar ---- */
  const toggleTheme = useCallback(() => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("cd-theme", next);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((c) => {
      try {
        localStorage.setItem(SIDEBAR_KEY, c ? "0" : "1");
      } catch {
        /* ignore */
      }
      return !c;
    });
  }, []);

  /* ---- toast ---- */
  const dismissToast = useCallback(() => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(null);
  }, []);

  const notify = useCallback((message: string, action?: ToastData["action"]) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ id: ++toastId.current, message, action });
    toastTimer.current = setTimeout(() => setToast(null), action ? 6000 : 2600);
  }, []);

  /* ---- confirm ---- */
  const askConfirm = useCallback((c: ConfirmData) => setConfirm(c), []);
  const closeConfirm = useCallback(() => setConfirm(null), []);

  /* ---- files ---- */
  const pickFiles = useCallback(() => fileInputRef.current?.click(), []);

  /* ---- documents ---- */
  const saveDoc = useCallback((item: HistoryItem) => upsert(item), [upsert]);

  const renameDoc = useCallback(
    (id: string, title: string) => {
      rename(id, title);
      notify("Renamed");
    },
    [rename, notify],
  );

  const deleteDoc = useCallback(
    (id: string) => {
      const item = items.find((i) => i.id === id);
      if (!item) return;
      remove(id);
      notify(`Deleted “${item.title.length > 36 ? item.title.slice(0, 36) + "…" : item.title}”`, {
        label: "Undo",
        run: () => upsert(item),
      });
    },
    [items, remove, notify, upsert],
  );

  const clearAll = useCallback(() => {
    if (items.length === 0) return;
    const snapshot = items;
    setConfirm({
      title: "Clear all recents?",
      body: `This permanently deletes ${snapshot.length} saved document${snapshot.length === 1 ? "" : "s"} from this browser. This can't be undone.`,
      confirmLabel: "Clear all",
      danger: true,
      onConfirm: () => {
        clear();
        notify(`Cleared ${snapshot.length} document${snapshot.length === 1 ? "" : "s"}`);
      },
    });
  }, [items, clear, notify]);

  const value = useMemo<AppCtx>(
    () => ({
      isMac,
      modKey: isMac ? "⌘" : "Ctrl+",
      theme,
      toggleTheme,
      paletteOpen,
      setPaletteOpen,
      mobileNavOpen,
      setMobileNavOpen,
      sidebarCollapsed,
      toggleSidebar,
      toast,
      notify,
      dismissToast,
      confirm,
      askConfirm,
      closeConfirm,
      fileInputRef,
      pickFiles,
      items,
      historyReady: ready,
      saveDoc,
      renameDoc,
      deleteDoc,
      clearAll,
    }),
    [
      isMac, theme, toggleTheme, paletteOpen, mobileNavOpen, sidebarCollapsed, toggleSidebar, toast, notify,
      dismissToast, confirm, askConfirm, closeConfirm, pickFiles, items, ready, saveDoc, renameDoc, deleteDoc, clearAll,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
