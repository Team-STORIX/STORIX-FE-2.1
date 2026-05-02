import type { TextStyle } from 'react-native'

// ─── Font weights (from 2.0 globals.css CSS variables) ───────────────────────

export const FontWeight = {
  medium:    '500' as TextStyle['fontWeight'],
  semibold:  '600' as TextStyle['fontWeight'],
  bold:      '700' as TextStyle['fontWeight'],
  extrabold: '800' as TextStyle['fontWeight'],
}

// ─── Line heights ─────────────────────────────────────────────────────────────
// 2.0 uses --line-height-tight: 140% across all type styles.
// In RN lineHeight is absolute (px), so we derive per font size: round(size * 1.4).

// ─── Named text styles (mirrors 2.0 .heading-* / .body-* / .caption-* classes) ─

export const Typography = {
  heading1:        { fontSize: 24, fontWeight: FontWeight.bold,      lineHeight: 34 } as TextStyle,
  heading2:        { fontSize: 20, fontWeight: FontWeight.bold,      lineHeight: 28 } as TextStyle,
  heading3:        { fontSize: 18, fontWeight: FontWeight.bold,      lineHeight: 26 } as TextStyle,
  heading4:        { fontSize: 16, fontWeight: FontWeight.semibold,  lineHeight: 22 } as TextStyle,

  body1Medium:     { fontSize: 16, fontWeight: FontWeight.medium,    lineHeight: 22 } as TextStyle,
  body1Semibold:   { fontSize: 16, fontWeight: FontWeight.semibold,  lineHeight: 22 } as TextStyle,
  body1Bold:       { fontSize: 16, fontWeight: FontWeight.bold,      lineHeight: 22 } as TextStyle,

  body2Medium:     { fontSize: 14, fontWeight: FontWeight.medium,    lineHeight: 20 } as TextStyle,
  body2Bold:       { fontSize: 14, fontWeight: FontWeight.bold,      lineHeight: 20 } as TextStyle,

  caption1Medium:     { fontSize: 12, fontWeight: FontWeight.medium,    lineHeight: 17 } as TextStyle,
  caption1Extrabold:  { fontSize: 12, fontWeight: FontWeight.extrabold, lineHeight: 17 } as TextStyle,

  caption2Medium:     { fontSize: 10, fontWeight: FontWeight.medium,    lineHeight: 14 } as TextStyle,
  caption2Extrabold:  { fontSize: 10, fontWeight: FontWeight.extrabold, lineHeight: 14 } as TextStyle,

  // 2.0 .date-text — 16px bold, rendered in gray-500
  dateText:        { fontSize: 16, fontWeight: FontWeight.bold,      lineHeight: 22 } as TextStyle,
} as const
