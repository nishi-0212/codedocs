export interface Lang {
  id: string;
  label: string;
  ext: string[];
}

export const LANGUAGES: Lang[] = [
  { id: "python", label: "Python", ext: ["py", "pyw", "pyi"] },
  { id: "javascript", label: "JavaScript", ext: ["js", "jsx", "mjs", "cjs"] },
  { id: "typescript", label: "TypeScript", ext: ["ts", "tsx", "mts", "cts"] },
  { id: "java", label: "Java", ext: ["java"] },
  { id: "c", label: "C", ext: ["c", "h"] },
  { id: "cpp", label: "C++", ext: ["cpp", "cc", "cxx", "hpp", "hh"] },
  { id: "csharp", label: "C#", ext: ["cs"] },
  { id: "go", label: "Go", ext: ["go"] },
  { id: "rust", label: "Rust", ext: ["rs"] },
  { id: "php", label: "PHP", ext: ["php"] },
  { id: "ruby", label: "Ruby", ext: ["rb"] },
  { id: "swift", label: "Swift", ext: ["swift"] },
  { id: "kotlin", label: "Kotlin", ext: ["kt", "kts"] },
  { id: "sql", label: "SQL", ext: ["sql"] },
  { id: "shell", label: "Shell", ext: ["sh", "bash", "zsh"] },
  { id: "html", label: "HTML", ext: ["html", "htm"] },
  { id: "css", label: "CSS", ext: ["css", "scss"] },
  { id: "json", label: "JSON", ext: ["json"] },
  { id: "yaml", label: "YAML", ext: ["yml", "yaml"] },
  { id: "lua", label: "Lua", ext: ["lua"] },
  { id: "r", label: "R", ext: ["r"] },
];

export function languageLabel(id: string): string {
  return LANGUAGES.find((l) => l.id === id)?.label ?? id;
}

export function languageFromFilename(name: string): string | null {
  const ext = name.split(".").pop()?.toLowerCase();
  if (!ext || ext === name.toLowerCase()) return null;
  return LANGUAGES.find((l) => l.ext.includes(ext))?.id ?? null;
}

type Rule = [RegExp, number];

const RULES: Record<string, Rule[]> = {
  python: [
    [/^\s*def \w+\(.*\)\s*(->\s*[^:]+)?:/m, 3],
    [/^\s*class \w+(\(.*\))?:/m, 3],
    [/^\s*(from [\w.]+ )?import [\w., ]+$/m, 1],
    [/\bself\b/, 1],
    [/\belif\b|\bNone\b|\bTrue\b|\bFalse\b/, 1],
    [/print\(/, 1],
    [/^\s*if __name__ == ["']__main__["']/m, 4],
  ],
  typescript: [
    [/:\s*(string|number|boolean|void|any|unknown)\b/, 3],
    [/\binterface \w+\s*\{/, 3],
    [/\btype \w+\s*=/, 3],
    [/\bas (const|string|number|unknown)\b/, 2],
    [/<[A-Z]\w*(\[\])?>/, 1],
  ],
  javascript: [
    [/\b(const|let|var) \w+\s*=/, 2],
    [/=>/, 1],
    [/\bfunction\b/, 1],
    [/console\.(log|error)/, 2],
    [/\brequire\(['"]/, 2],
    [/\bexport (default|const|function|class)\b/, 2],
    [/\bimport .* from ['"]/, 2],
  ],
  java: [
    [/\bpublic (static )?(final )?(class|void|interface|enum)\b/, 3],
    [/System\.out\.print/, 3],
    [/^package [\w.]+;/m, 3],
    [/\bString\[\] \w+/, 2],
    [/@Override\b/, 2],
  ],
  c: [
    [/#include <\w+\.h>/, 3],
    [/\bint main\s*\(/, 2],
    [/\bprintf\(/, 2],
    [/\b(malloc|free|sizeof)\(/, 2],
  ],
  cpp: [
    [/#include <(iostream|vector|string|map|memory|algorithm)>/, 4],
    [/\bstd::/, 3],
    [/\b(cout|cin)\b/, 2],
    [/\btemplate\s*</, 3],
    [/\bnamespace \w+\s*\{/, 2],
  ],
  csharp: [
    [/\busing System/, 4],
    [/\bnamespace [\w.]+\s*(\{|;)/, 2],
    [/Console\.Write/, 3],
    [/\b(public|private|internal) (static )?(async )?(class|void|Task)\b/, 2],
    [/\bget;\s*(set;)?/, 3],
  ],
  go: [
    [/^package \w+$/m, 3],
    [/\bfunc (\(\w+ \*?\w+\) )?\w+\(/, 3],
    [/:=/, 2],
    [/\bfmt\.\w+/, 3],
    [/\bgo func\(/, 3],
  ],
  rust: [
    [/\bfn \w+/, 3],
    [/\blet mut\b/, 3],
    [/println!\(/, 3],
    [/\bimpl(<.*>)? \w+/, 2],
    [/\buse (std|crate)::/, 3],
  ],
  php: [
    [/<\?php/, 5],
    [/\$\w+\s*=/, 2],
    [/->\w+\(/, 1],
    [/\bfunction \w+\(.*\)\s*\{/, 1],
  ],
  ruby: [
    [/^\s*def \w+[?!]?(\(.*\))?\s*$/m, 2],
    [/^\s*end\s*$/m, 2],
    [/\bputs\b/, 2],
    [/\battr_(accessor|reader|writer)\b/, 3],
    [/\brequire ['"]/, 1],
  ],
  swift: [
    [/\bfunc \w+\(.*\)\s*->/, 3],
    [/\bimport (UIKit|SwiftUI|Foundation)\b/, 4],
    [/\bguard let\b/, 3],
    [/\blet \w+: \w+/, 2],
  ],
  kotlin: [
    [/\bfun \w+\(/, 3],
    [/\b(val|var) \w+(: \w+)? =/, 2],
    [/\bdata class\b/, 4],
    [/\bprintln\(/, 1],
  ],
  sql: [
    [/\bSELECT\b[\s\S]*\bFROM\b/i, 4],
    [/\bCREATE (TABLE|INDEX|VIEW)\b/i, 4],
    [/\bINSERT INTO\b/i, 3],
    [/\b(UPDATE|DELETE FROM)\b/i, 2],
  ],
  shell: [
    [/^#!\/(usr\/)?bin\/(env )?(ba|z)?sh/, 5],
    [/\becho ["'$]/, 2],
    [/^\s*fi\s*$/m, 2],
    [/^\s*done\s*$/m, 2],
    [/\$\{?\w+\}?/, 1],
  ],
  html: [
    [/<!DOCTYPE html>/i, 5],
    [/<html[\s>]/i, 3],
    [/<(div|span|body|head|script|section)[\s>]/i, 2],
  ],
  css: [
    [/^[.#]?[\w-]+(\s*,\s*[.#]?[\w-]+)*\s*\{[^}]*:[^}]*;/m, 3],
    [/@media\b|@keyframes\b/, 3],
  ],
  lua: [
    [/\blocal \w+\s*=/, 3],
    [/\bfunction [\w.:]+\(.*\)/, 1],
    [/^\s*end\s*$/m, 1],
    [/\bthen\b/, 1],
  ],
  r: [
    [/<-/, 3],
    [/\blibrary\(/, 3],
    [/\bdata\.frame\(/, 3],
  ],
  yaml: [
    [/^[\w-]+:\s*(\S.*)?$/m, 1],
    [/^\s+-\s+\w+:/m, 2],
  ],
};

/** Cheap heuristic language detection. Returns null when unsure. */
export function detectLanguage(code: string): string | null {
  const sample = code.slice(0, 20_000);
  if (sample.trim().length < 12) return null;

  const trimmed = sample.trim();
  if (/^[[{]/.test(trimmed)) {
    try {
      JSON.parse(code);
      return "json";
    } catch {
      /* not JSON */
    }
  }

  let best: string | null = null;
  let bestScore = 0;
  for (const [lang, rules] of Object.entries(RULES)) {
    let score = 0;
    for (const [re, w] of rules) if (re.test(sample)) score += w;
    if (score > bestScore) {
      best = lang;
      bestScore = score;
    }
  }
  // TypeScript is a superset of JS patterns: only prefer it on explicit TS signals.
  return bestScore >= 3 ? best : null;
}
