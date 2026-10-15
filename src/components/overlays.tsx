"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { MODELS } from "@/lib/models";
import { DOC_STYLES, styleMeta } from "@/lib/styles";
import { useApp } from "./app-context";
import { useWorkspace } from "./workspace-context";
import CommandPalette, { type Command } from "./CommandPalette";
import { Icon } from "./icons";

/** Built only while the palette is open, so streaming updates don't rebuild it. */
function PaletteHost() {
  const router = useRouter();
  const app = useApp();
  const ws = useWorkspace();
  const streaming = ws.status === "streaming";

  const commands = useMemo<Command[]>(() => {
    const go = (href: string) => () => router.push(href);
    return [
      { id: "go-workspace", section: "Navigate", label: "Go to Workspace", run: go("/workspace") },
      { id: "go-library", section: "Navigate", label: "Go to Library", run: go("/library") },
      { id: "go-home", section: "Navigate", label: "Go to Home", run: go("/") },
      {
        id: "generate",
        section: "Actions",
        label: streaming ? "Stop generating" : "Generate documentation",
        hint: `${app.modKey}↵`,
        run: streaming ? ws.stop : () => void ws.generate(),
      },
      { id: "new", section: "Actions", label: "New document", run: ws.newDoc },
      { id: "upload", section: "Actions", label: "Upload files…", run: app.pickFiles },
      { id: "sample", section: "Actions", label: "Load example code", run: ws.loadSample },
      { id: "sidebar", section: "Actions", label: "Toggle sidebar", hint: `${app.modKey}\\`, run: app.toggleSidebar },
      {
        id: "copy",
        section: "Output",
        label: "Copy Markdown",
        disabled: !ws.output,
        run: () => void ws.copyText(ws.output),
      },
      {
        id: "download",
        section: "Output",
        label: "Download as .md",
        disabled: !ws.output,
        run: () => ws.downloadMd(ws.output, ws.displayTitle),
      },
      ...DOC_STYLES.map<Command>((s) => ({
        id: `style-${s.id}`,
        section: "Doc style",
        label: `${s.label}${s.id === ws.style ? "  ·  current" : ""}`,
        run: () => ws.setStyle(s.id),
      })),
      ...MODELS.map<Command>((m) => ({
        id: `model-${m.id}`,
        section: "Model",
        label: `${m.label}  ·  ${m.hint}${m.id === ws.model ? "  ·  current" : ""}`,
        run: () => ws.setModel(m.id),
      })),
      {
        id: "theme",
        section: "Appearance",
        label: app.theme === "dark" ? "Switch to light theme" : "Switch to dark theme",
        run: app.toggleTheme,
      },
      ...app.items.slice(0, 30).map<Command>((it) => ({
        id: `doc-${it.id}`,
        section: "Recent documents",
        label: it.title,
        hint: styleMeta(it.style).short,
        run: go(`/doc/${it.id}`),
      })),
      {
        id: "clear",
        section: "Library",
        label: "Clear all recents",
        disabled: app.items.length === 0,
        run: app.clearAll,
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streaming, app.modKey, app.theme, app.items, ws.output, ws.style, ws.model, ws.displayTitle]);

  return <CommandPalette onClose={() => app.setPaletteOpen(false)} commands={commands} />;
}

function Toast() {
  const { toast, dismissToast } = useApp();
  if (!toast) return null;
  return (
    <div
      key={toast.id}
      role="status"
      className="fixed bottom-5 left-1/2 z-[80] flex -translate-x-1/2 animate-slideUp items-center gap-3 rounded-xl border border-border-strong bg-surface py-2 pl-4 pr-2 text-[13px]"
      style={{ boxShadow: "var(--shadow)" }}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-lavender" style={{ boxShadow: "0 0 10px var(--lavender)" }} />
      <span>{toast.message}</span>
      {toast.action ? (
        <button
          type="button"
          className="btn btn-sm btn-ghost"
          onClick={() => {
            const run = toast.action!.run;
            dismissToast();
            run();
          }}
        >
          {toast.action.label === "Undo" && <Icon.Undo className="h-3 w-3" />}
          {toast.action.label}
        </button>
      ) : (
        <span className="w-2" />
      )}
    </div>
  );
}

function ConfirmDialog() {
  const { confirm, closeConfirm } = useApp();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!confirm) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeConfirm();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [confirm, closeConfirm]);

  if (!confirm) return null;
  return (
    <div
      className="fixed inset-0 z-[90] grid animate-fadeIn place-items-center px-4"
      style={{ background: "var(--overlay)", backdropFilter: "blur(6px)" }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeConfirm();
      }}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div
        className="w-full max-w-[400px] animate-popIn rounded-2xl border border-border-strong bg-surface p-5"
        style={{ boxShadow: "var(--shadow)" }}
      >
        <h2 id="confirm-title" className="text-[15px] font-semibold tracking-[-0.01em]">
          {confirm.title}
        </h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{confirm.body}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button ref={cancelRef} type="button" className="btn btn-ghost" onClick={closeConfirm}>
            Cancel
          </button>
          <button
            type="button"
            className={`btn ${confirm.danger ? "btn-danger-solid" : "btn-primary"}`}
            onClick={() => {
              const run = confirm.onConfirm;
              closeConfirm();
              run();
            }}
          >
            {confirm.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Overlays() {
  const { paletteOpen, fileInputRef } = useApp();
  const ws = useWorkspace();
  const loadFiles = ws.loadFiles;

  return (
    <>
      {paletteOpen && <PaletteHost />}
      <Toast />
      <ConfirmDialog />
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        aria-hidden
        tabIndex={-1}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (files.length) void loadFiles(files);
        }}
      />
    </>
  );
}
