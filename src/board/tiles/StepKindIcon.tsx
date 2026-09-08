/**
 * Task icons for Step tiles.
 * Cream / blue / ink only — yellow is reserved for inspector and view selection.
 */
import type { ReactNode } from "react";
import { StepKind, type StepKind as StepKindT } from "../../workflow/catalogs";

const ink = "var(--ink)";
const blue = "var(--blue)";
const cream = "var(--cream)";

/** Shared frame so every task icon sits on the same grid. */
function IconShell({ children, size = 52 }: { children: ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 52 52" fill="none" aria-hidden>
      {children}
    </svg>
  );
}

export function StepKindIcon({ kind, size = 52 }: { kind: StepKindT; size?: number }) {
  const icons: Record<StepKindT, ReactNode> = {
    [StepKind.Read]: (
      <IconShell size={size}>
        <rect x="12" y="8" width="28" height="36" rx="3" fill={blue} stroke={ink} strokeWidth="2" />
        <rect x="17" y="5" width="18" height="8" rx="2" fill={blue} stroke={ink} strokeWidth="2" />
        <path d="M18 22 H34 M18 28 H34 M18 34 H28" stroke={cream} strokeWidth="2.2" strokeLinecap="round" />
      </IconShell>
    ),
    [StepKind.Search]: (
      <IconShell size={size}>
        <circle cx="22" cy="22" r="11" fill={cream} stroke={blue} strokeWidth="3.2" />
        <path d="M30 30 L40 41" stroke={blue} strokeWidth="4" strokeLinecap="round" />
      </IconShell>
    ),
    [StepKind.Write]: (
      <IconShell size={size}>
        <rect x="8" y="14" width="36" height="22" rx="3" fill={cream} stroke={ink} strokeWidth="2" />
        <rect x="12" y="18" width="28" height="14" rx="1.5" fill={blue} />
        <circle cx="16" cy="25" r="1.4" fill={cream} />
        <circle cx="21" cy="25" r="1.4" fill={cream} />
        <circle cx="26" cy="25" r="1.4" fill={cream} />
        <path d="M16 38 H36" stroke={ink} strokeWidth="3" strokeLinecap="round" />
      </IconShell>
    ),
    [StepKind.Review]: (
      <IconShell size={size}>
        <rect x="12" y="8" width="28" height="36" rx="3" fill={cream} stroke={ink} strokeWidth="2" />
        <path d="M18 26 L24 32 L36 16" stroke={blue} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </IconShell>
    ),
    [StepKind.Copy]: (
      <IconShell size={size}>
        <rect x="14" y="12" width="22" height="28" rx="2" fill={cream} stroke={ink} strokeWidth="2" />
        <rect x="20" y="8" width="22" height="28" rx="2" fill={blue} stroke={ink} strokeWidth="2" />
      </IconShell>
    ),
    [StepKind.Print]: (
      <IconShell size={size}>
        <rect x="10" y="20" width="32" height="16" rx="2" fill={blue} stroke={ink} strokeWidth="2" />
        <rect x="16" y="10" width="20" height="12" fill={cream} stroke={ink} strokeWidth="2" />
        <rect x="16" y="30" width="20" height="12" fill={cream} stroke={ink} strokeWidth="2" />
      </IconShell>
    ),
    [StepKind.Email]: (
      <IconShell size={size}>
        <rect x="8" y="14" width="36" height="24" rx="3" fill={cream} stroke={ink} strokeWidth="2" />
        <path d="M10 16 L26 28 L42 16" stroke={blue} strokeWidth="2.2" strokeLinejoin="round" />
      </IconShell>
    ),
    [StepKind.Drag]: (
      <IconShell size={size}>
        <rect x="14" y="12" width="24" height="18" rx="2" fill={cream} stroke={ink} strokeWidth="2" />
        <path d="M26 30 V42 M20 36 L26 42 L32 36" stroke={blue} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </IconShell>
    ),
    [StepKind.Scan]: (
      <IconShell size={size}>
        <rect x="10" y="14" width="32" height="24" rx="3" fill={cream} stroke={ink} strokeWidth="2" />
        <path d="M10 26 H42" stroke={blue} strokeWidth="3" />
        <path d="M16 12 V8 M36 12 V8 M16 40 V44 M36 40 V44" stroke={ink} strokeWidth="2" strokeLinecap="round" />
      </IconShell>
    ),
    [StepKind.Approve]: (
      <IconShell size={size}>
        <circle cx="26" cy="26" r="16" fill={cream} stroke={ink} strokeWidth="2" />
        <path d="M18 27 L24 33 L36 19" stroke={blue} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </IconShell>
    ),
    [StepKind.Call]: (
      <IconShell size={size}>
        <rect x="16" y="8" width="20" height="36" rx="4" fill={blue} stroke={ink} strokeWidth="2" />
        <circle cx="26" cy="38" r="2" fill={cream} />
        <rect x="20" y="12" width="12" height="18" rx="1" fill={cream} />
      </IconShell>
    ),
    [StepKind.File]: (
      <IconShell size={size}>
        <path d="M14 10 H30 L40 20 V42 H14 Z" fill={cream} stroke={ink} strokeWidth="2" />
        <path d="M30 10 V20 H40" stroke={ink} strokeWidth="2" />
      </IconShell>
    ),
    [StepKind.Other]: (
      <IconShell size={size}>
        <rect x="9" y="10" width="34" height="36" rx="4" fill={cream} stroke={ink} strokeWidth="2" />
        <rect x="17" y="6" width="18" height="10" rx="3" fill={blue} stroke={ink} strokeWidth="2" />
        <rect x="22" y="8.5" width="8" height="5" rx="1.5" fill={cream} />
        <path
          d="M16 24 H36 M16 32 H36 M16 40 H28"
          stroke={blue}
          strokeWidth="2.8"
          strokeLinecap="round"
        />
      </IconShell>
    ),
  };
  return <>{icons[kind]}</>;
}
