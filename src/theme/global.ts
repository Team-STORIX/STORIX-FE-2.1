// src/theme/global.ts
// React Native equivalent of globals.css — single source of truth for all design tokens.
// Import from here, or use the barrel: import { C, Typography, ... } from '../theme'

import type { TextStyle, ViewStyle } from "react-native";
import { Platform } from "react-native";

// ─── Color scale ──────────────────────────────────────────────────────────────
// 2.0 globals.css: --color-magenta-* / --color-gray-*

export const Magenta = {
  900: "#96005a",
  800: "#bd0058",
  700: "#d8016f",
  600: "#e90075",
  500: "#f80078",
  400: "#ff0079",
  300: "#ff4093",
  200: "#ff80b3",
  100: "#fdbcd9",
  50: "#ffe1ed",
  20: "#ffeef6",
} as const;

export const Gray = {
  900: "#131112",
  800: "#242223",
  700: "#484245",
  600: "#645c5f",
  500: "#847b7f",
  400: "#b0a5aa",
  300: "#cdc4c8",
  200: "#e3dcdf",
  100: "#f2edef",
  50: "#f9f6f7",
} as const;

// ─── Semantic color tokens ────────────────────────────────────────────────────
// 2.0 globals.css: body { background, color } + component-level CSS variables

export const C = {
  // Brand
  primary: Magenta[300], // #ff4093
  primaryLight: Magenta[20], // #ffeef6
  primaryMid: Magenta[100], // #fdbcd9

  // Backgrounds
  bg: Gray[50], // #f9f6f7 — screen background
  card: "#ffffff", // card / surface
  black: "#000000", // intentional pure-black surface (preference screens, dark buttons)
  divider: Gray[100], // #f2edef — subtle separator

  // Text
  text: Gray[900], // #131112
  textSecondary: Gray[600], // #645c5f
  textMuted: Gray[300], // #cdc4c8 — placeholder / hint / timestamp

  // Borders
  border: Gray[200], // #e3dcdf

  // Badge / chip
  badgeBg: Magenta[20], // #ffeef6
  badgeText: Magenta[300], // #ff4093

  // Spoiler placeholder
  spoilerBg: Magenta[20],

  // Semantic
  activeDot: "#009126", // --color-success
  liked: "#ef433e", // --color-warning (red heart)
  error: "#ef433e",

  // Star rating
  star: "#f59e0b",
} as const;

// ─── Font weights ─────────────────────────────────────────────────────────────
// 2.0 globals.css: --font-weight-medium/semibold/bold/extrabold

export const FontWeight = {
  medium: "500" as TextStyle["fontWeight"],
  semibold: "600" as TextStyle["fontWeight"],
  bold: "700" as TextStyle["fontWeight"],
  extrabold: "800" as TextStyle["fontWeight"],
};

export const FontFamily = {
  regular: "SUITRegular",
  medium: "SUITMedium",
  semibold: "SUITSemiBold",
  bold: "SUITBold",
  extrabold: "SUITExtraBold",
} as const;

// ─── Typography scale ─────────────────────────────────────────────────────────
// 2.0 globals.css: .heading-* / .body-* / .caption-* utility classes
// lineHeight = round(fontSize × 1.4)  (2.0 --line-height-tight: 140%)

export const Typography = {
  heading1: {
    fontFamily: FontFamily.bold,
    fontSize: 24,
    lineHeight: 34,
  } as TextStyle,
  heading2: {
    fontFamily: FontFamily.bold,
    fontSize: 20,
    lineHeight: 28,
  } as TextStyle,
  heading3: {
    fontFamily: FontFamily.semibold,
    fontSize: 18,
    lineHeight: 26,
  } as TextStyle,
  heading4: {
    fontFamily: FontFamily.semibold,
    fontSize: 16,
    lineHeight: 22,
  } as TextStyle,

  body1Medium: {
    fontFamily: FontFamily.medium,
    fontSize: 16,
    lineHeight: 22,
  } as TextStyle,
  body1Semibold: {
    fontFamily: FontFamily.semibold,
    fontSize: 16,
    lineHeight: 22,
  } as TextStyle,
  body1Bold: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    lineHeight: 22,
  } as TextStyle,

  body2Medium: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
  } as TextStyle,
  body2Bold: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    lineHeight: 20,
  } as TextStyle,

  caption1Medium: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    lineHeight: 17,
  } as TextStyle,
  caption1Semibold: {
    fontFamily: FontFamily.semibold,
    fontSize: 12,
    lineHeight: 17,
  } as TextStyle,
  caption1Extrabold: {
    fontFamily: FontFamily.extrabold,
    fontSize: 12,
    lineHeight: 17,
  } as TextStyle,

  caption2Medium: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    lineHeight: 14,
  } as TextStyle,
  caption2Extrabold: {
    fontFamily: FontFamily.extrabold,
    fontSize: 10,
    lineHeight: 14,
  } as TextStyle,

  // 2.0 .date-text
  dateText: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    lineHeight: 22,
    color: Gray[500],
  } as TextStyle,
} as const;

// ─── Spacing scale ────────────────────────────────────────────────────────────
// 2.0: Tailwind default 4px base (space-1=4px, space-2=8px, …)

export const Spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
} as const;

// Named semantic aliases
export const S = {
  screenH: Spacing[5], // 20 — horizontal screen padding
  cardPad: Spacing[4], // 16 — card inner padding
  sectionV: Spacing[8], // 32 — section vertical gap
  itemGap: Spacing[2], // 8  — gap between list items
  chipH: Spacing[3], // 12 — chip horizontal padding
  chipV: Spacing[1], // 4  — chip vertical padding
  inputH: Spacing[4], // 16 — input horizontal padding
} as const;

// ─── Border radius ────────────────────────────────────────────────────────────
// 2.0: Tailwind rounded-* classes

export const Radius = {
  xs: 4, // rounded
  sm: 8, // rounded-lg
  md: 12, // rounded-xl
  lg: 16, // rounded-2xl
  xl: 20,
  full: 9999, // rounded-full
} as const;

// ─── Shadows ──────────────────────────────────────────────────────────────────
// 2.0: Tailwind shadow-sm / shadow / shadow-md classes (platform-split for RN)

function makeShadow(
  elevation: number,
  opacity: number,
  radius: number,
  offsetY: number,
): ViewStyle {
  if (Platform.OS === "android") return { elevation };
  return {
    shadowColor: "#000",
    shadowOpacity: opacity,
    shadowRadius: radius,
    shadowOffset: { width: 0, height: offsetY },
  };
}

export const Shadow = {
  none: {} as ViewStyle,
  sm: makeShadow(1, 0.05, 2, 1), // tailwind shadow-sm
  md: makeShadow(3, 0.08, 6, 2), // tailwind shadow
  lg: makeShadow(6, 0.1, 12, 4), // tailwind shadow-md
} as const;
