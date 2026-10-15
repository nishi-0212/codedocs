# 📄 CodeDocs — Code to Technical Documentation

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=nextdotjs)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Groq](https://img.shields.io/badge/LLM-Groq%20GPT--OSS-orange)](https://console.groq.com)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)](https://codedocs-seven.vercel.app/)

**CodeDocs** turns source code in any language into clear technical documentation: a full reference, README, API docs, inline docstrings, or an architecture overview. Output streams in live, saves to a personal library, and exports as Markdown.

👉 **[Try the Live App](https://codedocs-seven.vercel.app/)**

---

## 🎯 Why CodeDocs

Documentation is the first thing skipped and the first thing to go stale. A general chatbot gives inconsistent structure, can invent behavior the code doesn't have, and adds unrequested code reviews. CodeDocs documents only what the code does, in a fixed structure per style, with no suggestions or critique.

## 🧠 How It Works

```text
Code + style + model
        │
        ▼
POST /api/generate ──► validate ──► per-IP rate limit
        │
        ▼
split into chunks (file / line boundaries)
        │
        ▼
Groq GPT-OSS (streaming, one request per chunk)
        │
        ▼
tokens piped to the browser ──► live Markdown ──► saved to Library
```

1. The browser sends the code, the chosen style and the model to the API route.
2. The server validates size, model and style, then applies a rate limit.
3. Large inputs are split into chunks that fit the model's token budget.
4. Each chunk is streamed from Groq. Source is wrapped in delimiters and treated only as material to document, so instructions hidden in code are ignored.
5. A mid-stream failure appends an error marker so the UI shows a clear message.

## ✨ Features

- Any language, auto-detected (Python, JavaScript, TypeScript, Java, C, C++, C#, Go, Rust, PHP, Ruby, Swift, Kotlin, SQL, shell and more)
- Five styles: technical doc, README, API reference, inline docstrings, architecture overview
- Live streaming with Preview and raw Markdown views
- Multi-file input via upload or drag and drop
- Library with search, style filters, rename, delete with undo, and Clear all
- Full-page reader with a table of contents
- Command palette (`Ctrl/Cmd + K`), `Ctrl/Cmd + Enter` to generate, `Esc` to stop
- Pastel Linear-style UI with light and dark themes, responsive on mobile
- API key stays on the server, history stays in the browser

## 📁 Project Structure

```text
src/
├── app/
│   ├── api/generate/route.ts    the whole backend (streaming endpoint)
│   ├── page.tsx                 landing page
│   ├── (app)/                   /workspace, /library, /doc/[id]
│   └── layout.tsx, globals.css  providers, design tokens, animations
├── components/
│   ├── providers.tsx, app-context.tsx, workspace-context.tsx
│   ├── AppShell.tsx, Sidebar.tsx, PageHeader.tsx
│   ├── Landing.tsx, WorkspaceView.tsx, LibraryView.tsx, DocPageView.tsx
│   └── CodeEditor.tsx, DocView.tsx, CommandPalette.tsx, overlays.tsx
└── lib/
    ├── prompts.ts               prompts for each doc style
    ├── groq.ts                  streaming client with retry on 429
    └── chunk.ts, ratelimit.ts, models.ts, styles.ts, languages.ts, history.ts
```

## 🔧 Run Locally

Requires Node.js 18.18 or newer.

```bash
git clone https://github.com/nishi-0212/codedocs.git
cd codedocs
npm install
cp .env.example .env.local     # add your Groq key (https://console.groq.com/keys)
npm run dev
```

Open http://localhost:3000.

## ⚙️ Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `GROQ_API_KEY` | required | Groq key. Server side only, never `NEXT_PUBLIC_` |
| `MAX_INPUT_CHARS` | `100000` | Largest input accepted per request |
| `CHUNK_CHARS` | `10000` | Characters per chunk (raise on a paid plan) |
| `MAX_OUTPUT_TOKENS` | `4000` | Max tokens written per chunk |
| `RATE_LIMIT_PER_MIN` | `12` | Requests per minute per IP |
| `GROQ_BASE_URL` | Groq's URL | Point at a compatible proxy |

Models (GPT-OSS 120B and 20B) live in `src/lib/models.ts`. Groq retires models regularly, so update that file if one disappears.

## 🚀 Deploy

Push to GitHub, import the repo in Vercel, add `GROQ_API_KEY` as an environment variable, and deploy. Anywhere else: `npm run build && npm start`.

## 📦 Tech Stack

| Layer | Tools |
| --- | --- |
| Framework | Next.js 14 (app router), React 18, TypeScript |
| Styling | Tailwind CSS, CSS variables for theming |
| Editor and rendering | CodeMirror, react-markdown, remark-gfm, rehype-highlight |
| LLM | Groq API, GPT-OSS 120B / 20B (streaming) |
| Hosting | Vercel |

## ⚠️ Limitations

- The rate limiter is in memory, so it is per server instance (fine for a demo, not a strict global limit).
- Vercel's free plan caps a request at 60 seconds, so very large multi-chunk inputs can time out.
- Defaults fit Groq's free tier (8K tokens per minute), so big inputs may pause between chunks.
- No accounts. The Library lives in one browser's localStorage.
- Output is model-generated. Review it before publishing.
- Your code is sent to Groq. Don't paste secrets.

## 🗺️ Roadmap

- Redis-backed rate limiting
- Export to `.docx` and PDF
- Import a whole repo by URL
- Accounts and a synced Library

## About

CodeDocs: paste code in any language, get clear technical documentation in seconds.
