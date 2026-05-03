# MIGRATION_UI_PARITY_PLAN.md
# STORIX-FE-2.0 → 2.1 UI Parity Plan

Generated: 2026-05-03  
Status: Phase UI-0 complete — ready for page-by-page implementation

---

## Overview

STORIX-FE-2.0 is a Next.js web app designed for iPhone 16 (393px wide container).  
STORIX-FE-2.1 is an Expo React Native app targeting iOS and Android.

The goal is **visual parity** — screens should look and feel identical to 2.0, adapted for native mobile rendering constraints.

---

## Design System Alignment Status

| Token category | 2.0 source | 2.1 file | Status |
|---|---|---|---|
| Colors (Magenta + Gray scales) | globals.css `:root` vars | src/theme/colors.ts | **COMPLETE — exact match** |
| Semantic color tokens (C.*) | globals.css + component usage | src/theme/colors.ts | **COMPLETE** |
| Typography scale (heading/body/caption) | globals.css `.heading-*` etc. | src/theme/typography.ts | **COMPLETE** |
| Line height (140%) | `--line-height-tight: 140%` | Derived per-size in typography.ts | **COMPLETE** |
| Font weights (medium/semibold/bold/extrabold) | CSS vars | FontWeight object | **COMPLETE** |
| Spacing scale (Tailwind 4px base) | Tailwind default | src/theme/spacing.ts | **COMPLETE** |
| Border radius | Tailwind + inline classes | src/theme/radius.ts | **COMPLETE** |
| Shadows | Tailwind shadow utilities | src/theme/shadows.ts | **COMPLETE** |
| **SUIT Variable font** | `src/app/fonts/SUIT-Variable.woff2` | **MISSING — needs TTF** | **PENDING** |

**One outstanding token gap:** Font family. All 2.0 text is SUIT Variable. All 2.1 text is system default. Download SUIT-Variable.ttf and wire up expo-font before final UI review.

---

## UI Pattern Inventory

### 2.0 Patterns → RN Equivalents

| 2.0 pattern | 2.0 implementation | RN equivalent | notes |
|---|---|---|---|
| Bottom navigation | `NavBar.tsx` with 4 tabs + center plus button | Expo Router `Tabs` | 2.0 has custom wave SVG background behind nav — recreate with `react-native-svg` or `LinearGradient` |
| Board/feed card | `BoardCard.tsx` (div + Tailwind) | RN `View` + `StyleSheet` | Already partially in app/(tabs)/index.tsx `FeedCard` — needs like/dislike toggle, 3-dot menu, image strip |
| Post card (review) | `PostCard.tsx` | RN `Pressable` + `View` | Star rating display, works thumbnail, hashtag chips |
| Hashtag chip | `HashtagChip.tsx`, `HashtagList.tsx` | RN `Text` in `View` | Simple `px-2 py-1 rounded` chip with border |
| Search bar | `SearchBar.tsx` | RN `TextInput` in `View` | Magnifier icon left, clear button right |
| Tabs (filter row) | `Tabs.tsx` | `ScrollView horizontal` + `Pressable` | Underline on active tab |
| Hot feed slider | `HotFeedSlider.tsx` + `HotFeedCard.tsx` | `FlatList horizontal` | Auto-scroll with `setInterval` or `react-native-reanimated` |
| TopicRoom cover card | `TopicroomCoverCard.tsx` | `Pressable` + `Image` | Thumbnail bg with overlay text |
| TopicRoom cover slider | `TopicRoomCoverSlider.tsx` | `FlatList horizontal` | |
| Bottom sheet | `ReviewWriteBottomSheet.tsx` etc. | `Modal` + animated `translateY` or `@gorhom/bottom-sheet` | 2.0 uses custom animated divs |
| Rating input | `RatingInput.tsx` | Custom `Pressable` star row | 5 stars, half-star support |
| Empty state | `Warining.tsx` | `View` + `Text` + optional `Image` | SVG illustration above text |
| Loading state | Tailwind spinner | `ActivityIndicator` | Already used in all 2.1 screens |
| Context menu (3-dot) | Inline `div` absolutely positioned | `Modal` or custom overlay `View` | |
| Spoiler reveal | blur + opacity CSS + button overlay | `blur` not in RN — use opaque overlay `View` instead | |
| Notification badge | `TopNotifyNavigation.tsx` | Custom badge on tab icon | |
| Profile avatar | `<Image>` with fallback | `expo-image` + initial letter fallback | Already in all 2.1 screens |
| Works thumbnail | `<Image fill>` in 62×83 container | `expo-image` in fixed-size `View` | |
| Platform logo | `<Image>` | `expo-image` from `assets/images/platforms/` | |
| Progress indicator | SVG dots | `View` dots or SVG images | Use `assets/onboarding/progress-indicater-*.svg` |
| Genre card (onboarding) | `PreferenceCard.tsx` with SVG illustration | `Pressable` + `Image` from `assets/onboarding/` | |
| Section header | `<h2>` with border-bottom | `View` with `borderBottomWidth` or just `Text` | |

### Known RN Differences

| 2.0 feature | RN difference | resolution |
|---|---|---|
| CSS `blur-md opacity-10` on spoiler | No CSS filter in RN | Use solid `View` overlay with `backgroundColor: C.spoilerBg, opacity: 0.95` |
| `line-clamp-3` | RN: `numberOfLines={3}` on `Text` | Direct equivalent |
| `cursor-pointer hover:opacity-70` | No hover in RN | Use `Pressable` with `pressed && { opacity: 0.72 }` |
| `ResizeObserver` (hashtag row) | Not in RN | Use `onLayout` callback instead |
| Custom scrollbar hidden | Not applicable in RN | Native default |
| `fixed bottom-0` nav bar | Not in RN — use Expo Router `Tabs` | Already handled |
| `z-50` stacking | Use `zIndex` in RN styles | Simple equivalent |
| Box shadow CSS | Use `src/theme/shadows.ts` (iOS shadow / Android elevation) | Already in theme |
| `border-radius` % (circle) | `borderRadius: size/2` in RN | Simple equivalent |
| SVG component with color prop | Install `react-native-svg` + convert | See MIGRATION_UI_ASSETS.md §SVG Handling Plan |
| WebP images | `expo-image` supports WebP | Fully supported |
| `min-h-svh`, `dvh` units | Not in RN — use `height: '100%'` or `Dimensions.get` | Use `useSafeAreaInsets` for safe area |

---

## Reusable Component Candidates

Create these in `src/components/` as shared components across pages:

| Component | 2.0 source | 2.1 target | priority |
|---|---|---|---|
| `BoardCard` | src/components/common/board/BoardCard.tsx | src/components/feed/BoardCard.tsx | HIGH — Feed, Home |
| `HashtagChip` | src/components/common/HashtagChip.tsx | src/components/common/HashtagChip.tsx | HIGH — Works, Feed |
| `SearchBar` | src/components/common/SearchBar.tsx | src/components/common/SearchBar.tsx | HIGH — multiple screens |
| `RatingInput` | src/components/common/RatingInput.tsx | src/components/common/RatingInput.tsx | MEDIUM — review write |
| `SectionHeader` | inline `<h2>` | src/components/common/SectionHeader.tsx | MEDIUM — Home, Library |
| `EmptyState` | src/components/common/Warining.tsx | src/components/common/EmptyState.tsx | MEDIUM — all screens |
| `HotFeedCard` | src/components/home/hotFeed/HotFeedCard.tsx | src/components/home/HotFeedCard.tsx | MEDIUM — Home |
| `TopicRoomCoverCard` | src/components/home/todayTopicRoom/TopicroomCoverCard.tsx | src/components/topicroom/TopicRoomCoverCard.tsx | MEDIUM — Home |
| `ContextMenu` (3-dot) | inline in BoardCard | src/components/common/ContextMenu.tsx | MEDIUM — Feed |
| `StarRating` (display) | inline in PostCard | src/components/common/StarRating.tsx | LOW — review display |

---

## Page-by-Page Implementation Order

| Phase | Screen | Priority | Complexity |
|---|---|---|---|
| UI-1 | Home | HIGH | Medium — 3 sections, slider |
| UI-2 | Works Detail (Library) | HIGH | High — tabs, reviews, topicroom |
| UI-3 | TopicRoom List | MEDIUM | Low — list of cards |
| UI-4 | TopicRoom Chat | MEDIUM | High — real-time chat UI |
| UI-5 | Profile | MEDIUM | Medium — tabs, stats |
| UI-6 | Login / Auth | MEDIUM | Low — form + social buttons |
| UI-7 | Onboarding / Preference | LOW | High — multi-step flow |
| UI-8 | Feed (Boards) | DONE (Phase 10C) | — |
| UI-9 | Library / Search | LOW | Medium |
| UI-10 | Board Detail (replies) | MEDIUM | Medium |

---

## Prompt Templates for Future Phases

---

### UI-1: Home Screen Parity

```
Proceed with Phase UI-1 only: Home screen visual parity with STORIX-FE-2.0.

Source files to inspect in 2.0:
- src/app/home/page.tsx
- src/components/home/HomeHeader.tsx
- src/components/home/hotFeed/HotFeedCard.tsx
- src/components/home/hotFeed/HotFeedSlider.tsx
- src/components/home/todayTopicRoom/TopicroomCoverCard.tsx
- src/components/home/todayTopicRoom/TopicRoomCoverSlider.tsx
- src/components/home/myTaste/MyTasteCard.tsx

Target file in 2.1:
- app/(tabs)/index.tsx

Assets to use:
- assets/preference/tasteImage.webp  (MyTaste section)
- assets/icons/common/fire.svg  (Trending indicator)
- assets/icons/common/notification.svg  (Header bell)
- assets/logos/logo-pink.svg  (Header STORIX mark)

Components to create:
- src/components/home/HotFeedCard.tsx
- src/components/home/HotFeedSlider.tsx  (horizontal FlatList + auto-scroll)
- src/components/home/TopicRoomCoverCard.tsx

What NOT to change:
- API hooks (useTodayHomeFeeds, useTodayTopicRooms, usePopularTopicRooms)
- Query keys
- Navigation logic (router.push paths)
- Auth/token logic

Verification:
- npx tsc --noEmit
- npx expo export --platform android
```

---

### UI-2: Works Detail (Library) Parity

```
Proceed with Phase UI-2 only: Works Detail screen visual parity with STORIX-FE-2.0.

Source files to inspect in 2.0:
- src/app/library/works/page.tsx
- src/components/library/works/WorkHeaderCover.tsx
- src/components/library/works/WorkTopBar.tsx
- src/components/library/works/WorkTapContent.tsx
- src/components/library/works/ReviewMetaBar.tsx
- src/components/library/works/OtherReviewsSection.tsx
- src/components/library/works/TopicRoomEnterButton.tsx
- src/components/common/post/PostCard.tsx

Target file in 2.1:
- app/works/[worksId].tsx

Assets to use:
- assets/images/platforms/*.png  (platform logos)
- assets/icons/common/icon-like.svg / icon-like-pink.svg
- assets/icons/common/ratingStar.svg / littleStar.svg / middleStar.svg
- assets/icons/common/author-mark.svg
- assets/icons/common/icon-arrow-forward.svg

Components to create:
- src/components/works/WorksCoverHeader.tsx
- src/components/works/PostCard.tsx  (review card)
- src/components/common/StarRating.tsx
- src/components/common/HashtagChip.tsx

What NOT to change:
- API hooks for works data
- Query keys

Verification:
- npx tsc --noEmit
- npx expo export --platform android
```

---

### UI-3: TopicRoom List Parity

```
Proceed with Phase UI-3 only: TopicRoom list screen visual parity with STORIX-FE-2.0.

Source files to inspect in 2.0:
- src/app/home/topicroom/page.tsx
- src/components/topicroom/CardTopicroomInsideCover.tsx
- src/components/topicroom/CardTopicroomInsideCoverSlider.tsx
- src/components/topicroom/TopicroomChip.tsx
- src/components/topicroom/TopicRoomSearchList.tsx

Target file in 2.1:
- app/(tabs)/two.tsx

Assets to use:
- assets/icons/common/icon-topicroom-people.svg
- assets/icons/common/search.svg

Components to create/update:
- src/components/topicroom/TopicRoomCard.tsx  (replace current row with 2.0 cover card style)
- src/components/topicroom/TopicRoomChip.tsx

What NOT to change:
- useTodayTopicRooms, usePopularTopicRooms hooks
- Navigation to /topicroom/[id]

Verification:
- npx tsc --noEmit
- npx expo export --platform android
```

---

### UI-4: TopicRoom Chat Parity

```
Proceed with Phase UI-4 only: TopicRoom chat screen visual parity with STORIX-FE-2.0.

Source files to inspect in 2.0:
- src/app/home/topicroom/detail/TopicRoomClient.tsx
- src/components/topicroom/TopicRoomTopBar.tsx
- src/components/topicroom/TopicRoomMessages.tsx
- src/components/topicroom/TopicRoomInputBar.tsx
- src/components/topicroom/ParticipationChat.tsx
- src/components/topicroom/ParticipationChatItem.tsx
- src/components/topicroom/TopicRoomLeaveModal.tsx
- src/components/topicroom/icons/TopicRoomSendIcon.tsx

Target file in 2.1:
- app/topicroom/[roomId].tsx

Assets to use:
- assets/icons/common/back.svg  (header back)
- assets/icons/common/icon-topicroom-people.svg
- assets/icons/common/settings.svg

Components to create:
- src/components/topicroom/ChatBubble.tsx
- src/components/topicroom/ChatInputBar.tsx
- src/components/topicroom/TopicRoomHeader.tsx

What NOT to change:
- WebSocket/STOMP connection logic
- Message query keys

Verification:
- npx tsc --noEmit
- npx expo export --platform android
```

---

### UI-5: Profile Parity

```
Proceed with Phase UI-5 only: Profile screen visual parity with STORIX-FE-2.0.

Source files to inspect in 2.0:
- src/app/profile/page.tsx
- src/app/profile/components/userProfile.tsx
- src/app/profile/components/preferenceTab.tsx
- src/app/profile/components/genre.tsx
- src/app/profile/components/hashtag.tsx
- src/app/profile/components/rating.tsx

Target file in 2.1:
- app/(tabs)/profile.tsx

Assets to use:
- assets/placeholders/profile-default.svg  (avatar fallback)
- assets/icons/profile/write-review.svg
- assets/icons/profile/find-books.svg
- assets/icons/profile/find-writers.svg
- assets/icons/common/settings.svg

What NOT to change:
- useMe hook
- Logout logic
- Navigation paths

Verification:
- npx tsc --noEmit
- npx expo export --platform android
```

---

### UI-6: Login / Auth Parity

```
Proceed with Phase UI-6 only: Login screen visual parity with STORIX-FE-2.0.

Source files to inspect in 2.0:
- src/app/login/page.tsx

Target file in 2.1:
- app/login.tsx (or app/(auth)/login.tsx)

Assets to use:
- assets/logos/logo-word.svg  (header STORIX wordmark)
- assets/icons/login/login-kakao.svg
- assets/icons/login/login-naver.svg
- assets/icons/login/login-apple.svg  (if implementing Apple Sign In later)
- assets/icons/login/saw-password.svg / see-password.svg
- assets/icons/login/terms-gray.svg / terms-pink.svg

What NOT to change:
- Kakao/Naver OAuth logic
- Token storage (authStore, SecureStore)
- Auth redirect paths

Verification:
- npx tsc --noEmit
- npx expo export --platform android
```

---

### UI-7: Onboarding / Preference Parity

```
Proceed with Phase UI-7 only: Onboarding and Preference screen visual parity with STORIX-FE-2.0.

Source files to inspect in 2.0:
- src/app/onboarding/page.tsx
- src/app/onboarding/components/nickname.tsx
- src/app/onboarding/components/genre.tsx
- src/app/onboarding/components/favorite.tsx
- src/app/onboarding/components/bio.tsx
- src/app/onboarding/components/final.tsx
- src/app/home/preference/page.tsx
- src/components/preference/PreferenceCard.tsx
- src/components/preference/PreferenceList.tsx
- src/components/preference/NextButton.tsx

Target files in 2.1:
- app/onboarding.tsx (or multi-step stack)
- app/preference/

Assets to use:
- assets/onboarding/*.svg  (genre illustrations)
- assets/onboarding/progress-indicater-*.svg
- assets/onboarding/icon-men.svg / icon-women.svg
- assets/preference/preferenceGuide.webp
- assets/preference/finishStar.webp

What NOT to change:
- Preference API hooks
- Profile update mutation

Verification:
- npx tsc --noEmit
- npx expo export --platform android
```

---

### UI-8: Library / Search Parity

```
Proceed with Phase UI-8 only: Library list and Search screen parity with STORIX-FE-2.0.

Source files to inspect in 2.0:
- src/app/library/list/page.tsx
- src/app/library/gallery/page.tsx
- src/components/library/LibraryHeader.tsx
- src/components/library/LibraryWorksListContent.tsx
- src/components/library/gallery/BookSpineCarousel.tsx
- src/app/home/search/page.tsx
- src/components/home/search/SearchFloatingButton.tsx
- src/components/home/search/TrendingSearch.tsx
- src/components/home/search/SearchResultWorks.tsx

Target files in 2.1:
- app/library.tsx or app/(tabs)/library.tsx
- app/search.tsx

Assets to use:
- assets/icons/library/icon-gallery.svg
- assets/icons/library/icon-list.svg
- assets/icons/library/leftGradient.svg / rightGradient.svg
- assets/icons/common/search.svg
- assets/images/platforms/*.png

Components to create:
- src/components/library/WorksListCard.tsx
- src/components/library/WorksGalleryCard.tsx
- src/components/common/SearchBar.tsx

What NOT to change:
- Library API hooks
- Works query keys

Verification:
- npx tsc --noEmit
- npx expo export --platform android
```

---

## Theme Alignment Notes

### Confirmed matches (no changes needed)
- All color values: Magenta scale, Gray scale, semantic tokens — identical
- All typography sizes and weights — identical  
- All line heights (140% ratio, derived as absolute px) — identical
- Spacing scale (4px base, Tailwind steps) — identical
- Border radius values — identical
- Shadow system (iOS shadow props / Android elevation) — already RN-adapted

### One gap: Font family
- 2.0: `font-family: 'SUIT Variable'` on all text
- 2.1: system default sans-serif (Roboto on Android, San Francisco on iOS)
- Visual difference: noticeable when side-by-side; SUIT has rounder, friendlier letterforms
- **Fix:** Download SUIT Variable TTF → register with expo-font → add to all Typography entries
- **Scope:** All screens affected; wire font first before any UI parity pass

### Minor differences to expect
| Difference | 2.0 behavior | 2.1 behavior | severity |
|---|---|---|---|
| Font | SUIT Variable (woff2) | System default | Medium — visible |
| Container max-width | 393px centered on web | Full-width native | None — native fills screen |
| Safe area | CSS `env(safe-area-inset-top)` | `useSafeAreaInsets()` | Low — already handled |
| Tap states | `hover:opacity-70` on desktop | `Pressable` `pressed` opacity | Low — mobile-only anyway |
| Spoiler blur | CSS `blur-md opacity-10` | Opaque overlay `View` | Low — intention preserved |
| Hashtag row overflow | `ResizeObserver` for exact fit | `onLayout` + slice | Low — functional parity |

---

## Safety Rules (for all future UI phases)

- Do NOT move API/hooks/store files into src/features during UI phases
- Do NOT change API function signatures or endpoint paths
- Do NOT change React Query key arrays
- Do NOT change auth redirect logic or token storage
- Do NOT use web tags (`<div>`, `<span>`, `<p>` as root elements)
- Do NOT use Tailwind `className` prop
- Do NOT use CSS files or `StyleSheet.create` with `class:`
- Do NOT copy Next.js JSX directly — always rewrite for RN primitives
- ALWAYS run `npx tsc --noEmit` after each phase
- ALWAYS run `npx expo export --platform android` after each phase
