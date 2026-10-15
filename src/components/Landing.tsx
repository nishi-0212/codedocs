"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { DOC_STYLES } from "@/lib/styles";
import { useApp } from "./app-context";
import { useWorkspace } from "./workspace-context";
import { Ambient } from "./AppShell";
import { Chip } from "./ui";
import { Icon } from "./icons";

/** Fades/slides children in once they scroll into view. */
function Reveal({ children, i = 0, className = "" }: { children: ReactNode; i?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${shown ? "in" : ""} ${className}`} style={{ "--i": i } as CSSProperties}>
      {children}
    </div>
  );
}

const FEATURES: { title: string; body: string; tone: "lavender" | "mint" | "sky" | "peach" | "rose" | "lemon"; icon: ReactNode }[] = [
  { title: "Any language", body: "Python, TypeScript, Go, Rust, Java, SQL and more. The language is detected automatically.", tone: "lavender", icon: <Icon.Code /> },
  { title: "Streams as it writes", body: "Docs appear token by token, so you can start reading while the rest is still being generated.", tone: "mint", icon: <Icon.Stream /> },
  { title: "Whole projects", body: "Drop several files at once. Each one is documented in context with a clear file structure.", tone: "sky", icon: <Icon.Layers /> },
  { title: "Five doc styles", body: "Full reference, README, API docs, docstrings in your code, or an architecture overview.", tone: "peach", icon: <Icon.File /> },
  { title: "Library you control", body: "Every document is saved, searchable, renameable and exportable as Markdown.", tone: "rose", icon: <Icon.Library /> },
  { title: "Private by design", body: "Your key stays on the server and your history stays in your browser. Nothing is stored remotely.", tone: "lemon", icon: <Icon.Lock /> },
];

const STEPS = [
  { n: "01", title: "Paste or drop code", body: "Type it in, upload files, or drag them onto the editor." },
  { n: "02", title: "Pick a style", body: "Choose the kind of document you need and the model to write it." },
  { n: "03", title: "Read, rename, export", body: "Docs stream in live, get saved to your Library and download as Markdown." },
];

const LANGS = ["Python", "TypeScript", "JavaScript", "Go", "Rust", "Java", "C#", "C++", "C", "Ruby", "PHP", "Swift", "Kotlin", "SQL", "Shell", "Scala", "Dart", "Lua", "R", "YAML"];

function DemoWindow() {
  return (
    <div className="float relative mx-auto w-full max-w-[920px]">
      <div className="absolute -inset-6 -z-10 rounded-[32px] opacity-60 blur-3xl" style={{ background: "linear-gradient(120deg, var(--glow-a), var(--glow-b), var(--glow-c))" }} />
      <div className="card overflow-hidden text-left shadow-2xl">
        <div className="flex h-9 items-center gap-1.5 border-b border-border px-3.5">
          <i className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--rose)" }} />
          <i className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--lemon)" }} />
          <i className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--mint)" }} />
          <span className="ml-3 text-[11.5px] text-subtle">cache.py → TTLCache</span>
        </div>
        <div className="grid md:grid-cols-2">
          <pre className="m-0 overflow-hidden border-b border-border p-4 font-mono text-[12px] leading-[1.7] text-muted md:border-b-0 md:border-r">
            <span style={{ color: "var(--lavender)" }}>class</span> <span style={{ color: "var(--sky)" }}>TTLCache</span>:{"\n"}
            {"    "}<span style={{ color: "var(--lavender)" }}>def</span> <span style={{ color: "var(--mint)" }}>__init__</span>(self, ttl=<span style={{ color: "var(--peach)" }}>60</span>):{"\n"}
            {"        "}self.ttl = ttl{"\n"}
            {"        "}self._data = {"{}"}{"\n"}
            {"\n"}
            {"    "}<span style={{ color: "var(--lavender)" }}>def</span> <span style={{ color: "var(--mint)" }}>get</span>(self, key):{"\n"}
            {"        "}value, exp = self._data[key]{"\n"}
            {"        "}<span style={{ color: "var(--lavender)" }}>if</span> time.time() &gt; exp:{"\n"}
            {"            "}<span style={{ color: "var(--lavender)" }}>del</span> self._data[key]
          </pre>
          <div className="space-y-2.5 p-4 text-[12.5px]">
            {[
              <h4 key="a" className="text-[15px] font-semibold tracking-[-0.01em]">TTLCache</h4>,
              <p key="b" className="text-muted">An in-memory key-value store whose entries expire after a fixed time-to-live.</p>,
              <div key="c" className="flex flex-wrap gap-1.5">
                <Chip tone="mint" dot>get(key)</Chip>
                <Chip tone="sky" dot>set(key, value)</Chip>
                <Chip tone="peach" dot>ttl: int</Chip>
              </div>,
              <p key="d" className="text-muted">Expired entries are removed lazily the next time they are read.</p>,
              <div key="e" className="skeleton h-2.5 w-[70%]" />,
            ].map((el, i) => (
              <div key={i} className="demo-line" style={{ "--i": i } as CSSProperties}>
                {el}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const { theme, toggleTheme } = useApp();
  const ws = useWorkspace();

  return (
    <div className="relative min-h-dvh overflow-x-clip bg-bg text-fg">
      <Ambient />
      <div className="grid-bg" aria-hidden />

      {/* nav */}
      <header className="sticky top-0 z-30 border-b border-border backdrop-blur-xl" style={{ background: "color-mix(in srgb, var(--bg) 72%, transparent)" }}>
        <div className="mx-auto flex h-14 max-w-[1120px] items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2">
            <Icon.Logo className="h-5 w-5" />
            <span className="text-[14px] font-semibold tracking-[-0.01em]">CodeDocs</span>
          </Link>
          <nav className="hidden items-center gap-1 text-[13px] text-muted md:flex">
            <a href="#features" className="rounded-lg px-3 py-1.5 transition-colors hover:bg-hover hover:text-fg">Features</a>
            <a href="#styles" className="rounded-lg px-3 py-1.5 transition-colors hover:bg-hover hover:text-fg">Styles</a>
            <a href="#how" className="rounded-lg px-3 py-1.5 transition-colors hover:bg-hover hover:text-fg">How it works</a>
          </nav>
          <div className="flex items-center gap-2">
            <button type="button" onClick={toggleTheme} className="icon-btn" aria-label="Toggle theme" title="Toggle theme">
              <span key={theme} className="inline-grid animate-popIn">{theme === "dark" ? <Icon.Sun /> : <Icon.Moon />}</span>
            </button>
            <Link href="/library" className="btn btn-ghost hidden sm:inline-flex">Library</Link>
            <Link href="/workspace" className="btn btn-primary">
              Open app <Icon.Arrow className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* hero */}
        <section className="mx-auto max-w-[1120px] px-5 pb-20 pt-16 text-center md:pt-24">
          <div className="rise inline-flex">
            <Chip tone="lavender" dot>Powered by Groq · blazing fast</Chip>
          </div>
          <h1 className="rise mx-auto mt-6 max-w-[820px] text-[40px] font-semibold leading-[1.05] tracking-[-0.04em] sm:text-[58px]" style={{ "--i": 1 } as CSSProperties}>
            Technical docs from code, <span className="text-gradient">written in seconds</span>
          </h1>
          <p className="rise mx-auto mt-5 max-w-[560px] text-[16px] leading-relaxed text-muted" style={{ "--i": 2 } as CSSProperties}>
            Paste code in any language and get clear, structured documentation. READMEs, API references, docstrings and architecture overviews.
          </p>
          <div className="rise mt-8 flex flex-wrap items-center justify-center gap-2.5" style={{ "--i": 3 } as CSSProperties}>
            <Link href="/workspace" className="btn btn-primary !h-10 !px-5 !text-[14px]">
              Start documenting <Icon.Arrow className="h-4 w-4" />
            </Link>
            <button type="button" className="btn btn-ghost !h-10 !px-5 !text-[14px]" onClick={ws.loadSample}>
              Try an example
            </button>
          </div>
          <div className="rise mt-14" style={{ "--i": 4 } as CSSProperties}>
            <DemoWindow />
          </div>
        </section>

        {/* languages */}
        <section aria-label="Supported languages" className="border-y border-border py-5">
          <div className="overflow-hidden" style={{ maskImage: "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)", WebkitMaskImage: "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)" }}>
            <div className="marquee">
              {[...LANGS, ...LANGS].map((l, i) => (
                <span key={i} className="mr-2.5 rounded-full border border-border px-3.5 py-1 text-[12.5px] text-muted">{l}</span>
              ))}
            </div>
          </div>
        </section>

        {/* features */}
        <section id="features" className="mx-auto max-w-[1120px] scroll-mt-20 px-5 py-24">
          <Reveal>
            <h2 className="text-center text-[30px] font-semibold tracking-[-0.03em]">Everything you need, nothing you don&apos;t</h2>
            <p className="mx-auto mt-3 max-w-[480px] text-center text-[14.5px] text-muted">A focused tool that does one thing well: turns code into documentation people can read.</p>
          </Reveal>
          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} i={i % 3}>
                <div className={`card card-hover tone-${f.tone} h-full p-5`}>
                  <span className="grid h-9 w-9 place-items-center rounded-xl border" style={{ background: "var(--t-bg)", borderColor: "var(--t-bd)", color: "var(--t)" }}>
                    {f.icon}
                  </span>
                  <h3 className="mt-4 text-[15px] font-semibold tracking-[-0.01em]">{f.title}</h3>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{f.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* styles */}
        <section id="styles" className="mx-auto max-w-[1120px] scroll-mt-20 px-5 pb-24">
          <Reveal>
            <h2 className="text-center text-[30px] font-semibold tracking-[-0.03em]">Pick the document you need</h2>
          </Reveal>
          <div className="mt-10 grid gap-3 md:grid-cols-5">
            {DOC_STYLES.map((s, i) => (
              <Reveal key={s.id} i={i}>
                <div className={`card tone-${s.tone} h-full p-4`}>
                  <Chip tone={s.tone} dot>{s.short}</Chip>
                  <h3 className="mt-3 text-[14px] font-semibold">{s.label}</h3>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{s.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* how */}
        <section id="how" className="mx-auto max-w-[1120px] scroll-mt-20 px-5 pb-24">
          <Reveal>
            <h2 className="text-center text-[30px] font-semibold tracking-[-0.03em]">How it works</h2>
          </Reveal>
          <div className="mt-10 grid gap-3 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} i={i}>
                <div className="card h-full p-5">
                  <span className="text-gradient font-mono text-[13px] font-medium">{s.n}</span>
                  <h3 className="mt-3 text-[15px] font-semibold tracking-[-0.01em]">{s.title}</h3>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-[1120px] px-5 pb-24">
          <Reveal>
            <div className="card relative overflow-hidden px-6 py-14 text-center">
              <div className="absolute inset-0 -z-10 opacity-50" style={{ background: "linear-gradient(120deg, var(--glow-a), transparent 50%, var(--glow-b))" }} />
              <h2 className="text-[28px] font-semibold tracking-[-0.03em]">Stop writing docs by hand</h2>
              <p className="mx-auto mt-2 max-w-[420px] text-[14.5px] text-muted">Your first document is one paste away.</p>
              <Link href="/workspace" className="btn btn-primary mt-6 !h-10 !px-5 !text-[14px]">
                Open the workspace <Icon.Arrow className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-3 px-5 py-6 text-[12.5px] text-subtle">
          <span className="flex items-center gap-2"><Icon.Logo className="h-4 w-4" /> CodeDocs</span>
          <span>Powered by Groq. Your history never leaves your browser.</span>
        </div>
      </footer>
    </div>
  );
}
