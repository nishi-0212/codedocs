// Minimal streaming client for Groq's OpenAI-compatible chat completions API.
// No SDK needed: one fetch call and an SSE parser.

export class GroqError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.name = "GroqError";
    this.status = status;
  }
}

export interface StreamOptions {
  model: string;
  system: string;
  user: string;
  maxTokens: number;
  signal?: AbortSignal;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException("Aborted", "AbortError"));
    const t = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(t);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

async function toError(res: Response, model: string): Promise<GroqError> {
  let detail = "";
  try {
    const text = await res.text();
    try {
      detail = JSON.parse(text)?.error?.message ?? text;
    } catch {
      detail = text;
    }
  } catch {
    /* ignore */
  }
  detail = String(detail).slice(0, 300);

  const modelGone = () =>
    new GroqError(
      `Model "${model}" is not available on Groq (it may have been retired). Pick another model in the dropdown, or update src/lib/models.ts using https://console.groq.com/docs/deprecations`,
      502,
    );

  switch (res.status) {
    case 401:
      return new GroqError("Groq rejected the API key. Check GROQ_API_KEY in your environment.", 502);
    case 404:
      return modelGone();
    case 400:
      if (/decommission|no longer supported|deprecated|does not exist/i.test(detail)) return modelGone();
      return new GroqError(`Groq rejected the request: ${detail || "bad request"}`, 502);
    case 413:
      return new GroqError("This input is too large for the selected model. Try a smaller file or set a smaller CHUNK_CHARS.", 413);
    case 429:
      return new GroqError(
        "Groq rate limit reached. Wait a few seconds and try again, or lower CHUNK_CHARS if you are on the free tier.",
        429,
      );
    default:
      return new GroqError(`Groq returned ${res.status}${detail ? `: ${detail}` : ""}`, 502);
  }
}

export async function* streamCompletion(opts: StreamOptions): AsyncGenerator<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    throw new GroqError("The server is missing GROQ_API_KEY. Add it to .env.local and restart.", 500);
  }
  const base = (process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1").replace(/\/+$/, "");

  const payload: Record<string, unknown> = {
    model: opts.model,
    stream: true,
    temperature: 0.2,
    max_tokens: opts.maxTokens,
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user },
    ],
  };
  // GPT-OSS models are reasoning models: keep thinking short so the first token
  // arrives quickly, and don't stream the reasoning text.
  if (opts.model.startsWith("openai/gpt-oss")) {
    payload.reasoning_effort = "low";
    payload.include_reasoning = false;
  }
  const body = JSON.stringify(payload);

  let res: Response;
  for (let attempt = 0; ; attempt++) {
    try {
      res = await fetch(`${base}/chat/completions`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
        body,
        signal: opts.signal,
      });
    } catch (e) {
      if ((e as Error)?.name === "AbortError") throw e;
      throw new GroqError("Could not reach Groq. Check your network connection.", 502);
    }
    if (res.status === 429 && attempt < 3) {
      const ra = parseFloat(res.headers.get("retry-after") ?? "");
      const waitSec = Math.min(Number.isFinite(ra) && ra > 0 ? ra : 6 * (attempt + 1), 25);
      await res.body?.cancel().catch(() => {});
      await sleep(waitSec * 1000, opts.signal);
      continue;
    }
    break;
  }

  if (!res.ok) throw await toError(res, opts.model);
  if (!res.body) throw new GroqError("Groq returned an empty response.", 502);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });

      let nl: number;
      while ((nl = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (data === "[DONE]") return;

        let json: { choices?: { delta?: { content?: string } }[]; error?: { message?: string } };
        try {
          json = JSON.parse(data);
        } catch {
          continue;
        }
        if (json.error) throw new GroqError(json.error.message ?? "Groq stream error", 502);
        const text = json.choices?.[0]?.delta?.content;
        if (text) yield text;
      }
    }
  } finally {
    reader.releaseLock?.();
  }
}
