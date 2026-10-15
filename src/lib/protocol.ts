// Shared between server and client.

// Appended to the text stream if something fails after streaming has started.
export const ERROR_MARKER = "\n\n⟦codedocs-error⟧";

// Multi-file input is concatenated with these header lines.
export const fileMarker = (name: string) => `===== FILE: ${name} =====`;
export const FILE_MARKER_SOURCE = "^={5} FILE: (.+?) ={5}$";

export function hasFileMarkers(code: string): boolean {
  return new RegExp(FILE_MARKER_SOURCE, "m").test(code);
}

export function listFiles(code: string): string[] {
  return Array.from(code.matchAll(new RegExp(FILE_MARKER_SOURCE, "gm")), (m) => m[1]);
}
