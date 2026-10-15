# CodeDocs

Paste code in any language, get clear technical documentation, streamed live. Built with Next.js and Groq. No database, no accounts.

## Run it

Requires Node.js 18.18 or newer.

```bash
npm install
cp .env.example .env.local     # then put your key in .env.local
npm run dev
```

Open http://localhost:3000.

Get a free Groq API key at https://console.groq.com/keys and set it in `.env.local`:

```
GROQ_API_KEY=gsk_...
```

## What it does

- Paste code, or drop one or many files onto the editor (files are combined into one document).
- Pick a documentation style:
  - **Technical doc**: overview, usage, full API reference, edge cases
  - **README**: install, quick start, usage, configuration
  - **API reference**: every public symbol with params, returns and errors
  - **Inline docstrings**: your code returned with idiomatic docstrings added
  - **Architecture overview**: components, data flow, design decisions
- Language is auto-detected (or choose one). Python, JavaScript, TypeScript, Java, C, C++, C#, Go, Rust, PHP, Ruby, Swift, Kotlin, SQL, Shell, HTML, CSS, JSON, YAML, Lua and R have syntax highlighting. Any other language still works, since the model detects it.
- Output streams as Markdown: copy it, download it as `.md`, or switch to the raw view.
- Pages: `/` landing, `/workspace` (editor + live docs), `/library` (search, filter, rename, delete), `/doc/[id]` (full-page reader with table of contents).
- Every generated doc is saved to your Library. Rename it from the sidebar (double-click or pencil), the Library cards, or the title bar. Delete has Undo, and "Clear all" empties everything after a confirmation.
- Titles come from the document's own heading unless you name it yourself.
- Docs describe the code only. There is no "suggested improvements" section.
- History is stored in your browser (localStorage). Nothing is stored on the server.
- `Ctrl/Cmd + Enter` generates, `Ctrl/Cmd + K` opens the command palette, `Esc` stops a running generation. Drag the divider to resize the panes. Dark and light themes.

## How the backend works

There is one endpoint: `POST /api/generate` in `src/app/api/generate/route.ts`.

1. Validates the request (size limit, known model and style) and applies a per-IP rate limit.
2. Splits large inputs into chunks at file or line boundaries.
3. Calls Groq's streaming chat API once per chunk and pipes the tokens straight to the browser.
4. If something fails mid-stream, a marker is appended so the UI can show a clear error.

Source code is passed to the model inside delimiters and treated strictly as material to document, so instructions hidden in the code are ignored.

## Configuration

All optional, set in `.env.local` or in your host's environment settings:

| Variable | Default | Purpose |
| --- | --- | --- |
| `GROQ_API_KEY` | none (required) | Your Groq key. Server side only, never sent to the browser. |
| `MAX_INPUT_CHARS` | `100000` | Largest input accepted per request |
| `CHUNK_CHARS` | `10000` | Characters per chunk. Raise it on a paid Groq plan. |
| `MAX_OUTPUT_TOKENS` | `4000` | Max tokens written per chunk |
| `RATE_LIMIT_PER_MIN` | `12` | Requests per minute per IP |
| `GROQ_BASE_URL` | Groq's URL | Point at a compatible proxy |

The defaults suit Groq's free tier (8K tokens per minute). Big inputs are split into chunks and may pause briefly between them while Groq's limit resets. On a paid plan, raise `CHUNK_CHARS` and `MAX_OUTPUT_TOKENS`.

### Changing models

The models in the dropdown (GPT-OSS 120B and 20B) live in `src/lib/models.ts`. Groq retires models regularly: `llama-3.3-70b-versatile` and `llama-3.1-8b-instant` were shut down on 2026-08-16. If you see "Model ... is not available", check https://console.groq.com/docs/deprecations and edit that one file.

## Deploy

**Vercel** (simplest): push to GitHub, import the repo, add `GROQ_API_KEY` as an environment variable, and deploy.

**Anywhere else**: `npm run build && npm start` runs it as a normal Node server. Behind a reverse proxy, make sure response buffering is off for `/api/generate` so tokens stream (the route already sends `X-Accel-Buffering: no` for nginx).

The in-memory rate limiter is per server instance. For a strict global limit on serverless platforms, swap `src/lib/ratelimit.ts` for a Redis-backed one.

## Project layout

```
src/
  app/
    api/generate/route.ts   the whole backend
    page.tsx                landing page
    (app)/                  workspace, library and doc/[id] routes inside the sidebar shell
    layout.tsx, globals.css root providers, design tokens and animations
  components/
    providers.tsx, app-context.tsx, workspace-context.tsx   shared state (survives page changes)
    AppShell.tsx, Sidebar.tsx, PageHeader.tsx
    Landing.tsx, WorkspaceView.tsx, LibraryView.tsx, DocPageView.tsx
    CodeEditor.tsx          CodeMirror editor (themed to match)
    DocView.tsx             streamed Markdown renderer
    CommandPalette.tsx, overlays.tsx, ui.tsx, icons.tsx
  lib/
    prompts.ts              system and user prompts for each doc style
    groq.ts                 streaming Groq client with retry on 429
    chunk.ts, ratelimit.ts, models.ts, styles.ts, languages.ts ...
```

## Notes

- The API key is read only on the server. Never prefix it with `NEXT_PUBLIC_`.
- Generated documentation comes from a language model. It is grounded in your code, but review it before publishing.
- Your code is sent to Groq for processing. Don't paste secrets or code you aren't allowed to share.
