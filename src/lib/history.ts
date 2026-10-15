"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DocStyle } from "./styles";

export interface HistoryItem {
  id: string;
  title: string;
  /** true once the user typed/edited the title themselves; it is then never auto-replaced */
  renamed?: boolean;
  code: string;
  language: string;
  style: DocStyle;
  model: string;
  output: string;
  createdAt: number;
}

const KEY = "cd-history-v1";
const MAX_ITEMS = 60;

const byNewest = (a: HistoryItem, b: HistoryItem) => b.createdAt - a.createdAt;

export function useHistory() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems((parsed as HistoryItem[]).sort(byNewest));
      }
    } catch {
      /* corrupted or unavailable storage: start fresh */
    }
    setReady(true);
    // Enable persistence only after this commit's effects have run, so the initial
    // empty list is never written over the stored history.
    Promise.resolve().then(() => {
      loaded.current = true;
    });
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    let list = items;
    // On quota errors keep halving the list until it fits.
    for (let i = 0; i < 6; i++) {
      try {
        localStorage.setItem(KEY, JSON.stringify(list));
        return;
      } catch {
        if (list.length <= 1) return;
        list = list.slice(0, Math.ceil(list.length / 2));
      }
    }
  }, [items]);

  const upsert = useCallback((item: HistoryItem) => {
    setItems((prev) => [item, ...prev.filter((i) => i.id !== item.id)].sort(byNewest).slice(0, MAX_ITEMS));
  }, []);

  const rename = useCallback((id: string, title: string) => {
    const t = title.trim().slice(0, 80);
    if (!t) return;
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, title: t, renamed: true } : i)));
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  return { items, ready, upsert, rename, remove, clear };
}
