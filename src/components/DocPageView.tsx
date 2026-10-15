"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { styleMeta } from "@/lib/styles";
import { MODELS } from "@/lib/models";
import { languageLabel } from "@/lib/languages";
import { slugify, timeAgo, wordCount } from "@/lib/utils";
import { useApp } from "./app-context";
import { useWorkspace } from "./workspace-context";
import DocView from "./DocView";
import PageHeader from "./PageHeader";
import { Chip, InlineEdit, Orb, Segmented } from "./ui";
import { Icon } from "./icons";

interface TocEntry {
  id: string;
  text: string;
  level: 2 | 3;
}

export default function DocPageView() {
  const params = useParams() as { id?: string } | null;
  const id = params?.id ?? "";
  const router = useRouter();
  const { items, historyReady, renameDoc, deleteDoc } = useApp();
  const ws = useWorkspace();
  const item = items.find((i) => i.id === id);

  const [editing, setEditing] = useState(false);
  const [view, setView] = useState<"preview" | "markdown">("preview");
  const [toc, setToc] = useState<TocEntry[]>([]);
  const [active, setActive] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const docRef = useRef<HTMLDivElement>(null);

  /* Build the table of contents from the rendered headings. */
  useEffect(() => {
    const root = docRef.current;
    if (!root || view !== "preview") {
      setToc([]);
      return;
    }
    const seen = new Map<string, number>();
    const list: TocEntry[] = [];
    root.querySelectorAll<HTMLElement>("h2, h3").forEach((h) => {
      const text = (h.textContent ?? "").trim();
      if (!text) return;
      const base = slugify(text);
      const n = seen.get(base) ?? 0;
      seen.set(base, n + 1);
      h.id = n ? `${base}-${n}` : base;
      list.push({ id: h.id, text, level: h.tagName === "H2" ? 2 : 3 });
    });
    setToc(list);
    setActive(list[0]?.id ?? "");
  }, [item?.output, view]);

  /* Scrollspy. */
  useEffect(() => {
    const root = scrollRef.current;
    if (!root || toc.length === 0 || typeof IntersectionObserver === "undefined") return;
    const els = toc.map((t) => document.getElementById(t.id)).filter((e): e is HTMLElement => !!e);
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { root, rootMargin: "0px 0px -72% 0px", threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [toc]);

  const jump = (tid: string) => {
    setActive(tid);
    document.getElementById(tid)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /* ---- loading / not found ---- */
  if (!historyReady) {
    return (
      <>
        <PageHeader left={<span className="skeleton h-4 w-40" />} />
        <div className="mx-auto w-full max-w-[820px] space-y-3 px-8 py-10">
          <div className="skeleton h-9 w-1/2" />
          <div className="skeleton h-3.5 w-full" />
          <div className="skeleton h-3.5 w-[90%]" />
          <div className="skeleton h-3.5 w-[75%]" />
        </div>
      </>
    );
  }

  if (!item) {
    return (
      <>
        <PageHeader
          left={
            <Link href="/library" className="inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-fg">
              <Icon.ArrowLeft className="h-3.5 w-3.5" />
              Library
            </Link>
          }
        />
        <div className="grid flex-1 place-items-center px-6">
          <div className="rise max-w-sm text-center">
            <Orb tone="rose">
              <Icon.Alert className="h-6 w-6" />
            </Orb>
            <h2 className="mt-5 text-[16px] font-semibold tracking-[-0.01em]">Document not found</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              It may have been deleted, or it was saved in a different browser. Documents are stored locally.
            </p>
            <Link href="/library" className="btn btn-primary mt-5">
              Back to Library
            </Link>
          </div>
        </div>
      </>
    );
  }

  const meta = styleMeta(item.style);
  const modelLabel = MODELS.find((m) => m.id === item.model)?.label ?? item.model;
  const words = wordCount(item.output);

  return (
    <>
      <PageHeader
        left={
          <>
            <Link href="/library" className="hidden items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-fg sm:inline-flex">
              <Icon.ArrowLeft className="h-3.5 w-3.5" />
              Library
            </Link>
            <span className="hidden text-subtle sm:inline">/</span>
            {editing ? (
              <InlineEdit
                value={item.title}
                className="h-7 w-full max-w-[380px] text-[13px] font-medium"
                onCommit={(v) => {
                  renameDoc(item.id, v);
                  setEditing(false);
                }}
                onCancel={() => setEditing(false)}
              />
            ) : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                title="Click to rename"
                className="group/title inline-flex h-7 min-w-0 items-center gap-1.5 rounded-lg px-2 text-[13px] font-medium transition-colors hover:bg-hover"
              >
                <span className="truncate">{item.title}</span>
                <Icon.Pencil className="h-3 w-3 flex-none text-subtle opacity-0 transition-opacity group-hover/title:opacity-100" />
              </button>
            )}
          </>
        }
        right={
          <>
            <div className="hidden sm:block">
              <Segmented
                label="View"
                value={view}
                onChange={setView}
                options={[
                  { value: "preview", label: "Preview" },
                  { value: "markdown", label: "Markdown" },
                ]}
              />
            </div>
            <button type="button" className="icon-btn" title="Copy Markdown" aria-label="Copy Markdown" onClick={() => void ws.copyText(item.output)}>
              <Icon.Copy className="h-3.5 w-3.5" />
            </button>
            <button type="button" className="icon-btn" title="Download .md" aria-label="Download .md" onClick={() => ws.downloadMd(item.output, item.title)}>
              <Icon.Download className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="icon-btn hover:!text-danger"
              title="Delete"
              aria-label="Delete document"
              onClick={() => {
                deleteDoc(item.id);
                router.push("/library");
              }}
            >
              <Icon.Trash className="h-3.5 w-3.5" />
            </button>
            <button type="button" className="btn btn-primary" onClick={() => ws.loadItem(item)}>
              <Icon.Code className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Edit in workspace</span>
            </button>
          </>
        }
      />

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[1180px] gap-10 px-2 md:px-8">
          <div className="min-w-0 flex-1">
            <div className="rise flex flex-wrap items-center gap-1.5 px-4 pt-7 md:px-8">
              <Chip tone={meta.tone} dot>
                {meta.label}
              </Chip>
              {item.language !== "auto" && <Chip>{languageLabel(item.language)}</Chip>}
              <Chip>{modelLabel}</Chip>
              <span className="ml-1 text-[12px] text-subtle">{timeAgo(item.createdAt)}</span>
            </div>
            <div ref={docRef} key={view}>
              {view === "preview" ? <DocView markdown={item.output} /> : <pre className="raw">{item.output}</pre>}
            </div>
          </div>

          {/* right rail */}
          <aside className="hidden w-[230px] flex-none xl:block">
            <div className="sticky top-6 space-y-6 pt-8">
              {toc.length > 0 && (
                <nav aria-label="On this page">
                  <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.06em] text-subtle">On this page</div>
                  <ul className="relative space-y-px border-l border-border">
                    {toc.map((t) => (
                      <li key={t.id}>
                        <button
                          type="button"
                          onClick={() => jump(t.id)}
                          className={`-ml-px block w-full border-l py-1 text-left text-[12.5px] leading-snug transition-colors ${
                            t.level === 3 ? "pl-6" : "pl-3"
                          } ${
                            active === t.id
                              ? "border-lavender text-fg"
                              : "border-transparent text-subtle hover:text-muted"
                          }`}
                        >
                          {t.text}
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}

              <div className="card p-3.5 text-[12.5px]">
                <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.06em] text-subtle">Details</div>
                <dl className="space-y-1.5">
                  {[
                    ["Words", words.toLocaleString()],
                    ["Source", `${item.code.split("\n").length.toLocaleString()} lines`],
                    ["Model", modelLabel],
                    ["Created", new Date(item.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between gap-3">
                      <dt className="text-subtle">{k}</dt>
                      <dd className="truncate text-muted">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
