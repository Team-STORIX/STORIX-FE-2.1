# STORIX-FE-2.1 Migration Notes

## Phase 7DS — Design System Extraction (2025-05)

### Source Inspected
- Repo: Team-STORIX/STORIX-FE-2.0, branch: `develop`, root: `storix-fe`
- `src/styles/globals.css` — color scale, typography utilities, font-weight variables
- `tailwind.config.ts` — semantic color variable references

---

### What Was Extracted

#### Colors (`src/theme/colors.ts`)
Full magenta and gray scales extracted verbatim from `globals.css`:

| 2.0 CSS variable      | Hex       | 2.1 token (`C.*`)                      |
|-----------------------|-----------|----------------------------------------|
| `--color-magenta-300` | `#ff4093` | `primary`                              |
| `--color-magenta-20`  | `#ffeef6` | `primaryLight`, `badgeBg`, `spoilerBg` |
| `--color-magenta-100` | `#fdbcd9` | `primaryMid`                           |
| `--color-gray-900`    | `#131112` | `text`                                 |
| `--color-gray-600`    | `#645c5f` | `textSecondary`                        |
| `--color-gray-500`    | `#847b7f` | `textMuted`                            |
| `--color-gray-200`    | `#e3dcdf` | `border`                               |
| `--color-gray-100`    | `#f2edef` | `divider`                              |
| `--color-gray-50`     | `#f9f6f7` | `bg`                                   |
| `--color-success`     | `#009126` | `activeDot`                            |
| `--color-warning`     | `#ef433e` | `error`, `liked`                       |

Named raw scales also exported: `Magenta`, `Gray`.

#### Typography (`src/theme/typography.ts`)
All 13 text utility classes mapped to RN `TextStyle` objects:
`heading1`–`heading4`, `body1Medium/Semibold/Bold`, `body2Medium/Bold`,
`caption1Medium/Extrabold`, `caption2Medium/Extrabold`, `dateText`.
Line heights: `round(fontSize × 1.4)` = `--line-height-tight: 140%`.

#### Spacing (`src/theme/spacing.ts`)
Tailwind 4px-base scale (steps 1–12) + semantic aliases (`S.screenH=20`, `S.cardPad=16`, etc.).

#### Radius (`src/theme/radius.ts`)
`xs=4`, `sm=8`, `md=12`, `lg=16`, `xl=20`, `full=9999` — mirrors Tailwind defaults.

#### Shadows (`src/theme/shadows.ts`)
`Shadow.sm/md/lg` with iOS (`shadow*`) / Android (`elevation`) platform split.

#### Barrel export (`src/theme/index.ts`)
Re-exports all tokens from a single entry point.

---

### Values That Could NOT Be Mapped Exactly

| Item | Reason |
|------|--------|
| `--color-main` / `--color-main-light` / `--color-main-dark` | In `tailwind.config.ts` but **never defined** in any CSS file — dead config, ignored. |
| `C.star` (`#f59e0b` amber) | Not present in 2.0 palette. Kept as-is. **Needs designer confirmation.** |
| SUIT Variable font | 2.0 loads `SUIT-Variable.woff2`. RN falls back to system font until asset is registered. |
| Card shadow | 2.0 uses Tailwind `shadow-sm`. `Shadow.sm` now available but not yet applied to any screen. |
| Dark mode | 2.0 has a `prefers-color-scheme: dark` block. Not implemented in 2.1 RN yet. |

---

### Biggest Visual Change — Designer Confirmation Required

**`C.primary` changed from `#5B4CF5` (placeholder purple) → `#ff4093` (2.0 magenta-300).**

All 14 Phase 7 screens/components that import `C.primary` from `src/theme/colors` will render brand magenta instead of placeholder purple. Affected elements:
- Primary buttons, chips, badges
- Avatar initials and spinner tint
- Chat bubble background
- STORIX logo text in home header
- Active/joined state indicators

---

### Phase 7 Screen Audit

| File | Was using shared theme? | Action |
|------|------------------------|--------|
| `app/(tabs)/index.tsx` | ❌ Had its own local `C` object | **Fixed** — removed local `C`, now imports from `src/theme/colors` |
| `app/works/[worksId].tsx` | ✅ | Tokens updated via colors.ts |
| `app/topicroom/[roomId].tsx` | ✅ | Tokens updated via colors.ts |
| `app/(tabs)/profile.tsx` | ✅ | Tokens updated via colors.ts |
| `app/(tabs)/two.tsx` | ✅ | Tokens updated via colors.ts |
| `src/components/works/WorksHero.tsx` | ✅ | Tokens updated |
| `src/components/works/ReviewCard.tsx` | ✅ | Tokens updated |
| `src/components/topicroom/ChatBubble.tsx` | ✅ | Tokens updated |
| `src/components/topicroom/ChatInput.tsx` | ✅ | Tokens updated |
| `src/components/topicroom/ConnectionStatusPill.tsx` | ✅ | Tokens updated |
| `src/components/topicroom/TopicRoomCard.tsx` | ✅ | Tokens updated |
| `src/components/profile/ProfileHeader.tsx` | ✅ | Tokens updated |
| `src/components/profile/ProfileStatCard.tsx` | ✅ | Tokens updated |
| `src/components/profile/ProfileMenuItem.tsx` | ✅ | Tokens updated |

No screen logic, data flow, or navigation was changed. The only structural code change was removing the duplicate local `C` in the home screen.

---

### Future Notes

- **Font**: Register `SUIT-Variable.woff2` via Expo's `useFonts` / `expo-font` to match 2.0 typography.
- **Shadows**: Apply `Shadow.sm` to cards in a dedicated polish pass once designer confirms.
- **Dark mode**: Track as a separate task — requires a second token set and a theme context provider.
- **`src/features/{domain}/`**: Migrate domain code (api/hooks/store) into `src/features/{domain}/` after MVP screens are QA-stable. Do NOT do this before the auth flow is finalized.
