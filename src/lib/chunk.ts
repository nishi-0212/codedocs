import { FILE_MARKER_SOURCE } from "./protocol";

/**
 * Splits code into chunks of at most `max` characters.
 * Prefers file boundaries (multi-file input), then blank lines, then hard cuts.
 */
export function splitIntoChunks(code: string, max: number): string[] {
  if (code.length <= max) return [code];

  // 1. Split into per-file sections.
  const starts: number[] = [];
  const re = new RegExp(FILE_MARKER_SOURCE, "gm");
  let m: RegExpExecArray | null;
  while ((m = re.exec(code))) starts.push(m.index);

  const sections: string[] = [];
  if (starts.length === 0) {
    sections.push(code);
  } else {
    if (starts[0] > 0) starts.unshift(0);
    for (let i = 0; i < starts.length; i++) {
      sections.push(code.slice(starts[i], i + 1 < starts.length ? starts[i + 1] : code.length));
    }
  }

  // 2. Break oversized sections on line boundaries.
  const pieces: string[] = [];
  for (const s of sections) {
    if (s.length <= max) pieces.push(s);
    else pieces.push(...splitLarge(s, max));
  }

  // 3. Pack pieces into chunks.
  const chunks: string[] = [];
  let cur = "";
  for (const p of pieces) {
    if (cur && cur.length + p.length > max) {
      chunks.push(cur);
      cur = "";
    }
    cur += p;
  }
  if (cur) chunks.push(cur);
  return chunks;
}

function splitLarge(section: string, max: number): string[] {
  const header = new RegExp(FILE_MARKER_SOURCE, "m").exec(section);
  const fileName = header && header.index === 0 ? header[1] : null;

  const out: string[] = [];
  let cur = "";
  const flush = () => {
    if (cur) out.push(cur);
    cur = "";
  };

  for (const rawLine of section.split("\n")) {
    // Hard-cut pathological single lines (minified code, etc.).
    const lines: string[] = [];
    if (rawLine.length >= max) {
      for (let i = 0; i < rawLine.length; i += max - 1) lines.push(rawLine.slice(i, i + max - 1));
    } else {
      lines.push(rawLine);
    }
    for (const line of lines) {
      if (cur.length + line.length + 1 > max) flush();
      cur += line + "\n";
    }
  }
  flush();

  if (fileName) {
    for (let i = 1; i < out.length; i++) {
      const marker = `===== FILE: ${fileName} (continued) =====\n`;
      out[i] = marker + out[i];
    }
  }
  return out;
}
