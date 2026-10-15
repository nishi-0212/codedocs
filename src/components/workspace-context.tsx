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
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { DEFAULT_MODEL, isModel } from "@/lib/models";
import { isDocStyle, type DocStyle } from "@/lib/styles";
import { detectLanguage, languageFromFilename, languageLabel } from "@/lib/languages";
import { ERROR_MARKER, fileMarker, hasFileMarkers, listFiles } from "@/lib/protocol";
import { SAMPLE_CODE } from "@/lib/sample";
import type { HistoryItem } from "@/lib/history";
import { cleanOutput, deriveTitle, extractTitle, slugify, uid } from "@/lib/utils";
import { useApp } from "./app-context";

export type Status = "idle" | "streaming" | "done" | "error";

interface WorkspaceCtx {
  code: string;
  setCode: (v: string) => void;
  language: string;
  setLanguage: (v: string) => void;
  style: DocStyle;
  setStyle: (v: DocStyle) => void;
  model: string;
  setModel: (v: string) => void;

  /** Title typed by the user (empty = automatic). */
  title: string;
  setTitle: (v: string) => void;
  /** What to show: typed title, else saved title, else derived from the code. */
  displayTitle: string;

  output: string;
  status: Status;
  error: string | null;
  activeId: string | null;
  activeItem: HistoryItem | undefined;

  detected: string | null;
  effectiveLang: string;
  multiFile: boolean;
  fileCount: number;
  stats: { lines: number; chars: number };

  generate: () => Promise<void>;
  stop: () => void;
  newDoc: () => void;
  loadSample: () => void;
  loadItem: (item: HistoryItem) => void;
  loadFiles: (files: File[]) => Promise<void>;
  copyText: (text: string) => Promise<void>;
  downloadMd: (text: string, name: string) => void;
}

const Ctx = createContext<WorkspaceCtx | null>(null);

export function useWorkspace(): WorkspaceCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useWorkspace must be used inside <WorkspaceProvider>");
  return v;
}

const PREFS_KEY = "cd-prefs-v1";

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { notify, items, saveDoc } = useApp();

  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("auto");
  const [style, setStyle] = useState<DocStyle>("full");
  const [model, setModel] = useState<string>(DEFAULT_MODEL);
  const [title, setTitle] = useState("");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const busyRef = useRef(false);
  const runRef = useRef(0);
  const latestRef = useRef("");
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ---------------- prefs ---------------- */
  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
      if (isDocStyle(p.style)) setStyle(p.style);
      if (isModel(p.model)) setModel(p.model);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      const prev = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
      localStorage.setItem(PREFS_KEY, JSON.stringify({ ...prev, style, model }));
    } catch {
      /* ignore */
    }
  }, [style, model]);

  /* ---------------- derived ---------------- */
  const multiFile = useMemo(() => hasFileMarkers(code), [code]);
  const detected = useMemo(() => (multiFile ? null : detectLanguage(code)), [code, multiFile]);
  const effectiveLang = multiFile ? "auto" : language !== "auto" ? language : (detected ?? "auto");
  const apiLang = effectiveLang === "auto" ? "auto" : languageLabel(effectiveLang);
  const fileCount = useMemo(() => (multiFile ? listFiles(code).length : 0), [code, multiFile]);
  const stats = useMemo(() => {
    let lines = code ? 1 : 0;
    for (let i = 0; i < code.length; i++) if (code.charCodeAt(i) === 10) lines++;
    return { lines, chars: code.length };
  }, [code]);

  const activeItem = useMemo(() => (activeId ? items.find((i) => i.id === activeId) : undefined), [activeId, items]);
  const derivedTitle = useMemo(() => (code.trim() ? deriveTitle(code) : "New document"), [code]);
  const displayTitle = title.trim() || activeItem?.title || derivedTitle;

  /* ---------------- helpers ---------------- */
  const clearFlush = useCallback(() => {
    if (flushTimer.current) {
      clearTimeout(flushTimer.current);
      flushTimer.current = null;
    }
  }, []);

  const scheduleFlush = useCallback(() => {
    if (flushTimer.current) return;
    flushTimer.current = setTimeout(() => {
      flushTimer.current = null;
      setOutput(latestRef.current);
    }, 60);
  }, []);

  const cancelRun = useCallback(() => {
    runRef.current++;
    abortRef.current?.abort();
    abortRef.current = null;
    busyRef.current = false;
    clearFlush();
  }, [clearFlush]);

  const resetOutput = useCallback(() => {
    latestRef.current = "";
    setOutput("");
    setError(null);
    setStatus("idle");
    setActiveId(null);
  }, []);

  const goWorkspace = useCallback(() => {
    if (pathname !== "/workspace") router.push("/workspace");
  }, [pathname, router]);

  /* ---------------- generate ---------------- */
  const generate = useCallback(async () => {
    if (busyRef.current) return;
    if (!code.trim()) {
      notify("Paste or upload some code first");
      return;
    }
    busyRef.current = true;
    const run = ++runRef.current;
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    latestRef.current = "";
    setOutput("");
    setError(null);
    setStatus("streaming");

    const visible = (raw: string) => {
      const i = raw.indexOf(ERROR_MARKER);
      return cleanOutput(i >= 0 ? raw.slice(0, i) : raw);
    };

    let acc = "";
    let failure: string | null = null;
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code, language: apiLang, style, model }),
        signal: ctrl.signal,
      });
      if (!res.ok) {
        let msg = `Request failed (${res.status})`;
        try {
          const j = await res.json();
          if (j?.error) msg = j.error;
        } catch {
          /* non-JSON error body */
        }
        throw new Error(msg);
      }
      if (!res.body) throw new Error("The server sent an empty response.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        if (run !== runRef.current) return;
        latestRef.current = visible(acc);
        scheduleFlush();
      }
      acc += decoder.decode();
    } catch (e) {
      const err = e as Error;
      if (err.name !== "AbortError") {
        failure =
          e instanceof TypeError ? "Could not reach the server. Check your connection." : err.message || "Something went wrong.";
      }
    }

    // A newer action (new doc, open doc, new run) took over: don't touch state.
    if (run !== runRef.current) return;

    const mi = acc.indexOf(ERROR_MARKER);
    if (mi >= 0) {
      failure = acc.slice(mi + ERROR_MARKER.length).trim() || "Generation failed.";
      acc = acc.slice(0, mi);
    }
    const doc = cleanOutput(acc).trim();

    clearFlush();
    latestRef.current = doc;
    setOutput(doc);
    busyRef.current = false;
    abortRef.current = null;

    if (failure) {
      setError(failure);
      setStatus("error");
      return;
    }
    if (!doc) {
      setStatus("idle");
      return;
    }
    setStatus("done");

    // Regenerating the same code updates its entry; changed code gets a new one.
    const existing = activeId ? items.find((i) => i.id === activeId) : undefined;
    const id = existing && existing.code === code ? existing.id : uid();

    // Title priority: what the user typed > a name they gave it earlier > the doc's own H1 > first code line.
    const typed = title.trim();
    let finalTitle: string;
    let renamed: boolean;
    if (typed) {
      finalTitle = typed;
      renamed = true;
    } else if (existing && existing.id === id && existing.renamed) {
      finalTitle = existing.title;
      renamed = true;
    } else {
      finalTitle = (style === "docstrings" ? null : extractTitle(doc)) || deriveTitle(code);
      renamed = false;
    }

    setActiveId(id);
    saveDoc({
      id,
      title: finalTitle,
      renamed,
      code,
      language,
      style,
      model,
      output: doc,
      createdAt: Date.now(),
    });
    notify("Saved to Library", { label: "Open", run: () => router.push(`/doc/${id}`) });
  }, [code, apiLang, language, style, model, title, activeId, items, notify, scheduleFlush, clearFlush, saveDoc, router]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  /* ---------------- actions ---------------- */
  const newDoc = useCallback(() => {
    cancelRun();
    setCode("");
    setLanguage("auto");
    setTitle("");
    resetOutput();
    goWorkspace();
  }, [cancelRun, resetOutput, goWorkspace]);

  const loadSample = useCallback(() => {
    cancelRun();
    setCode(SAMPLE_CODE);
    setLanguage("auto");
    setTitle("");
    resetOutput();
    goWorkspace();
  }, [cancelRun, resetOutput, goWorkspace]);

  const loadItem = useCallback(
    (item: HistoryItem) => {
      cancelRun();
      setCode(item.code);
      setLanguage(item.language);
      setStyle(isDocStyle(item.style) ? item.style : "full");
      setModel(isModel(item.model) ? item.model : DEFAULT_MODEL);
      setTitle(item.renamed ? item.title : "");
      latestRef.current = item.output;
      setOutput(item.output);
      setError(null);
      setStatus("done");
      setActiveId(item.id);
      goWorkspace();
    },
    [cancelRun, goWorkspace],
  );

  const loadFiles = useCallback(
    async (files: File[]) => {
      const accepted: { name: string; text: string }[] = [];
      let skipped = 0;
      for (const f of files.slice(0, 40)) {
        if (f.size > 400_000) {
          skipped++;
          continue;
        }
        try {
          const text = await f.text();
          if (text.includes("\u0000")) {
            skipped++;
            continue;
          }
          accepted.push({ name: f.name, text });
        } catch {
          skipped++;
        }
      }
      if (accepted.length === 0) {
        notify("No readable text files found");
        return;
      }
      cancelRun();
      if (accepted.length === 1) {
        setCode(accepted[0].text);
        setLanguage(languageFromFilename(accepted[0].name) ?? "auto");
      } else {
        setCode(accepted.map((f) => `${fileMarker(f.name)}\n${f.text.replace(/\s+$/, "")}\n`).join("\n"));
        setLanguage("auto");
      }
      setTitle("");
      resetOutput();
      goWorkspace();
      notify(`Imported ${accepted.length} file${accepted.length > 1 ? "s" : ""}${skipped ? ` (${skipped} skipped)` : ""}`);
    },
    [cancelRun, resetOutput, goWorkspace, notify],
  );

  const copyText = useCallback(
    async (text: string) => {
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        notify("Markdown copied");
      } catch {
        notify("Could not access the clipboard");
      }
    },
    [notify],
  );

  const downloadMd = useCallback((text: string, name: string) => {
    if (!text) return;
    const blob = new Blob([text + "\n"], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slugify(name)}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, []);

  /* ---------------- keyboard: Ctrl/Cmd+Enter generates, Esc stops ---------------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        if (pathname === "/workspace") {
          e.preventDefault();
          void generate();
        }
      } else if (e.key === "Escape" && busyRef.current) {
        stop();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [generate, stop, pathname]);

  const value = useMemo<WorkspaceCtx>(
    () => ({
      code, setCode, language, setLanguage, style, setStyle, model, setModel,
      title, setTitle, displayTitle,
      output, status, error, activeId, activeItem,
      detected, effectiveLang, multiFile, fileCount, stats,
      generate, stop, newDoc, loadSample, loadItem, loadFiles, copyText, downloadMd,
    }),
    [
      code, language, style, model, title, displayTitle, output, status, error, activeId, activeItem,
      detected, effectiveLang, multiFile, fileCount, stats, generate, stop, newDoc, loadSample, loadItem, loadFiles,
      copyText, downloadMd,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

