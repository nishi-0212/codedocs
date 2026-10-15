// Models offered in the UI. The server only accepts ids from this list.
//
// Groq retires models regularly (llama-3.3-70b-versatile and llama-3.1-8b-instant
// were shut down on 2026-08-16). If you see "Model ... is not available", check
//   https://console.groq.com/docs/deprecations
// and update the ids below.
export const MODELS = [
  { id: "openai/gpt-oss-120b", label: "GPT-OSS 120B", hint: "Best quality" },
  { id: "openai/gpt-oss-20b", label: "GPT-OSS 20B", hint: "Fastest" },
] as const;

export const DEFAULT_MODEL: string = MODELS[0].id;

export function isModel(v: unknown): v is string {
  return typeof v === "string" && MODELS.some((m) => m.id === v);
}
