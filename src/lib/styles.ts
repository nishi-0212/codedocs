export type DocStyle = "full" | "readme" | "api" | "docstrings" | "architecture";
export type Tone = "lavender" | "mint" | "sky" | "peach" | "rose" | "lemon";

export const DOC_STYLES: { id: DocStyle; label: string; short: string; description: string; tone: Tone }[] = [
  { id: "full", label: "Technical doc", short: "Technical", description: "Overview, usage, full API reference, edge cases", tone: "lavender" },
  { id: "readme", label: "README", short: "README", description: "Project README with install and quick start", tone: "mint" },
  { id: "api", label: "API reference", short: "API", description: "Every public symbol: params, returns, raises", tone: "sky" },
  { id: "docstrings", label: "Inline docstrings", short: "Docstrings", description: "Your code back, with docstrings added", tone: "peach" },
  { id: "architecture", label: "Architecture overview", short: "Architecture", description: "Components, data flow, design decisions", tone: "rose" },
];

export function isDocStyle(v: unknown): v is DocStyle {
  return DOC_STYLES.some((s) => s.id === v);
}

export function styleMeta(id: string) {
  return DOC_STYLES.find((s) => s.id === id) ?? DOC_STYLES[0];
}
