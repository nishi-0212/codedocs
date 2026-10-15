"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { DOC_STYLES } from "@/lib/styles";
import { MODELS, isModel } from "@/lib/models";
import { LANGUAGES, languageLabel } from "@/lib/languages";
import { useApp } from "./app-context";
import { useWorkspace } from "./workspace-context";
import DocView from "./DocView";
import PageHeader from "./PageHeader";
import { Kbd, Orb, Segmented, Select } from "./ui";
import { Icon } from "./icons";

const CodeEditor = dynamic(() => import("./CodeEditor"), {
  ssr: false,
  loading: () => <div className="h-full w-full" />,
});

const SOFT_LIMIT = 100_000;
const SPLIT_KEY = "cd-split";

export default function WorkspaceView() {
  const { modKey, pickFiles, renameDoc } = useApp();
  const ws = useWorkspace();
  const streaming = ws.status === "streaming";

  const [mobileTab, setMobileTab] = useState<"code" | "docs">("code");
  const [view, setView] = useState<"preview" | "markdown">("preview");
  const [split, setSplit] = useState(50);
  const [dragging, setDragging] = useState(false);
  const [fileDrag, setFileDrag] = useState(false);

  const splitRef = useRef<HTMLDivElement>(null);
  const outputScrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const dragDepth = useRef(0);

  useEffect(() => {
    try {
      const v = Number(localStorage.getItem(SPLIT_KEY));
      if (v >= 30 && v <= 70) setSplit(v);
    } catch {
      /* ignore */
    }
  }, []);

  /* jump to the docs pane on mobile when generation starts */
  useEffect(() => {
    if (streaming) {
      stickToBottom.current = true;
      outputScrollRef.current?.scrollTo({ top: 0 });
      setMobileTab("docs");
    }
  }, [streaming]);

  /* autoscroll while streaming */
  useEffect(() => {
    if (!streaming || !stickToBottom.current) return;
    const el = outputScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [ws.output, streaming]);

  const languageOptions = useMemo(
    () => [
      { value: "auto", label: ws.detected ? `Auto · ${languageLabel(ws.detected)}` : "Auto-detect" },
      ...LANGUAGES.map((l) => ({ value: l.id, label: l.label })),
    ],
    [ws.detected],
  );

  const commitTitle = () => {
    const t = ws.title.trim();
    if (ws.activeItem && t && t !== ws.activeItem.title) renameDoc(ws.activeItem.id, t);
  };

  /* ---- split divider ---- */
  const onDividerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  };
  const onDividerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || !splitRef.current) return;
    const rect = splitRef.current.getBoundingClientRect();
    setSplit(Math.min(70, Math.max(30, ((e.clientX - rect.left) / rect.width) * 100)));
  };
  const onDividerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    try {
      localStorage.setItem(SPLIT_KEY, String(Math.round(split)));
    } catch {
      /* ignore */
    }
  };

  /* ---- file drag & drop on the code pane ---- */
  const hasFiles = (e: React.DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes("Files");
  const dragHandlers = {
    onDragEnterCapture: (e: React.DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dragDepth.current++;
      setFileDrag(true);
    },
    onDragOverCapture: (e: React.DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      e.stopPropagation();
    },
    onDragLeaveCapture: (e: React.DragEvent) => {
      if (!hasFiles(e)) return;
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) setFileDrag(false);
    },
    onDropCapture: (e: React.DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      e.stopPropagation();
      dragDepth.current = 0;
      setFileDrag(false);
      void ws.loadFiles(Array.from(e.dataTransfer.files));
    },
  };

  return (
    <>
      <PageHeader
        progress={streaming}
        left={
          <>
            <span className="hidden text-[13px] text-subtle sm:inline">Workspace</span>
            <span className="hidden text-subtle sm:inline">/</span>
            <input
              value={ws.title}
              onChange={(e) => ws.setTitle(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
              }}
              placeholder={ws.displayTitle}
              maxLength={80}
              aria-label="Document title"
              title="Click to name this document"
              className="h-7 w-full min-w-0 max-w-[360px] rounded-lg bg-transparent px-2 text-[13px] font-medium text-fg outline-none transition-colors placeholder:text-fg hover:bg-hover focus:bg-surface focus:ring-2 focus:ring-[var(--accent-soft)]"
            />
          </>
        }
        right={
          <>
            <div className="md:hidden">
              <Segmented
                role="tablist"
                label="Pane"
                value={mobileTab}
                onChange={setMobileTab}
                options={[
                  { value: "code", label: "Code" },
                  { value: "docs", label: "Docs" },
                ]}
              />
            </div>
            <Select
              label="Model"
              value={ws.model}
              onChange={(v) => isModel(v) && ws.setModel(v)}
              options={MODELS.map((m) => ({ value: m.id, label: m.label }))}
              className="hidden lg:inline-flex"
            />
            <button
              type="button"
              onClick={streaming ? ws.stop : () => void ws.generate()}
              className={`btn ${streaming ? "btn-live" : "btn-primary"}`}
            >
              {streaming ? <Icon.Stop className="h-3 w-3" /> : <Icon.Play className="h-3 w-3" />}
              {streaming ? "Stop" : "Generate"}
              {!streaming && <span className="kbd hidden md:inline-flex">{modKey}↵</span>}
            </button>
          </>
        }
      />

      {/* doc style pills */}
      <div className="no-scrollbar flex flex-none items-center gap-1.5 overflow-x-auto border-b border-border px-3 py-2 md:px-4">
        <span className="mr-1 hidden text-[11.5px] text-subtle sm:inline">Style</span>
        {DOC_STYLES.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`pill tone-${s.tone}`}
            aria-pressed={ws.style === s.id}
            title={s.description}
            onClick={() => ws.setStyle(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* panes */}
      <div
        ref={splitRef}
        className={`flex min-h-0 flex-1 ${dragging ? "select-none" : ""}`}
        style={{ "--split": `${split}%` } as CSSProperties}
      >
        {/* ---- code pane ---- */}
        <section className={`pane-left relative flex-col ${mobileTab === "code" ? "flex" : "hidden"} md:flex`} {...dragHandlers}>
          <div className="flex h-10 flex-none items-center justify-between border-b border-border px-3">
            <div className="flex items-center gap-2 text-[12.5px] text-muted">
              <span className="font-medium text-fg">Code</span>
              {ws.fileCount > 1 && <span className="chip tone-sky">{ws.fileCount} files</span>}
            </div>
            <div className="flex items-center gap-1">
              <Select
                label="Language"
                value={ws.multiFile ? "auto" : ws.language}
                onChange={ws.setLanguage}
                options={ws.multiFile ? [{ value: "auto", label: "Per file" }] : languageOptions}
              />
              <button type="button" className="btn btn-quiet btn-sm" onClick={pickFiles} title="Upload files">
                <Icon.Upload className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">Upload</span>
              </button>
              <button type="button" className="btn btn-quiet btn-sm" onClick={ws.loadSample} title="Load example code">
                <Icon.Sparkle className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">Example</span>
              </button>
            </div>
          </div>

          <div className="relative min-h-0 flex-1">
            <CodeEditor value={ws.code} onChange={ws.setCode} language={ws.effectiveLang} onSubmit={() => void ws.generate()} />
            {fileDrag && (
              <div
                className="pointer-events-none absolute inset-2 z-10 grid animate-fadeIn place-items-center rounded-xl border-2 border-dashed text-[13px] font-medium"
                style={{
                  borderColor: "var(--accent-line)",
                  background: "color-mix(in srgb, var(--bg) 86%, transparent)",
                  backdropFilter: "blur(3px)",
                }}
              >
                Drop files to import
              </div>
            )}
          </div>

          <div className="flex h-7 flex-none items-center justify-between border-t border-border px-3 text-[11px] text-subtle">
            <span>
              {ws.stats.lines.toLocaleString()} lines · {ws.stats.chars.toLocaleString()} chars
            </span>
            {ws.stats.chars > SOFT_LIMIT && <span className="text-danger">Over the {SOFT_LIMIT.toLocaleString()} character limit</span>}
          </div>
        </section>

        <div
          className="divider hidden md:block"
          data-dragging={dragging}
          onPointerDown={onDividerDown}
          onPointerMove={onDividerMove}
          onPointerUp={onDividerUp}
          onDoubleClick={() => setSplit(50)}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize panes"
        />

        {/* ---- docs pane ---- */}
        <section className={`pane-right flex-col ${mobileTab === "docs" ? "flex" : "hidden"} md:flex`}>
          <div className="flex h-10 flex-none items-center justify-between border-b border-border px-3">
            <div className="flex items-center gap-2 text-[12.5px]">
              <span className="font-medium">Documentation</span>
              {streaming && (
                <span className="inline-flex items-center gap-1.5 text-[11.5px] text-muted">
                  <span className="h-1.5 w-1.5 animate-pulseDot rounded-full bg-lavender" style={{ boxShadow: "0 0 8px var(--lavender)" }} />
                  Generating
                </span>
              )}
              {ws.status === "done" && <span className="animate-fadeIn text-[11.5px] text-success">Saved</span>}
            </div>
            <div className="flex items-center gap-1">
              {ws.status === "done" && ws.activeItem && (
                <Link href={`/doc/${ws.activeItem.id}`} className="btn btn-ghost btn-sm mr-1 hidden sm:inline-flex">
                  Open page
                  <Icon.External className="h-3 w-3" />
                </Link>
              )}
              <Segmented
                label="View"
                value={view}
                onChange={setView}
                options={[
                  { value: "preview", label: "Preview" },
                  { value: "markdown", label: "Markdown" },
                ]}
              />
              <button type="button" className="icon-btn ml-1" title="Copy Markdown" aria-label="Copy Markdown" disabled={!ws.output} onClick={() => void ws.copyText(ws.output)}>
                <Icon.Copy className="h-3.5 w-3.5" />
              </button>
              <button type="button" className="icon-btn" title="Download .md" aria-label="Download .md" disabled={!ws.output} onClick={() => ws.downloadMd(ws.output, ws.displayTitle)}>
                <Icon.Download className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div
            ref={outputScrollRef}
            className="min-h-0 flex-1 overflow-y-auto"
            onScroll={(e) => {
              const el = e.currentTarget;
              stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
            }}
          >
            {ws.error && (
              <div className="mx-auto max-w-[820px] animate-slideUp px-8 pt-6">
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-xl border px-3.5 py-3 text-[13px]"
                  style={{
                    background: "color-mix(in srgb, var(--danger) 9%, transparent)",
                    borderColor: "color-mix(in srgb, var(--danger) 32%, transparent)",
                  }}
                >
                  <Icon.Alert className="mt-0.5 h-4 w-4 flex-none text-danger" />
                  <div className="min-w-0 flex-1 leading-relaxed">{ws.error}</div>
                  <button type="button" onClick={() => void ws.generate()} className="btn btn-ghost btn-sm flex-none">
                    Retry
                  </button>
                </div>
              </div>
            )}

            {ws.output ? (
              view === "markdown" ? (
                <pre className="raw">{ws.output}</pre>
              ) : (
                <DocView markdown={ws.output} />
              )
            ) : streaming ? (
              <div className="mx-auto max-w-[820px] space-y-3 px-8 py-8" aria-label="Generating documentation">
                <div className="skeleton h-8 w-2/5" />
                <div className="skeleton h-3.5 w-full" />
                <div className="skeleton h-3.5 w-[92%]" />
                <div className="skeleton h-3.5 w-[70%]" />
                <div className="skeleton mt-6 h-5 w-1/4" />
                <div className="skeleton h-24 w-full" />
                <div className="skeleton h-3.5 w-[85%]" />
              </div>
            ) : !ws.error ? (
              <div className="grid h-full place-items-center px-6">
                <div className="rise max-w-sm text-center">
                  <Orb>
                    <Icon.Sparkle className="h-6 w-6" />
                  </Orb>
                  <h2 className="mt-5 text-[16px] font-semibold tracking-[-0.01em]">Documentation appears here</h2>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted">
                    Paste code or drop files on the left, pick a style, then press <Kbd>{modKey}↵</Kbd>. Works with Python, JavaScript,
                    TypeScript, Java, Go, Rust, C/C++ and more.
                  </p>
                  <div className="mt-5 flex justify-center gap-2">
                    <button type="button" onClick={ws.loadSample} className="btn btn-primary">
                      <Icon.Sparkle className="h-3.5 w-3.5" />
                      Try an example
                    </button>
                    <button type="button" onClick={pickFiles} className="btn btn-ghost">
                      Upload files
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </>
  );
}
