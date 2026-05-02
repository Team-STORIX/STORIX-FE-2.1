// Spacing scale derived from Tailwind's default 4px base (used by 2.0).
// Keys match Tailwind's numeric steps for easy cross-reference.

export const Spacing = {
  1:  4,
  2:  8,
  3:  12,
  4:  16,
  5:  20,
  6:  24,
  7:  28,
  8:  32,
  10: 40,
  12: 48,
} as const

// Named semantic aliases used across screens
export const S = {
  screenH:  Spacing[5],  // 20 — horizontal screen padding
  cardPad:  Spacing[4],  // 16 — card inner padding
  sectionV: Spacing[8],  // 32 — section vertical gap
  itemGap:  Spacing[2],  // 8  — gap between list items
  chipH:    Spacing[3],  // 12 — chip horizontal padding
  chipV:    Spacing[1],  // 4  — chip vertical padding
  inputH:   Spacing[4],  // 16 — input horizontal padding
} as const
