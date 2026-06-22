/**
 * AI Empire — Premium Mobile Design System
 * Injected into every generated Expo app as `lib/design-system.ts`
 *
 * Stack: NativeWind (Tailwind v3) + expo-linear-gradient + expo-blur + Reanimated
 * Design language: Dark-first, App Store premium (Linear / Notion / GlanceGoals quality)
 * Strict TypeScript — zero `any`.
 */

/* ──────────────────────────────────────────────────────────────
   1. DOMAIN RESOLUTION
   ───────────────────────────────────────────────────────────── */

export type AppDomain =
  | "wellness"
  | "finance"
  | "productivity"
  | "social"
  | "creative"
  | "tech"
  | "default";

const DOMAIN_KEYWORDS: Record<Exclude<AppDomain, "default">, string[]> = {
  wellness: [
    "health","fitness","meditation","mind","yoga","sleep","calm","breath",
    "workout","gym","run","walk","diet","nutrition","water","meal","wellness",
    "therapy","mood","journal","habit","track","body","heart","stress",
  ],
  finance: [
    "money","budget","expense","invoice","receipt","crypto","stock","trade",
    "invest","bank","card","bill","tax","saving","wealth","finance","cost",
    "price","subscription","payment","loan","credit","debt","income","salary",
  ],
  productivity: [
    "task","todo","note","calendar","schedule","focus","deep work","time",
    "project","team","manage","plan","organize","remind","deadline","goal",
    "habit","routine","workflow","sync","collaborate","doc","write","email",
    "slack","meeting","call","interview","contract","claraccord","voxly",
  ],
  social: [
    "chat","message","friend","community","group","event","party","dating",
    "match","connect","network","share","post","feed","follow","club",
  ],
  creative: [
    "photo","image","video","music","draw","design","art","color","edit",
    "filter","canvas","sketch","paint","clip","song","audio","record","studio",
    "content","creator","media","gallery","portfolio",
  ],
  tech: [
    "code","dev","api","git","repo","deploy","server","cloud","ai","bot",
    "agent","automation","script","terminal","program","engineer","build",
    "review","pr","commit","merge","bug","debug","test",
  ],
};

export function resolveDomain(name: string, tagline?: string): AppDomain {
  const haystack = `${name} ${tagline ?? ""}`.toLowerCase();
  let best: AppDomain = "default";
  let bestScore = 0;
  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    const score = keywords.reduce(
      (acc, kw) => acc + (haystack.includes(kw) ? kw.length : 0),
      0
    );
    if (score > bestScore) {
      bestScore = score;
      best = domain as AppDomain;
    }
  }
  return best;
}

/* ──────────────────────────────────────────────────────────────
   2. COLOR PALETTES (raw hex values)
   ───────────────────────────────────────────────────────────── */

export interface SemanticPalette {
  /** Deepest background (behind everything) */
  background: string;
  /** Primary surface (cards, sheets) */
  surface: string;
  /** Elevated surface (modals, floating cards) */
  elevated: string;
  /** Primary brand color (CTAs, active nav) */
  primary: string;
  /** Secondary brand (accents, highlights) */
  secondary: string;
  /** Tertiary accent (badges, icons, chips) */
  accent: string;
  /** Success / positive action */
  success: string;
  /** Warning / attention */
  warning: string;
  /** Error / destructive action */
  danger: string;
  /** Main text */
  textPrimary: string;
  /** Secondary text (subtitles, captions) */
  textSecondary: string;
  /** Muted / disabled text */
  textMuted: string;
  /** Borders and dividers */
  border: string;
  /** Overlays (modals, toasts) */
  overlay: string;
  /** Inverse text (on primary buttons) */
  textInverse: string;
}

const PREMIUM_PALETTES: Record<AppDomain, SemanticPalette> = {
  wellness: {
    background: "#08140E",
    surface: "#0F2018",
    elevated: "#162D22",
    primary: "#34D399",
    secondary: "#10B981",
    accent: "#FBBF24",
    success: "#22C55E",
    warning: "#F59E0B",
    danger: "#EF4444",
    textPrimary: "#F0FDF4",
    textSecondary: "#A7F3D0",
    textMuted: "#059669",
    border: "#14532D",
    overlay: "rgba(0,0,0,0.65)",
    textInverse: "#042f2e",
  },
  finance: {
    background: "#0A0F1A",
    surface: "#111827",
    elevated: "#1A2235",
    primary: "#6366F1",
    secondary: "#4F46E5",
    accent: "#10B981",
    success: "#22C55E",
    warning: "#F59E0B",
    danger: "#EF4444",
    textPrimary: "#F8FAFC",
    textSecondary: "#94A3B8",
    textMuted: "#475569",
    border: "#1E293B",
    overlay: "rgba(0,0,0,0.70)",
    textInverse: "#FFFFFF",
  },
  productivity: {
    background: "#0B0F19",
    surface: "#111827",
    elevated: "#1A2235",
    primary: "#8B5CF6",
    secondary: "#6366F1",
    accent: "#38BDF8",
    success: "#22C55E",
    warning: "#F59E0B",
    danger: "#EF4444",
    textPrimary: "#F1F5F9",
    textSecondary: "#CBD5E1",
    textMuted: "#64748B",
    border: "#1E293B",
    overlay: "rgba(0,0,0,0.65)",
    textInverse: "#FFFFFF",
  },
  social: {
    background: "#120B1A",
    surface: "#1E1229",
    elevated: "#2A1A38",
    primary: "#EC4899",
    secondary: "#D946EF",
    accent: "#F472B6",
    success: "#22C55E",
    warning: "#F59E0B",
    danger: "#EF4444",
    textPrimary: "#FAF5FF",
    textSecondary: "#E9D5FF",
    textMuted: "#9333EA",
    border: "#4C1D95",
    overlay: "rgba(0,0,0,0.60)",
    textInverse: "#FFFFFF",
  },
  creative: {
    background: "#0F0B14",
    surface: "#1A1525",
    elevated: "#251E33",
    primary: "#F59E0B",
    secondary: "#F97316",
    accent: "#FB923C",
    success: "#22C55E",
    warning: "#EAB308",
    danger: "#EF4444",
    textPrimary: "#FAFAF9",
    textSecondary: "#D6D3D1",
    textMuted: "#78716C",
    border: "#292524",
    overlay: "rgba(0,0,0,0.65)",
    textInverse: "#1C1917",
  },
  tech: {
    background: "#050A14",
    surface: "#0B1221",
    elevated: "#111D33",
    primary: "#0EA5E9",
    secondary: "#0284C7",
    accent: "#22D3EE",
    success: "#22C55E",
    warning: "#F59E0B",
    danger: "#EF4444",
    textPrimary: "#F0F9FF",
    textSecondary: "#BAE6FD",
    textMuted: "#0369A1",
    border: "#0C4A6E",
    overlay: "rgba(0,0,0,0.70)",
    textInverse: "#0C4A6E",
  },
  default: {
    background: "#0B0F19",
    surface: "#111827",
    elevated: "#1A2235",
    primary: "#F59E0B",
    secondary: "#D97706",
    accent: "#FBBF24",
    success: "#22C55E",
    warning: "#F59E0B",
    danger: "#EF4444",
    textPrimary: "#F8FAFC",
    textSecondary: "#94A3B8",
    textMuted: "#475569",
    border: "#1E293B",
    overlay: "rgba(0,0,0,0.65)",
    textInverse: "#0F172A",
  },
};

export function getPalette(domain: AppDomain): SemanticPalette {
  return PREMIUM_PALETTES[domain] ?? PREMIUM_PALETTES.default;
}

/* ──────────────────────────────────────────────────────────────
   3. TAILWIND / NATIVEWIND THEME EXTENSION
   ───────────────────────────────────────────────────────────── */

export interface TailwindThemeExtension {
  colors: Record<string, string>;
  fontFamily: Record<string, string[]>;
  fontSize: Record<string, [string, { lineHeight: string; letterSpacing?: string }]>
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
  boxShadow: Record<string, string>;
}

export function buildTailwindExtension(domain: AppDomain): TailwindThemeExtension {
  const p = getPalette(domain);
  return {
    colors: {
      dsBackground: p.background,
      dsSurface: p.surface,
      dsElevated: p.elevated,
      dsPrimary: p.primary,
      dsSecondary: p.secondary,
      dsAccent: p.accent,
      dsSuccess: p.success,
      dsWarning: p.warning,
      dsDanger: p.danger,
      dsText: p.textPrimary,
      dsTextSecondary: p.textSecondary,
      dsTextMuted: p.textMuted,
      dsBorder: p.border,
      dsTextInverse: p.textInverse,
    },
    fontFamily: {
      sans: ["Inter", "system-ui", "sans-serif"],
      mono: ["GeistMono", "Menlo", "monospace"],
    },
    fontSize: {
      "ds-xs": ["12px", { lineHeight: "16px", letterSpacing: "0.01em" }],
      "ds-sm": ["14px", { lineHeight: "20px", letterSpacing: "0" }],
      "ds-base": ["16px", { lineHeight: "24px", letterSpacing: "-0.01em" }],
      "ds-lg": ["18px", { lineHeight: "28px", letterSpacing: "-0.02em" }],
      "ds-xl": ["20px", { lineHeight: "30px", letterSpacing: "-0.02em" }],
      "ds-2xl": ["24px", { lineHeight: "32px", letterSpacing: "-0.02em" }],
      "ds-3xl": ["30px", { lineHeight: "36px", letterSpacing: "-0.03em" }],
      "ds-4xl": ["36px", { lineHeight: "40px", letterSpacing: "-0.03em" }],
    },
    spacing: {
      "ds-1": "4px",
      "ds-2": "8px",
      "ds-3": "12px",
      "ds-4": "16px",
      "ds-5": "20px",
      "ds-6": "24px",
      "ds-8": "32px",
      "ds-10": "40px",
      "ds-12": "48px",
      "ds-16": "64px",
    },
    borderRadius: {
      "ds-sm": "6px",
      "ds-md": "10px",
      "ds-lg": "14px",
      "ds-xl": "20px",
      "ds-2xl": "28px",
      "ds-full": "9999px",
    },
    boxShadow: {
      "ds-sm": "0 1px 2px rgba(0,0,0,0.20)",
      "ds-md": "0 4px 6px rgba(0,0,0,0.25)",
      "ds-lg": "0 10px 15px rgba(0,0,0,0.30)",
      "ds-xl": "0 20px 25px rgba(0,0,0,0.35)",
    },
  };
}

/* ──────────────────────────────────────────────────────────────
   4. TYPOGRAPHY SCALE (raw values for dynamic StyleSheet use)
   ───────────────────────────────────────────────────────────── */

export interface TextStyle {
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  fontWeight:
    | "400"
    | "500"
    | "600"
    | "700"
    | "normal"
    | "bold"
    | "100"
    | "200"
    | "300"
    | "800"
    | "900";
}

export const typography = {
  xs: { fontSize: 12, lineHeight: 16, letterSpacing: 0.01, fontWeight: "400" } as TextStyle,
  sm: { fontSize: 14, lineHeight: 20, letterSpacing: 0, fontWeight: "400" } as TextStyle,
  base: { fontSize: 16, lineHeight: 24, letterSpacing: -0.01, fontWeight: "400" } as TextStyle,
  lg: { fontSize: 18, lineHeight: 28, letterSpacing: -0.02, fontWeight: "500" } as TextStyle,
  xl: { fontSize: 20, lineHeight: 30, letterSpacing: -0.02, fontWeight: "600" } as TextStyle,
  "2xl": { fontSize: 24, lineHeight: 32, letterSpacing: -0.02, fontWeight: "700" } as TextStyle,
  "3xl": { fontSize: 30, lineHeight: 36, letterSpacing: -0.03, fontWeight: "700" } as TextStyle,
  "4xl": { fontSize: 36, lineHeight: 40, letterSpacing: -0.03, fontWeight: "800" } as TextStyle,
} as const;

export type TypographyKey = keyof typeof typography;

/* ──────────────────────────────────────────────────────────────
   5. SPACING SCALE (raw dp values)
   ───────────────────────────────────────────────────────────── */

export const spacing = {
  px: 1,
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  28: 112,
  32: 128,
  36: 144,
  40: 160,
  44: 176,
  48: 192,
  52: 208,
  56: 224,
  60: 240,
  64: 256,
  72: 288,
  80: 320,
  96: 384,
} as const;

export type SpacingKey = keyof typeof spacing;

/* ──────────────────────────────────────────────────────────────
   6. SHADOWS / ELEVATION (cross-platform)
   ───────────────────────────────────────────────────────────── */

export interface ShadowSet {
  ios: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
  };
  android: { elevation: number };
}

export const shadows = {
  none: {
    ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0 },
    android: { elevation: 0 },
  } as ShadowSet,
  sm: {
    ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 },
    android: { elevation: 2 },
  } as ShadowSet,
  md: {
    ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 6 },
    android: { elevation: 4 },
  } as ShadowSet,
  lg: {
    ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15 },
    android: { elevation: 8 },
  } as ShadowSet,
  xl: {
    ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.35, shadowRadius: 25 },
    android: { elevation: 12 },
  } as ShadowSet,
  glow: (color: string) =>
    ({
      ios: {
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 12,
      },
      android: { elevation: 0 },
    } as ShadowSet),
} as const;

export type ShadowKey = keyof typeof shadows;

/* ──────────────────────────────────────────────────────────────
   7. REANIMATED SPRING PRESETS
   ───────────────────────────────────────────────────────────── */

export interface ReanimatedSpring {
  damping: number;
  stiffness: number;
  mass?: number;
  overshootClamping?: boolean;
  restDisplacementThreshold?: number;
  restSpeedThreshold?: number;
}

export const springs = {
  /** Snappy button press */
  button: { damping: 15, stiffness: 400, mass: 0.8 } as ReanimatedSpring,
  /** Card / sheet entrance */
  sheet: { damping: 25, stiffness: 250, mass: 1.0 } as ReanimatedSpring,
  /** Gentle fade / list item */
  gentle: { damping: 30, stiffness: 180, mass: 1.2 } as ReanimatedSpring,
  /** Bouncy toggle / checkbox */
  bounce: { damping: 12, stiffness: 500, mass: 0.6, overshootClamping: false } as ReanimatedSpring,
  /** Alert / toast pop */
  pop: { damping: 10, stiffness: 600, mass: 0.5, overshootClamping: true } as ReanimatedSpring,
  /** Draggable snap-back */
  snap: { damping: 20, stiffness: 300, mass: 0.9, restDisplacementThreshold: 0.01 } as ReanimatedSpring,
} as const;

export type SpringKey = keyof typeof springs;

/* ──────────────────────────────────────────────────────────────
   8. NATIVEWIND CLASSNAME HELPERS (pre-built strings)
   ───────────────────────────────────────────────────────────── */

export interface ClassNameSet {
  screen: string;
  surface: string;
  elevated: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
}

export function buildClassNames(domain: AppDomain): ClassNameSet {
  return {
    screen: "flex-1 bg-dsBackground",
    surface: "bg-dsSurface rounded-ds-xl border border-dsBorder/20",
    elevated: "bg-dsElevated rounded-ds-xl border border-dsBorder/30",
    textPrimary: "text-dsText",
    textSecondary: "text-dsTextSecondary",
    textMuted: "text-dsTextMuted",
    textInverse: "text-dsTextInverse",
  };
}

/* ──────────────────────────────────────────────────────────────
   9. COMPONENT VARIANTS
   ───────────────────────────────────────────────────────────── */

export const button = {
  /** Primary CTA — solid fill */
  primary: "bg-dsPrimary active:opacity-90 rounded-ds-lg px-ds-5 py-ds-3 items-center justify-center",
  /** Secondary — outlined */
  secondary: "bg-transparent border border-dsPrimary/40 active:bg-dsPrimary/10 rounded-ds-lg px-ds-5 py-ds-3 items-center justify-center",
  /** Ghost — minimal */
  ghost: "bg-transparent active:bg-white/5 rounded-ds-lg px-ds-5 py-ds-3 items-center justify-center",
  /** Destructive */
  danger: "bg-dsDanger/90 active:bg-dsDanger rounded-ds-lg px-ds-5 py-ds-3 items-center justify-center",
  /** Small chip */
  chip: "bg-dsSurface border border-dsBorder/20 rounded-ds-full px-ds-3 py-ds-1 items-center justify-center",
  /** Icon-only circular button */
  icon: "bg-dsElevated active:bg-dsSurface rounded-ds-full w-10 h-10 items-center justify-center",
} as const;

export type ButtonVariant = keyof typeof button;

export const card = {
  /** Default card */
  default: "bg-dsSurface rounded-ds-xl border border-dsBorder/15 p-ds-5",
  /** Interactive card (list item, tappable) */
  interactive: "bg-dsSurface rounded-ds-xl border border-dsBorder/15 p-ds-5 active:bg-dsElevated",
  /** Feature highlight / hero card */
  hero: "bg-dsElevated rounded-ds-2xl border border-dsPrimary/20 p-ds-6",
  /** Compact stat / metric card */
  metric: "bg-dsSurface rounded-ds-lg border border-dsBorder/10 p-ds-4 items-center",
  /** Input-group wrapper */
  inputGroup: "bg-dsSurface rounded-ds-lg border border-dsBorder/20 px-ds-4 py-ds-3 flex-row items-center gap-ds-3",
} as const;

export type CardVariant = keyof typeof card;

export const input = {
  /** Text input wrapper */
  default: "bg-dsSurface rounded-ds-lg border border-dsBorder/30 px-ds-4 py-ds-3 text-dsText placeholder:text-dsTextMuted",
  /** Minimal underline style */
  minimal: "bg-transparent border-b border-dsBorder/40 px-ds-1 py-ds-3 text-dsText placeholder:text-dsTextMuted",
  /** Search input with inner radius */
  search: "bg-dsElevated rounded-ds-full border border-dsBorder/20 px-ds-4 py-ds-2.5 text-dsText placeholder:text-dsTextMuted flex-row items-center gap-ds-2",
} as const;

export type InputVariant = keyof typeof input;

export const badge = {
  /** Small status pill */
  default: "bg-dsPrimary/15 rounded-ds-full px-ds-2 py-ds-1",
  /** Success status */
  success: "bg-dsSuccess/15 rounded-ds-full px-ds-2 py-ds-1",
  /** Warning status */
  warning: "bg-dsWarning/15 rounded-ds-full px-ds-2 py-ds-1",
  /** Danger status */
  danger: "bg-dsDanger/15 rounded-ds-full px-ds-2 py-ds-1",
  /** Neutral / muted */
  neutral: "bg-dsBorder/30 rounded-ds-full px-ds-2 py-ds-1",
} as const;

export type BadgeVariant = keyof typeof badge;

/* ──────────────────────────────────────────────────────────────
   10. GRADIENT PRESETS (expo-linear-gradient)
   ───────────────────────────────────────────────────────────── */

export interface GradientPreset {
  colors: readonly string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
}

export const gradients = {
  /** Subtle surface lift */
  surfaceLift: {
    colors: ["rgba(255,255,255,0.03)", "rgba(255,255,255,0)"],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  } as GradientPreset,
  /** Brand primary → secondary (horizontal) */
  brandHorizontal: (domain: AppDomain) => {
    const p = getPalette(domain);
    return {
      colors: [p.primary, p.secondary],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 0 },
    } as GradientPreset;
  },
  /** Brand primary → accent (diagonal) */
  brandDiagonal: (domain: AppDomain) => {
    const p = getPalette(domain);
    return {
      colors: [p.primary, p.accent],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    } as GradientPreset;
  },
  /** Danger / destructive fade */
  dangerFade: {
    colors: ["#EF4444", "#B91C1C"],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  } as GradientPreset,
  /** Dark overlay for image backgrounds */
  darkOverlay: {
    colors: ["rgba(0,0,0,0.10)", "rgba(0,0,0,0.70)"],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  } as GradientPreset,
} as const;

/* ──────────────────────────────────────────────────────────────
   11. FULL THEME FACTORY
   ───────────────────────────────────────────────────────────── */

export interface FullTheme {
  domain: AppDomain;
  palette: SemanticPalette;
  classNames: ClassNameSet;
  tailwind: TailwindThemeExtension;
  springs: typeof springs;
  shadows: typeof shadows;
  typography: typeof typography;
  spacing: typeof spacing;
  button: typeof button;
  card: typeof card;
  input: typeof input;
  badge: typeof badge;
  gradients: typeof gradients;
}

export function createTheme(name: string, tagline?: string): FullTheme {
  const domain = resolveDomain(name, tagline);
  const palette = getPalette(domain);
  const tailwind = buildTailwindExtension(domain);
  const classNames = buildClassNames(domain);
  return {
    domain,
    palette,
    classNames,
    tailwind,
    springs,
    shadows,
    typography,
    spacing,
    button,
    card,
    input,
    badge,
    gradients,
  };
}

/* ──────────────────────────────────────────────────────────────
   12. UTILITY HELPERS
   ───────────────────────────────────────────────────────────── */

/** hex + alpha → rgba string */
export function hexToRgba(hex: string, alpha: number): string {
  const sanitized = hex.replace("#", "");
  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Returns palette color with reduced opacity for pressed states */
export function pressedColor(hex: string, opacity = 0.75): string {
  return hexToRgba(hex, opacity);
}

/** Quick style object for Reanimated `useAnimatedStyle` */
export function makeSpringStyle(
  springKey: SpringKey,
  transform: Record<string, number | string>
) {
  return {
    transform: Object.entries(transform).map(([key, value]) => ({
      [key]: value,
    })),
    // Consumers apply `withSpring(value, springs[springKey])` in Reanimated
  };
}

/* ──────────────────────────────────────────────────────────────
   13. DARK MODE (system-aware hook wrapper)
   ───────────────────────────────────────────────────────────── */

// react-native must be required lazily: tailwind.config.js loads this file in
// a plain Node process at build-config time (via jiti/sucrase), and an eager
// `import ... from "react-native"` drags in RN's Flow-typed source which that
// parser cannot read — killing `expo export` and Metro for the whole app.
export function useThemeMode(): "dark" | "light" {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useColorScheme } = require("react-native") as typeof import("react-native");
  const scheme = useColorScheme();
  return scheme === "light" ? "light" : "dark";
}

/** The design system is dark-first; light tokens are derived. */
export function getLightTokens(domain: AppDomain): SemanticPalette {
  const dark = getPalette(domain);
  return {
    ...dark,
    background: "#FFFFFF",
    surface: "#F8FAFC",
    elevated: "#FFFFFF",
    textPrimary: "#0F172A",
    textSecondary: "#475569",
    textMuted: "#94A3B8",
    border: "#E2E8F0",
    overlay: "rgba(15,23,42,0.40)",
    textInverse: dark.textPrimary,
  };
}

/* ──────────────────────────────────────────────────────────────
   EXPORTS
   ───────────────────────────────────────────────────────────── */

export {
  PREMIUM_PALETTES,
  DOMAIN_KEYWORDS,
};
