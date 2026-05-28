import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export const Ico = {
  search: (p: IconProps) => (<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><circle cx="7" cy="7" r="4.5"/><path d="m10.5 10.5 3 3"/></svg>),
  plus: (p: IconProps) => (<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M8 3v10M3 8h10"/></svg>),
  close: (p: IconProps) => (<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="m4 4 8 8M12 4l-8 8"/></svg>),
  sun: (p: IconProps) => (<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}><circle cx="8" cy="8" r="3"/><path d="M8 1v1.5M8 13.5V15M3.5 3.5l1 1M11.5 11.5l1 1M1 8h1.5M13.5 8H15M3.5 12.5l1-1M11.5 4.5l1-1"/></svg>),
  moon: (p: IconProps) => (<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}><path d="M13 9.5A5.5 5.5 0 0 1 6.5 3a5 5 0 0 0 1 9.9 5 5 0 0 0 5.5-3.4Z"/></svg>),
  upload: (p: IconProps) => (<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M8 2v8M5 5l3-3 3 3M3 13h10"/></svg>),
  download: (p: IconProps) => (<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M8 11V3M5 8l3 3 3-3M3 13h10"/></svg>),
  sparkle: (p: IconProps) => (<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}><path d="M8 1.5 9.2 6 13.5 7 9.2 8.2 8 12.5 6.8 8.2 2.5 7 6.8 6Z"/><path d="M12.5 11.5 13 13l1.5.5L13 14l-.5 1.5L12 14l-1.5-.5L12 13Z"/></svg>),
  bell: (p: IconProps) => (<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}><path d="M3.5 12h9L11 10V7a3 3 0 1 0-6 0v3l-1.5 2Z"/><path d="M6.5 13.5a1.5 1.5 0 0 0 3 0"/></svg>),
  compare: (p: IconProps) => (<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><rect x="2" y="3" width="5" height="10" rx="1"/><rect x="9" y="3" width="5" height="10" rx="1"/></svg>),
  send: (p: IconProps) => (<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="m2 8 12-6-4 12-2-6Z"/></svg>),
  paperclip: (p: IconProps) => (<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}><path d="m12 7-5 5a2.5 2.5 0 0 1-3.5-3.5l5.5-5.5a1.6 1.6 0 0 1 2.3 2.3L6.5 10.6a.8.8 0 0 1-1.1-1.1L10 5"/></svg>),
  check: (p: IconProps) => (<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="m3 8 3 3 7-7"/></svg>),
  trash: (p: IconProps) => (<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}><path d="M3 4.5h10M6 4.5V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5M5 4.5v8.5a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V4.5"/></svg>),
  refresh: (p: IconProps) => (<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}><path d="M3 8a5 5 0 0 1 8.5-3.5L13 6M13 3v3h-3M13 8a5 5 0 0 1-8.5 3.5L3 10M3 13v-3h3"/></svg>),
};

// Aliased export — older imports may use `Icons` (e.g. Sidebar).
export const Icons = Ico;
