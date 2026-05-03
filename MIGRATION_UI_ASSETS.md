# MIGRATION_UI_ASSETS.md
# STORIX-FE-2.0 → 2.1 Visual Asset Inventory

Generated: 2026-05-03  
Source: `C:\Users\dbs0396\STORIX-FE-2.0\storix-fe\public\`  
Target: `C:\Users\dbs0396\STORIX-FE-2.1\STORIX-FE-2.1\assets\`

---

## Asset Directory Structure (2.1)

```
assets/
├── fonts/
│   ├── SpaceMono-Regular.ttf     (existing Expo default)
│   └── SUIT-Variable.woff2       (copied from 2.0 — NOT usable in RN yet; see Font Plan)
├── icons/
│   ├── common/   (36 files — navigation, interaction, decoration SVGs)
│   ├── navbar/   (4 files  — bottom nav tab SVGs + background)
│   ├── login/    (9 files  — social login buttons, password toggles)
│   ├── feed/     (12 files — feed-specific action icons)
│   ├── library/  (4 files  — library view icons)
│   └── profile/  (8 files  — profile action icons)
├── logos/        (5 files  — STORIX logo variants + favicon)
├── placeholders/ (1 file   — profile-default.svg)
├── onboarding/   (25 files — genre/type/step indicator SVGs)
├── preference/   (4 files  — preference guide WebP + tasteImage)
└── images/
    ├── (existing: adaptive-icon, favicon, icon, splash-icon)
    └── platforms/ (4 files — platform logos: Kakao Page, KakaoWebtoon, Naver, Ridi)
```

---

## Logos

| 2.0 source path | 2.1 target path | type | likely usage | action | notes |
|---|---|---|---|---|---|
| public/common/icons/logo-black.svg | assets/logos/logo-black.svg | SVG | STORIX wordmark on light bg | needs react-native-svg conversion | Used in header, splash, auth screens |
| public/common/icons/logo-pink.svg | assets/logos/logo-pink.svg | SVG | STORIX wordmark (brand pink) | needs react-native-svg conversion | Primary brand identity |
| public/common/icons/logo-white.svg | assets/logos/logo-white.svg | SVG | STORIX wordmark on dark bg | needs react-native-svg conversion | Dark/overlay contexts |
| public/common/icons/logo-word.svg | assets/logos/logo-word.svg | SVG | Full wordmark with tagline | needs react-native-svg conversion | Splash screen, login header |
| public/common/pwa/favicon.svg | assets/logos/favicon.svg | SVG | App icon source | needs react-native-svg conversion | |

---

## Common Icons — assets/icons/common/

| filename | type | likely usage | action | notes |
|---|---|---|---|---|
| arrow-down.svg | SVG | Dropdown expand / accordion | needs react-native-svg conversion | Simple path |
| arrow-next.svg | SVG | List row chevron right | needs react-native-svg conversion | |
| arrow-up.svg | SVG | Collapse / scroll to top | needs react-native-svg conversion | |
| author-mark.svg | SVG | Author badge on profiles | needs react-native-svg conversion | |
| back.svg | SVG | Header back button | needs react-native-svg conversion | |
| cancel.svg | SVG | Clear / close / dismiss | needs react-native-svg conversion | |
| check-gray.svg | SVG | Checkbox unchecked state | needs react-native-svg conversion | |
| check-pink.svg | SVG | Checkbox checked state | needs react-native-svg conversion | |
| comment-dropdown.svg | SVG | Report item in 3-dot menu | copy as-is (Image) | Image-only usage, 1.5KB |
| delete-dropdown.svg | SVG | Delete item in 3-dot menu | copy as-is (Image) | Image-only usage |
| fire.svg | SVG | Trending / hot indicator | needs react-native-svg conversion | |
| icon-add-active.svg | SVG | Add/plus button active | needs react-native-svg conversion | |
| icon-add-deactive.svg | SVG | Add/plus button inactive | needs react-native-svg conversion | |
| icon-arrow-forward-small.svg | SVG | Small inline forward arrow | needs react-native-svg conversion | Used in BoardCard works section |
| icon-arrow-forward.svg | SVG | Large forward arrow | needs react-native-svg conversion | |
| icon-comment.svg | SVG | Reply/comment count icon | needs react-native-svg conversion | Used in feed cards |
| icon-like-pink.svg | SVG | Like button — liked state | needs react-native-svg conversion | Used in feed cards |
| icon-like.svg | SVG | Like button — default state | needs react-native-svg conversion | Used in feed cards |
| icon-share.svg | SVG | Share action | needs react-native-svg conversion | |
| icon-topicroom-people.svg | SVG | Topic room participant count | needs react-native-svg conversion | |
| littleStar.svg | SVG | Small star rating | needs react-native-svg conversion | |
| menu-3dots.svg | SVG | Context/overflow menu button | needs react-native-svg conversion | Used in BoardCard |
| middleStar.svg | SVG | Medium star rating | needs react-native-svg conversion | |
| notification-gray.svg | SVG | Notification bell — inactive | needs react-native-svg conversion | |
| notification.svg | SVG | Notification bell — active | needs react-native-svg conversion | |
| ratingStar.svg | SVG | Rating input star | needs react-native-svg conversion | |
| search.svg | SVG | Search icon | needs react-native-svg conversion | SearchBar component |
| settings.svg | SVG | Settings / gear | needs react-native-svg conversion | Profile screen |
| star.svg | SVG | Generic star / favorite | needs react-native-svg conversion | |
| active.svg | SVG | Online status dot | needs react-native-svg conversion | |
| deactive.svg | SVG | Offline status dot | needs react-native-svg conversion | |
| topicRoomChatButton.svg | SVG | Enter topicroom button | needs react-native-svg conversion | |

**SKIPPED (too large):**
| public/common/icons/big-star-pink.svg | — | 454 KB — complex illustration | skip for now | Re-evaluate per screen |
| public/common/icons/big-star-pink.png | — | 340 KB PNG variant | skip for now | |
| public/common/icons/warningLarge.svg | — | 263 KB — warning illustration | skip for now | Large embedded raster |
| public/common/icons/warningSmall.svg | — | 263 KB — same illustration | skip for now | |
| public/common/icons/pay.svg | — | 57 KB — payment illustration | skip for now | Pay flow (future phase) |
| public/common/icons/reviewProfile.svg | — | 24 KB — review placeholder | copy when needed | Not a UI icon |

---

## Navbar Icons — assets/icons/navbar/

| filename | type | likely usage | action | notes |
|---|---|---|---|---|
| feed.svg | SVG | Bottom nav tab — Feed icon | needs react-native-svg conversion | Active/inactive handled via color prop |
| plus.svg | SVG | Bottom nav center + button | needs react-native-svg conversion | Rotating animation on open |
| review.svg | SVG | Plus popup — Review option | copy as-is (Image) | |
| navigationbar-background.svg | SVG | Nav bar custom wave bg shape | needs react-native-svg conversion | Custom SVG shape behind tabs |

**Note:** 2.0 uses React components `Icon-Home.tsx`, `Icon-Feed.tsx`, etc. These are inline SVG components. In 2.1 we use FontAwesome icons (from `@expo/vector-icons`). For full parity, these should be replaced with react-native-svg equivalents in a later phase.

---

## Login Icons — assets/icons/login/

| filename | type | likely usage | action | notes |
|---|---|---|---|---|
| login-kakao.svg | SVG | Kakao login button | needs react-native-svg conversion | Brand color: #FEE500 |
| login-naver.svg | SVG | Naver login button | needs react-native-svg conversion | Brand color: #03C75A |
| login-apple.svg | SVG | Apple login button | needs react-native-svg conversion | Phase deferred |
| login-twitter.svg | SVG | Twitter login button | copy as-is (Image) | 136 KB — render as Image |
| saw-password.svg | SVG | Password visible state | needs react-native-svg conversion | |
| see-password.svg | SVG | Password hidden state | needs react-native-svg conversion | |
| terms-gray.svg | SVG | Terms checkbox unchecked | needs react-native-svg conversion | |
| terms-pink.svg | SVG | Terms checkbox checked | needs react-native-svg conversion | |
| writer-login.svg | SVG | Writer login route | needs react-native-svg conversion | |

**SKIPPED:**
| public/common/login/login-warning.svg | — | 276 KB — login error illustration | skip for now | Copy per-screen when needed |

---

## Feed Icons — assets/icons/feed/

| filename | type | likely usage | action | notes |
|---|---|---|---|---|
| add-favorites.svg | SVG | Add to favorites (board) | needs react-native-svg conversion | |
| author-mark.svg | SVG | Author badge in feed | needs react-native-svg conversion | Duplicate of common |
| comment-arrow.svg | SVG | Reply submit arrow | needs react-native-svg conversion | |
| comment-black.svg | SVG | Reply/comment icon (dark) | needs react-native-svg conversion | |
| feed-all-gray.svg | SVG | Feed filter — all, inactive | needs react-native-svg conversion | |
| feed-all-pink.svg | SVG | Feed filter — all, active | needs react-native-svg conversion | |
| icon-photo.svg | SVG | Photo attach in write flow | needs react-native-svg conversion | Plus write phase |
| picker-gray.svg | SVG | Image picker — inactive | needs react-native-svg conversion | |
| picker-pink.svg | SVG | Image picker — active | needs react-native-svg conversion | |
| report-done.svg | SVG | Report completed illustration | copy as-is (Image) | 7.5 KB |
| upload-comment.svg | SVG | Reply submit button | needs react-native-svg conversion | |
| payPost-openchat.svg | SVG | Pay post open-chat button | needs react-native-svg conversion | Pay flow phase |

**SKIPPED (pay flow manual images):**
- pay-guide-1.png through pay-guide-7.png (143 KB – 1 MB each) — skip until pay flow phase

---

## Library Icons — assets/icons/library/

| filename | type | likely usage | action | notes |
|---|---|---|---|---|
| icon-gallery.svg | SVG | Library gallery view toggle | needs react-native-svg conversion | |
| icon-list.svg | SVG | Library list view toggle | needs react-native-svg conversion | |
| leftGradient.svg | SVG | Scroll fade — left edge | copy as-is (Image) | Gradient overlay |
| rightGradient.svg | SVG | Scroll fade — right edge | copy as-is (Image) | Gradient overlay |

---

## Profile Icons — assets/icons/profile/

| filename | type | likely usage | action | notes |
|---|---|---|---|---|
| find-books.svg | SVG | Empty state — no books | needs react-native-svg conversion | |
| find-writers.svg | SVG | Empty state — no writers | needs react-native-svg conversion | |
| likes-check.svg | SVG | Liked status indicator | needs react-native-svg conversion | |
| likes-plus.svg | SVG | Add to likes | needs react-native-svg conversion | |
| profile-change.svg | SVG | Edit profile photo | needs react-native-svg conversion | |
| profile-default.svg | SVG | Default avatar fallback | copy as-is (Image) | 24 KB |
| warning.svg | SVG | Profile warning state | needs react-native-svg conversion | 19 KB |
| write-review.svg | SVG | Write review action | needs react-native-svg conversion | |

---

## Placeholders — assets/placeholders/

| filename | type | likely usage | action | notes |
|---|---|---|---|---|
| profile-default.svg | SVG | Default user avatar | copy as-is (Image via expo-image) | Used wherever profileImageUrl is null |

---

## Onboarding — assets/onboarding/

25 files — genre/reader-type illustrations + step progress indicators.

| filename | type | likely usage | action | notes |
|---|---|---|---|---|
| action.svg | SVG | Genre: action | copy as-is (Image) | Onboarding genre card |
| bl.svg | SVG | Genre: BL | copy as-is (Image) | |
| daily.svg | SVG | Genre: daily life | copy as-is (Image) | |
| drama.svg | SVG | Genre: drama | copy as-is (Image) | |
| fantasy.svg | SVG | Genre: fantasy | copy as-is (Image) | |
| romance.svg | SVG | Genre: romance | copy as-is (Image) | |
| thriller.svg | SVG | Genre: thriller | copy as-is (Image) | |
| rofan.svg | SVG | Reader type: rofan | copy as-is (Image) | |
| mofan.svg | SVG | Reader type: mofan | copy as-is (Image) | |
| icon-men.svg | SVG | Gender selector: male | needs react-native-svg conversion | Simple colored path |
| icon-women.svg | SVG | Gender selector: female | needs react-native-svg conversion | |
| id-check-gray.svg | SVG | ID verify unchecked | copy as-is (Image) | |
| id-check-pink.svg | SVG | ID verify checked | copy as-is (Image) | |
| genre-select.svg | SVG | Genre selected indicator | needs react-native-svg conversion | |
| next-gray.svg | SVG | Next button — inactive | needs react-native-svg conversion | |
| next.svg | SVG | Next button — active | needs react-native-svg conversion | |
| profilephoto.svg | SVG | Profile photo placeholder | copy as-is (Image) | |
| star-gray.svg | SVG | Preference star — inactive | needs react-native-svg conversion | |
| star-pink.svg | SVG | Preference star — active | needs react-native-svg conversion | |
| progress-indicater-1.svg through progress-indicater-4.svg | SVG | Step progress dots | copy as-is (Image) | |
| progress-indicater-gray.svg | SVG | Progress dot — inactive | copy as-is (Image) | |
| progress-indicater-pink.svg | SVG | Progress dot — active | copy as-is (Image) | |

---

## Preference — assets/preference/

| filename | type | likely usage | action | notes |
|---|---|---|---|---|
| preferenceGuide.webp | WebP | Preference intro image (102 KB) | copy as-is (expo-image) | Used on preference start screen |
| preferenceGuide-2.webp | WebP | Preference step 2 guide (450 KB) | copy as-is (expo-image) | |
| finishStar.webp | WebP | Preference complete animation (340 KB) | copy as-is (expo-image) | |
| tasteImage.webp | WebP | "My Taste" section illustration (307 KB) | copy as-is (expo-image) | Home mytaste section |

---

## Platform Logos — assets/images/platforms/

| filename | type | likely usage | action | notes |
|---|---|---|---|---|
| kakaoPage.png | PNG | Platform logo (4.7 KB) | copy as-is | Works detail, library |
| kakaoWebtoon.png | PNG | Platform logo (18 KB) | copy as-is | |
| naverWebtoon.png | PNG | Platform logo (39 KB) | copy as-is | |
| ridibooks.png | PNG | Platform logo (62 KB) | copy as-is | |

---

## Font — assets/fonts/

| filename | type | likely usage | action | notes |
|---|---|---|---|---|
| SpaceMono-Regular.ttf | TTF | Expo default, not used in 2.0 | keep | Remove when SUIT is wired up |
| SUIT-Variable.woff2 | WOFF2 | Reference copy from 2.0 (624 KB) | NOT usable in RN | See Font Plan below |

---

## NOT Copied (Document Only)

| 2.0 source path | reason not copied | when to copy |
|---|---|---|
| public/common/manual/manual-1.png through manual-4.png | 198 KB – 2 MB, manual/tutorial screenshots | Manual/onboarding phase |
| public/common/manual/verify-guide-*.png | 91 KB – 644 KB | Verification flow phase |
| public/feed/pay-guide-1.png – pay-guide-7.png | 143 KB – 1 MB, pay feature images | Pay post phase |
| public/home/topicroom/sample/*.webp | 339 KB – 839 KB, sample content | Not real assets; replace with API data |
| public/common/login/login-warning.svg | 276 KB illustration | Auth error state phase |
| public/common/icons/big-star-pink.svg/.png | 340–454 KB, decorative illustration | Works/review detail phase |
| public/common/icons/warningLarge.svg | 263 KB | Error/empty state phase |
| public/common/icons/warningSmall.svg | 263 KB | Error/empty state phase |
| public/common/icons/pay.svg | 57 KB, payment illustration | Pay flow phase |
| public/common/manual/progress-indicater-star-*.svg | Not yet needed | Manual phase |

---

## SVG Handling Plan

### Strategy

In STORIX-FE-2.0, SVGs are used two ways:
1. **Inline SVG components** (e.g., `Icon-Home.tsx`, `Icon-Feed.tsx`) — React components with `<svg>` tags, support color/size props.
2. **Image assets** used with `<Image src="...">` — treated as static files.

In STORIX-FE-2.1 (Expo React Native), there are also two approaches:

#### Option A: Static image rendering (no conversion needed)
- Use `<Image>` from `expo-image` with `source={require('./assets/icons/...')}`.
- Works for SVGs that are purely decorative and don't need runtime color/size changes.
- **Expo supports SVG as static image assets** via `expo-image`.
- Suitable for: logos, login buttons, onboarding illustrations, platform logos.

#### Option B: react-native-svg components (conversion needed)
- Install `react-native-svg` (already in many Expo projects).
- Convert SVG markup into `<Svg>`, `<Path>`, `<Circle>` etc.
- Use `react-native-svg-transformer` to import `.svg` files as components directly.
- Required for: icons that need `fill` or `color` props (like/unlike toggle, active/inactive states).
- Suitable for: all interaction icons (like, comment, nav icons, back arrow).

### Recommended install for future phase

```bash
npx expo install react-native-svg
```

For `.svg` as component imports (optional but convenient):
```bash
npm install --save-dev react-native-svg-transformer
```

Then add to `metro.config.js`:
```js
const { getDefaultConfig } = require('expo/metro-config')
const config = getDefaultConfig(__dirname)
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer')
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'svg')
config.resolver.sourceExts.push('svg')
module.exports = config
```

### Priority conversion list (needed for early UI phases)
1. `icon-like.svg` / `icon-like-pink.svg` — feed card like toggle
2. `icon-comment.svg` — feed card comment count
3. `arrow-next.svg` / `back.svg` — navigation
4. `search.svg` — search bar
5. `menu-3dots.svg` — context menu button
6. `logo-pink.svg` / `logo-word.svg` — app header/splash
7. Nav icon SVGs (`Icon-Home`, `Icon-Feed`, `Icon-Library`, `Icon-Profile`) — build as RN components

---

## Font Handling Plan

### 2.0 Font: SUIT Variable
- **Source:** `src/app/fonts/SUIT-Variable.woff2` (624 KB)
- **Format:** `woff2-variations` (variable font, weights 100–900)
- **Usage:** Applied as root font via `next/font/local`, className on `<html>`

### Why WOFF2 doesn't work in React Native
React Native's text rendering engine (Skia/Hermes) only supports:
- `.ttf` (TrueType Font)
- `.otf` (OpenType Font)

WOFF2 is a compressed web format and cannot be loaded with `expo-font`.

### Action Required (NOT done in this phase)

1. **Download SUIT Variable TTF** from the official source:
   - https://sunn.us/suit/ (SUIT font official page)
   - Download `SUIT-Variable.ttf` or weight-specific TTFs
   - Place at: `assets/fonts/SUIT-Variable.ttf`

2. **Register with expo-font** in `app/_layout.tsx`:
```tsx
import { useFonts } from 'expo-font'

const [loaded] = useFonts({
  'SUIT-Variable': require('../assets/fonts/SUIT-Variable.ttf'),
})
```

3. **Add to Typography tokens** — the `TODO` comment already exists in `src/theme/typography.ts`:
```ts
// Add fontFamily: 'SUIT-Variable' to all Typography entries
heading1: { fontSize: 24, fontWeight: '700', lineHeight: 34, fontFamily: 'SUIT-Variable' }
```

4. **Note on variable font weights in RN:** React Native does not support variable font weight ranges as a single file. Each weight may need a separate file OR use the variable font file with explicit fontWeight values (behavior varies by platform). Test on both iOS and Android before committing.

### Current state
- `assets/fonts/SUIT-Variable.woff2` is present as a reference copy.
- `src/theme/typography.ts` has a TODO comment at line 1 tracking this work.
- All screens currently render in the system default sans-serif (matches visual but not exact font).
