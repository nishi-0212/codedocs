import { splitIntoChunks } from "../../../lib/chunk";
import { GroqError, streamCompletion } from "../../../lib/groq";
import { isModel, DEFAULT_MODEL } from "../../../lib/models";
import { buildSystemPrompt, buildUserPrompt } from "../../../lib/prompts";
import { ERROR_MARKER, listFiles } from "../../../lib/protocol";
import { rateLimit } from "../../../lib/ratelimit";
import { isDocStyle } from "../../../lib/styles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const envInt = (name: string, fallback: number) => {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
};

function json(body: unknown, status: number, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store", ...headers },
  });
}

export async function POST(req: Request) {
  // ---- rate limit
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = fwd || req.headers.get("x-real-ip") || "local";
  const rl = rateLimit(ip, envInt("RATE_LIMIT_PER_MIN", 12));
  if (!rl.ok) {
    return json({ error: `Too many requests. Try again in ${rl.retryAfter}s.` }, 429, {
      "retry-after": String(rl.retryAfter),
    });
  }

  // ---- parse + validate
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const code = typeof body.code === "string" ? body.code.replace(/\r\n/g, "\n") : "";
  if (!code.trim()) return json({ error: "Paste or upload some code first." }, 400);

  const maxInput = envInt("MAX_INPUT_CHARS", 100_000);
  if (code.length > maxInput) {
    return json(
      { error: `Input is too large (${code.length.toLocaleString()} characters). The limit is ${maxInput.toLocaleString()}.` },
      413,
    );
  }

  const style = isDocStyle(body.style) ? body.style : "full";
  const model = isModel(body.model) ? body.model : DEFAULT_MODEL;
  const language =
    typeof body.language === "string" && /^[\w+#.\- ]{1,40}$/.test(body.language) ? body.language : "auto";

  if (!process.env.GROQ_API_KEY) {
    return json({ error: "The server is missing GROQ_API_KEY. Add it to .env.local and restart." }, 500);
  }

  // ---- plan
  // Defaults fit Groq's free tier (8K tokens/minute). Raise via env on a paid plan.
  const chunkBase = envInt("CHUNK_CHARS", 10_000);
  const chunkChars = style === "docstrings" ? Math.min(chunkBase, 7_000) : chunkBase;
  const maxTokens = envInt("MAX_OUTPUT_TOKENS", 4000);
  const chunks = splitIntoChunks(code, chunkChars);
  const files = listFiles(code);
  const system = buildSystemPrompt(style);

  // ---- stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (s: string) => {
        try {
          controller.enqueue(encoder.encode(s));
        } catch {
          /* client went away */
        }
      };
      try {
        for (let i = 0; i < chunks.length; i++) {
          if (req.signal.aborted) break;
          if (i > 0) send("\n\n---\n\n");
          const user = buildUserPrompt({
            code: chunks[i],
            language,
            style,
            files,
            part: i + 1,
            total: chunks.length,
          });
          for await (const delta of streamCompletion({ model, system, user, maxTokens, signal: req.signal })) {
            send(delta);
          }
        }
      } catch (e) {
        if (!req.signal.aborted) {
          const msg =
            e instanceof GroqError ? e.message : "Something went wrong while generating the documentation.";
          send(ERROR_MARKER + msg);
        }
      } finally {
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store, no-transform",
      "x-accel-buffering": "no",
    },
  });
}
