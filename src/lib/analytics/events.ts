import analytics from '@react-native-firebase/analytics'

// ============================================================
// Type Definitions
// ============================================================

type SignupProvider = 'kakao' | 'naver' | 'twitter' | 'apple' | 'unknown'

type ScreenName = 'home' | 'feed' | 'search' | 'library' | 'profile' | 'topic_room'

type SourceSection =
  | 'home_today_topic_room'
  | 'home_today_feed'
  | 'home_work_card'
  | 'home_recommended_hashtag'

type ContentType = 'topic_room' | 'feed_post' | 'work' | 'hashtag'

type ThemeType = 'birthday' | 'default'

type FeatureName = 'spoiler' | 'birthday_theme'

type TargetType = 'post' | 'comment'

type EntrySource = 'home' | 'search' | 'feed'

type ProfileSectionName = 'taste_analysis' | 'activity'

type ShareMethod = 'kakao' | 'x'

type ShareContentType = 'review_card' | 'profile_card'

interface SelectContentParams {
  source_section: SourceSection
  content_type: ContentType
  content_id: string
  position: number
}

interface CreateFeedPostParams {
  post_id: string
  has_spoiler: boolean
  theme_type: ThemeType
}

interface CreateFeedCommentParams {
  post_id: string
  comment_id: string
  has_spoiler: boolean
}

interface UseFeedFeatureParams {
  feature_name: FeatureName
  target_type: TargetType
}

interface EnterTopicRoomParams {
  topic_room_id: string
  entry_source: EntrySource
}

interface ExitTopicRoomParams {
  topic_room_id: string
  stay_duration_sec: number
}

interface UseSearchFilterParams {
  filter_type: string
  filter_value: string
}

interface CreateReviewParams {
  review_id: string
  work_id: string
}

interface ExportReviewCardParams {
  review_id: string
  work_id: string
}

interface ExportProfileCardParams {
  profile_type: string
}

interface ViewProfileSectionParams {
  section_name: ProfileSectionName
}

interface OpenShareSheetParams {
  content_type: ShareContentType
  item_id: string
}

interface ShareParams {
  method: ShareMethod
  content_type: ShareContentType
  item_id: string
}

// ============================================================
// Event Name Registry (중복 방지 & 오타 방지)
// ============================================================

const EVENT_NAMES = {
  // GA4 권장 이벤트
  SCREEN_VIEW: 'screen_view',
  SELECT_CONTENT: 'select_content',
  SEARCH: 'search',
  SHARE: 'share',
  SIGN_UP: 'sign_up',

  // 커스텀 이벤트
  CREATE_FEED_POST: 'create_feed_post',
  CREATE_FEED_COMMENT: 'create_feed_comment',
  USE_FEED_FEATURE: 'use_feed_feature',
  ENTER_TOPIC_ROOM: 'enter_topic_room',
  EXIT_TOPIC_ROOM: 'exit_topic_room',
  USE_SEARCH_FILTER: 'use_search_filter',
  CREATE_REVIEW: 'create_review',
  EXPORT_REVIEW_CARD: 'export_review_card',
  EXPORT_PROFILE_CARD: 'export_profile_card',
  VIEW_PROFILE_SECTION: 'view_profile_section',
  OPEN_SHARE_SHEET: 'open_share_sheet',
  WITHDRAW_ACCOUNT: 'withdraw_account',

  // 회원가입 provider별
  SIGN_UP_KAKAO: 'sign_up_kakao',
  SIGN_UP_NAVER: 'sign_up_naver',
  SIGN_UP_TWITTER: 'sign_up_twitter',
  SIGN_UP_APPLE: 'sign_up_apple',
} as const

const SIGNUP_PROVIDER_EVENTS: Record<Exclude<SignupProvider, 'unknown'>, string> = {
  kakao: EVENT_NAMES.SIGN_UP_KAKAO,
  naver: EVENT_NAMES.SIGN_UP_NAVER,
  twitter: EVENT_NAMES.SIGN_UP_TWITTER,
  apple: EVENT_NAMES.SIGN_UP_APPLE,
}

// ============================================================
// Validation & Sanitization
// ============================================================

function validateEventParams(
  eventName: string,
  params?: Record<string, any>,
): boolean {
  if (!eventName || typeof eventName !== 'string') {
    if (__DEV__) {
      console.error('[analytics] Invalid event name:', eventName)
    }
    return false
  }

  if (params && typeof params !== 'object') {
    if (__DEV__) {
      console.error('[analytics] Invalid params type:', params)
    }
    return false
  }

  return true
}

function sanitizeParams(
  params: Record<string, any>,
): Record<string, string | number | boolean> {
  const sanitized: Record<string, string | number | boolean> = {}

  for (const [key, value] of Object.entries(params)) {
    // GA4는 string | number | boolean만 허용
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      sanitized[key] = value
    } else if (value === null || value === undefined) {
      // null/undefined는 빈 문자열로 변환
      sanitized[key] = ''
    } else {
      // 객체/배열은 JSON 문자열로 변환
      sanitized[key] = JSON.stringify(value)
    }
  }

  return sanitized
}

function normalizeSignupProvider(provider?: string | null): SignupProvider {
  if (provider === 'kakao' || provider === 'naver' || provider === 'apple') {
    return provider
  }

  if (provider === 'x' || provider === 'twitter') {
    return 'twitter'
  }

  return 'unknown'
}

// ============================================================
// Core Logging Function (중복 발생 방지 메커니즘 포함)
// ============================================================

// 중복 이벤트 방지용 캐시 (동일 이벤트가 짧은 시간 내 중복 발생 방지)
const eventCache = new Map<string, number>()
const DUPLICATE_THRESHOLD_MS = 1000 // 1초 내 동일 이벤트는 중복으로 간주
let lastCleanupTime = 0
const CLEANUP_INTERVAL_MS = 10000 // 10초마다 캐시 정리

function getCacheKey(eventName: string, params?: Record<string, any>): string {
  if (!params || Object.keys(params).length === 0) {
    return eventName
  }

  // 키를 정렬하여 순서 무관하게 동일한 해시 생성
  const sortedParams = Object.keys(params)
    .sort()
    .reduce(
      (acc, key) => {
        acc[key] = params[key]
        return acc
      },
      {} as Record<string, any>,
    )

  return `${eventName}:${JSON.stringify(sortedParams)}`
}

async function logAnalyticsEvent(
  name: string,
  params?: Record<string, any>,
  options?: {
    allowDuplicates?: boolean // 중복 허용 여부 (기본: false)
  },
) {
  // 1. Validation
  if (!validateEventParams(name, params)) {
    return
  }

  // 2. 중복 체크 (옵션으로 비활성화 가능)
  if (!options?.allowDuplicates) {
    const cacheKey = getCacheKey(name, params)
    const lastFiredAt = eventCache.get(cacheKey)
    const now = Date.now()

    if (lastFiredAt && now - lastFiredAt < DUPLICATE_THRESHOLD_MS) {
      if (__DEV__) {
        console.warn('[analytics] Duplicate event prevented:', {
          name,
          params,
          timeSinceLastFire: now - lastFiredAt,
        })
      }
      return
    }

    eventCache.set(cacheKey, now)

    // 메모리 누수 방지: 10초마다 한 번만 오래된 캐시 정리
    if (now - lastCleanupTime > CLEANUP_INTERVAL_MS) {
      for (const [key, timestamp] of eventCache.entries()) {
        if (now - timestamp > 5000) {
          eventCache.delete(key)
        }
      }
      lastCleanupTime = now
    }
  }

  // 3. Sanitization
  const sanitizedParams = params ? sanitizeParams(params) : undefined

  // 4. Logging
  try {
    await analytics().logEvent(name, sanitizedParams)

    if (__DEV__) {
      console.log('[analytics] Event logged:', {
        name,
        params: sanitizedParams,
      })
    }
  } catch (error) {
    if (__DEV__) {
      console.error('[analytics] logEvent failed:', {
        name,
        params: sanitizedParams,
        error,
      })
    }
  }
}

// ============================================================
// Public Tracking Functions
// ============================================================

/**
 * 화면 조회 추적
 * @param screenName - 화면 이름 (home, feed, search, library, profile, topic_room)
 */
export async function trackScreenView(screenName: ScreenName) {
  await logAnalyticsEvent(EVENT_NAMES.SCREEN_VIEW, {
    screen_name: screenName,
    screen_class: screenName,
  })
}

/**
 * 홈 콘텐츠 선택 추적
 * @param params - 콘텐츠 선택 정보
 */
export async function trackSelectContent(params: SelectContentParams) {
  await logAnalyticsEvent(EVENT_NAMES.SELECT_CONTENT, params)
}

/**
 * 피드 게시글 작성 완료 추적
 * @param params - 게시글 정보
 */
export async function trackCreateFeedPost(params: CreateFeedPostParams) {
  await logAnalyticsEvent(EVENT_NAMES.CREATE_FEED_POST, params)
}

/**
 * 피드 댓글 작성 완료 추적
 * @param params - 댓글 정보
 */
export async function trackCreateFeedComment(params: CreateFeedCommentParams) {
  await logAnalyticsEvent(EVENT_NAMES.CREATE_FEED_COMMENT, params)
}

/**
 * 피드 기능 사용 추적 (스포일러, 생일테마)
 * @param params - 사용한 기능 정보
 */
export async function trackUseFeedFeature(params: UseFeedFeatureParams) {
  await logAnalyticsEvent(EVENT_NAMES.USE_FEED_FEATURE, params)
}

/**
 * 토픽룸 입장 추적
 * @param params - 토픽룸 정보
 */
export async function trackEnterTopicRoom(params: EnterTopicRoomParams) {
  await logAnalyticsEvent(EVENT_NAMES.ENTER_TOPIC_ROOM, params)
}

/**
 * 토픽룸 퇴장 추적
 * @param params - 토픽룸 정보 및 체류 시간
 */
export async function trackExitTopicRoom(params: ExitTopicRoomParams) {
  await logAnalyticsEvent(EVENT_NAMES.EXIT_TOPIC_ROOM, params)
}

/**
 * 검색 실행 추적
 * @param searchTerm - 검색어
 */
export async function trackSearch(searchTerm: string) {
  await logAnalyticsEvent(EVENT_NAMES.SEARCH, {
    search_term: searchTerm,
  })
}

/**
 * 검색 필터 사용 추적
 * @param params - 필터 정보
 */
export async function trackUseSearchFilter(params: UseSearchFilterParams) {
  await logAnalyticsEvent(EVENT_NAMES.USE_SEARCH_FILTER, params)
}

/**
 * 리뷰 작성 완료 추적
 * @param params - 리뷰 정보
 */
export async function trackCreateReview(params: CreateReviewParams) {
  await logAnalyticsEvent(EVENT_NAMES.CREATE_REVIEW, params)
}

/**
 * 리뷰카드 추출 추적
 * @param params - 리뷰카드 정보
 */
export async function trackExportReviewCard(params: ExportReviewCardParams) {
  await logAnalyticsEvent(EVENT_NAMES.EXPORT_REVIEW_CARD, params)
}

/**
 * 프로필카드 추출 추적
 * @param params - 프로필카드 정보
 */
export async function trackExportProfileCard(params: ExportProfileCardParams) {
  await logAnalyticsEvent(EVENT_NAMES.EXPORT_PROFILE_CARD, params)
}

/**
 * 프로필 섹션 도달 추적 (취향분석, 내 활동)
 * @param params - 섹션 정보
 */
export async function trackViewProfileSection(params: ViewProfileSectionParams) {
  await logAnalyticsEvent(EVENT_NAMES.VIEW_PROFILE_SECTION, params)
}

/**
 * 공유 시트 열기 추적
 * @param params - 공유 대상 정보
 */
export async function trackOpenShareSheet(params: OpenShareSheetParams) {
  await logAnalyticsEvent(EVENT_NAMES.OPEN_SHARE_SHEET, params)
}

/**
 * 공유 완료 추적 (카카오톡, X)
 * @param params - 공유 정보
 */
export async function trackShare(params: ShareParams) {
  await logAnalyticsEvent(EVENT_NAMES.SHARE, params)
}

/**
 * 회원가입 완료 추적
 * @param provider - 소셜 로그인 제공자
 */
export async function trackSignupCompleted(provider?: string | null) {
  const method = normalizeSignupProvider(provider)
  const events = [logAnalyticsEvent(EVENT_NAMES.SIGN_UP, { method })]

  if (method !== 'unknown') {
    events.push(logAnalyticsEvent(SIGNUP_PROVIDER_EVENTS[method], { method }))
  }

  await Promise.allSettled(events)
}

/**
 * 회원 탈퇴 추적
 * @param params - 탈퇴 정보
 */
export async function trackWithdrawAccount(params?: {
  provider?: string | null
  reasonCount?: number
}) {
  await logAnalyticsEvent(EVENT_NAMES.WITHDRAW_ACCOUNT, {
    method: normalizeSignupProvider(params?.provider),
    reason_count: params?.reasonCount ?? 0,
  })
}
