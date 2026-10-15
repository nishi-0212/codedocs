import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

const base = (p: P): P => ({
  width: 16,
  height: 16,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  ...p,
});

export const Icon = {
  Logo: (p: P) => (
    <svg {...base({ ...p, stroke: "none" })}>
      <rect width="16" height="16" rx="4" fill="var(--accent)" />
      <path d="M6.3 5.2 3.8 8l2.5 2.8M9.7 5.2 12.2 8l-2.5 2.8" stroke="#fff" strokeWidth="1.4" fill="none" />
    </svg>
  ),
  Plus: (p: P) => (
    <svg {...base(p)}>
      <path d="M8 3.5v9M3.5 8h9" />
    </svg>
  ),
  Search: (p: P) => (
    <svg {...base(p)}>
      <circle cx="7" cy="7" r="4.25" />
      <path d="m10.3 10.3 3 3" />
    </svg>
  ),
  Sun: (p: P) => (
    <svg {...base(p)}>
      <circle cx="8" cy="8" r="2.75" />
      <path d="M8 1.5v1.4M8 13.1v1.4M1.5 8h1.4M13.1 8h1.4M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1" />
    </svg>
  ),
  Moon: (p: P) => (
    <svg {...base(p)}>
      <path d="M13.2 9.6A5.6 5.6 0 0 1 6.4 2.8a5.6 5.6 0 1 0 6.8 6.8Z" />
    </svg>
  ),
  Copy: (p: P) => (
    <svg {...base(p)}>
      <rect x="5.25" y="5.25" width="8" height="8" rx="1.75" />
      <path d="M10.75 5.25V4A1.75 1.75 0 0 0 9 2.25H4A1.75 1.75 0 0 0 2.25 4v5A1.75 1.75 0 0 0 4 10.75h1.25" />
    </svg>
  ),
  Check: (p: P) => (
    <svg {...base(p)}>
      <path d="m3.5 8.5 3 3 6-7" />
    </svg>
  ),
  Download: (p: P) => (
    <svg {...base(p)}>
      <path d="M8 2.5v7.5M4.75 7 8 10.25 11.25 7M3 13h10" />
    </svg>
  ),
  Upload: (p: P) => (
    <svg {...base(p)}>
      <path d="M8 10.5V3M4.75 6 8 2.75 11.25 6M3 13h10" />
    </svg>
  ),
  Play: (p: P) => (
    <svg {...base({ ...p, fill: "currentColor", stroke: "none" })}>
      <path d="M5 3.4v9.2a.6.6 0 0 0 .92.5l7.2-4.6a.6.6 0 0 0 0-1l-7.2-4.6A.6.6 0 0 0 5 3.4Z" />
    </svg>
  ),
  Stop: (p: P) => (
    <svg {...base({ ...p, fill: "currentColor", stroke: "none" })}>
      <rect x="4" y="4" width="8" height="8" rx="1.5" />
    </svg>
  ),
  Trash: (p: P) => (
    <svg {...base(p)}>
      <path d="M3 4.5h10M6.5 4.5V3a.75.75 0 0 1 .75-.75h1.5A.75.75 0 0 1 9.5 3v1.5M4.5 4.5l.5 8.25a1 1 0 0 0 1 .94h4a1 1 0 0 0 1-.94l.5-8.25" />
    </svg>
  ),
  Chevron: (p: P) => (
    <svg {...base(p)}>
      <path d="m4.5 6.5 3.5 3.5 3.5-3.5" />
    </svg>
  ),
  Menu: (p: P) => (
    <svg {...base(p)}>
      <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" />
    </svg>
  ),
  Close: (p: P) => (
    <svg {...base(p)}>
      <path d="m4 4 8 8M12 4l-8 8" />
    </svg>
  ),
  File: (p: P) => (
    <svg {...base(p)}>
      <path d="M9.5 2.25H5A1.75 1.75 0 0 0 3.25 4v8A1.75 1.75 0 0 0 5 13.75h6A1.75 1.75 0 0 0 12.75 12V5.5L9.5 2.25Z" />
      <path d="M9.25 2.5V5.75h3.25" />
    </svg>
  ),
  Sparkle: (p: P) => (
    <svg {...base(p)}>
      <path d="M8 2.5 9.2 6.8 13.5 8 9.2 9.2 8 13.5 6.8 9.2 2.5 8 6.8 6.8 8 2.5Z" />
    </svg>
  ),
  Alert: (p: P) => (
    <svg {...base(p)}>
      <circle cx="8" cy="8" r="6" />
      <path d="M8 5v3.5M8 10.75v.01" />
    </svg>
  ),
  Command: (p: P) => (
    <svg {...base(p)}>
      <path d="M6 6V4a1.5 1.5 0 1 0-1.5 1.5H6m0 0h4m-4 0v4m4-4V4a1.5 1.5 0 1 1 1.5 1.5H10m0 0v4m0 0h1.5A1.5 1.5 0 1 1 10 11v-1.5m0 0H6m0 0H4.5A1.5 1.5 0 1 0 6 11V9.5" />
    </svg>
  ),
  Pencil: (p: P) => (
    <svg {...base(p)}>
      <path d="m9.9 3.6 2.5 2.5M3 13l.6-2.7a1 1 0 0 1 .27-.5l6.4-6.4a1.2 1.2 0 0 1 1.7 0l.8.8a1.2 1.2 0 0 1 0 1.7l-6.4 6.4a1 1 0 0 1-.5.27L3 13Z" />
    </svg>
  ),
  Library: (p: P) => (
    <svg {...base(p)}>
      <rect x="2.5" y="2.5" width="4.5" height="4.5" rx="1.2" />
      <rect x="9" y="2.5" width="4.5" height="4.5" rx="1.2" />
      <rect x="2.5" y="9" width="4.5" height="4.5" rx="1.2" />
      <rect x="9" y="9" width="4.5" height="4.5" rx="1.2" />
    </svg>
  ),
  Bolt: (p: P) => (
    <svg {...base(p)}>
      <path d="M8.8 2 3.5 9h4l-.8 5 5.3-7H8l.8-5Z" />
    </svg>
  ),
  Home: (p: P) => (
    <svg {...base(p)}>
      <path d="M2.75 7.2 8 2.75l5.25 4.45M4 6.4v6.1a.75.75 0 0 0 .75.75h6.5a.75.75 0 0 0 .75-.75V6.4" />
    </svg>
  ),
  Arrow: (p: P) => (
    <svg {...base(p)}>
      <path d="M3.5 8h9M8.75 4.25 12.5 8l-3.75 3.75" />
    </svg>
  ),
  ArrowLeft: (p: P) => (
    <svg {...base(p)}>
      <path d="M12.5 8h-9M7.25 4.25 3.5 8l3.75 3.75" />
    </svg>
  ),
  Panel: (p: P) => (
    <svg {...base(p)}>
      <rect x="2.25" y="3" width="11.5" height="10" rx="2" />
      <path d="M6.25 3v10" />
    </svg>
  ),
  Layers: (p: P) => (
    <svg {...base(p)}>
      <path d="m8 2.5 5.5 3-5.5 3-5.5-3 5.5-3ZM2.5 8.5 8 11.5l5.5-3M2.5 11 8 14l5.5-3" />
    </svg>
  ),
  Lock: (p: P) => (
    <svg {...base(p)}>
      <rect x="3.5" y="7" width="9" height="6.25" rx="1.75" />
      <path d="M5.5 7V5.25a2.5 2.5 0 0 1 5 0V7" />
    </svg>
  ),
  Keyboard: (p: P) => (
    <svg {...base(p)}>
      <rect x="1.75" y="3.75" width="12.5" height="8.5" rx="2" />
      <path d="M4.5 6.5h.01M7 6.5h.01M9.5 6.5h.01M11.75 6.5h.01M5 9.5h6" />
    </svg>
  ),
  Code: (p: P) => (
    <svg {...base(p)}>
      <path d="M5.75 4.5 2.5 8l3.25 3.5M10.25 4.5 13.5 8l-3.25 3.5M9 3.25 7 12.75" />
    </svg>
  ),
  Stream: (p: P) => (
    <svg {...base(p)}>
      <path d="M2.5 5h6M2.5 8h11M2.5 11h8" />
    </svg>
  ),
  Clock: (p: P) => (
    <svg {...base(p)}>
      <circle cx="8" cy="8" r="5.75" />
      <path d="M8 4.75V8l2.25 1.5" />
    </svg>
  ),
  Undo: (p: P) => (
    <svg {...base(p)}>
      <path d="M4.5 6.5h5a3 3 0 0 1 0 6H6M4.5 6.5 7 4M4.5 6.5 7 9" />
    </svg>
  ),
  External: (p: P) => (
    <svg {...base(p)}>
      <path d="M9 3h4v4M13 3 7.5 8.5M11.5 9.5v2.25a1.25 1.25 0 0 1-1.25 1.25h-5.5A1.25 1.25 0 0 1 3.5 11.75v-5.5A1.25 1.25 0 0 1 4.75 5H7" />
    </svg>
  ),
};
