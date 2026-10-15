"use client";

import { Children, isValidElement, memo, useRef, useState, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Icon } from "./icons";

function CodeBlock({ children }: { children?: ReactNode }) {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  const first = Children.toArray(children)[0];
  let lang = "";
  if (isValidElement(first)) {
    const cls = (first.props as { className?: string }).className ?? "";
    lang = /language-([\w+#-]+)/.exec(cls)?.[1] ?? "";
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(ref.current?.innerText ?? "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="code-block">
      <div className="code-head">
        <span>{lang || "text"}</span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex h-6 items-center gap-1.5 rounded px-1.5 text-[11px] text-subtle transition-colors hover:bg-hover hover:text-fg"
          aria-label="Copy code"
        >
          {copied ? <Icon.Check className="h-3 w-3 text-success" /> : <Icon.Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre ref={ref}>{children}</pre>
    </div>
  );
}

const components: Components = {
  pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
  table: ({ children }) => (
    <div className="table-wrap">
      <table>{children}</table>
    </div>
  ),
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
};

function DocViewImpl({ markdown }: { markdown: string }) {
  return (
    <article className="doc">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { detect: false, ignoreMissing: true }]]}
        components={components}
      >
        {markdown}
      </ReactMarkdown>
    </article>
  );
}

export default memo(DocViewImpl);
