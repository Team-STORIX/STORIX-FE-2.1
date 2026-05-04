// ─── Raw scales (extracted from STORIX-FE-2.0 globals.css) ──────────────────

export const Magenta = {
  900: '#96005a',
  800: '#bd0058',
  700: '#d8016f',
  600: '#e90075',
  500: '#f80078',
  400: '#ff0079',
  300: '#ff4093', // primary accent used across 2.0 UI
  200: '#ff80b3',
  100: '#fdbcd9',
  50:  '#ffe1ed',
  20:  '#ffeef6',
} as const

export const Gray = {
  900: '#131112',
  800: '#242223',
  700: '#484245',
  600: '#645c5f',
  500: '#847b7f',
  400: '#b0a5aa',
  300: '#cdc4c8',
  200: '#e3dcdf',
  100: '#f2edef',
  50:  '#f9f6f7',
} as const

// ─── Semantic tokens (used by all Phase 7 screens/components) ────────────────

export const C = {
  // ── Brand ──────────────────────────────────────────────────────────────
  primary:      Magenta[300], // #ff4093 — 2.0 primary accent
  primaryLight: Magenta[20],  // #ffeef6 — chip/badge/avatar bg tint
  primaryMid:   Magenta[100], // #fdbcd9 — stronger tint (cards, gradients)

  // ── Backgrounds ────────────────────────────────────────────────────────
  bg:      Gray[50],   // #f9f6f7 — screen background
  card:    '#ffffff',  // card/surface background
  divider: Gray[100],  // #f2edef — subtle separator

  // ── Text ───────────────────────────────────────────────────────────────
  text:          Gray[900], // #131112 — primary text
  textSecondary: Gray[600], // #645c5f — secondary text
  textMuted:     Gray[500], // #847b7f — placeholder / timestamp / hint

  // ── Border ─────────────────────────────────────────────────────────────
  border: Gray[200], // #e3dcdf — card borders, separators

  // ── Badge / chip ───────────────────────────────────────────────────────
  badgeBg:   Magenta[20],  // #ffeef6
  badgeText: Magenta[300], // #ff4093

  // ── Spoiler placeholder ────────────────────────────────────────────────
  spoilerBg: Magenta[20], // #ffeef6

  // ── Semantic ───────────────────────────────────────────────────────────
  activeDot: '#009126',  // 2.0 --color-success
  liked:     '#ef433e',  // 2.0 --color-warning (red heart)
  error:     '#ef433e',  // 2.0 --color-warning

  // ── Star rating ────────────────────────────────────────────────────────
  // Not in 2.0 palette — kept as-is; needs designer confirmation.
  star: '#f59e0b',
} as const
