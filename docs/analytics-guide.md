# Analytics 구현 가이드

## 📊 개요

이 문서는 STORIX 앱의 Google Analytics 4 (Firebase Analytics) 이벤트를 안전하게 추가하고 사용하는 방법을 설명합니다.

---

## 🛡️ 안전장치

### 1. **중복 이벤트 방지**
동일한 이벤트가 1초 내에 여러 번 발생하는 것을 자동으로 차단합니다.

```typescript
// 사용자가 버튼을 빠르게 2번 클릭해도 이벤트는 1번만 발생
handleClick() {
  await trackCreateFeedPost({ ... }) // ✅ 발생
  await trackCreateFeedPost({ ... }) // ❌ 1초 내 중복, 무시됨
}
```

### 2. **타입 안전성**
TypeScript로 파라미터 오타/누락을 컴파일 타임에 감지합니다.

```typescript
// ❌ 컴파일 에러: content_typ는 존재하지 않는 필드
trackSelectContent({
  content_typ: 'feed_post',  // 오타!
  position: 1
})

// ✅ 자동완성으로 올바른 필드 제안
trackSelectContent({
  source_section: 'home_today_feed',
  content_type: 'feed_post',
  content_id: 'post_123',
  position: 1
})
```

### 3. **파라미터 자동 정제**
잘못된 타입의 값을 자동으로 변환합니다.

```typescript
// null/undefined → 빈 문자열로 변환
trackCreateFeedPost({
  post_id: 'post_123',
  has_spoiler: true,
  theme_type: null as any  // null이지만 자동으로 '' 변환
})

// 객체/배열 → JSON 문자열로 변환
trackCustomEvent({
  metadata: { key: 'value' }  // 자동으로 '{"key":"value"}' 변환
})
```

### 4. **이벤트명 중앙 관리**
모든 이벤트명을 `EVENT_NAMES` 상수로 관리하여 오타 방지.

```typescript
// src/lib/analytics/events.ts
const EVENT_NAMES = {
  CREATE_FEED_POST: 'create_feed_post',
  SELECT_CONTENT: 'select_content',
  // ...
}

// 함수 내부에서 사용
logAnalyticsEvent(EVENT_NAMES.CREATE_FEED_POST, params)
```

---

## 📝 사용 방법

### 기본 패턴

```typescript
import { trackXXX } from '@/lib/analytics/events'

// 1. 이벤트 발생 시점에 호출
const handleAction = async () => {
  // 비즈니스 로직 실행
  const result = await executeAction()
  
  // ✅ 성공 후 추적
  await trackXXX({
    param1: value1,
    param2: value2
  })
}
```

---

## 🎯 이벤트별 구현 예시

### 1. 화면 조회 (`screen_view`)

**자동 추적 권장** (React Navigation 사용 시)

```typescript
// app/_layout.tsx
import { useEffect } from 'react'
import { usePathname } from 'expo-router'
import { trackScreenView } from '@/lib/analytics/events'

export default function RootLayout() {
  const pathname = usePathname()
  
  useEffect(() => {
    // pathname → screen_name 매핑
    const screenMap: Record<string, ScreenName> = {
      '/': 'home',
      '/feed': 'feed',
      '/search': 'search',
      '/library': 'library',
      '/profile': 'profile',
    }
    
    const screenName = screenMap[pathname]
    if (screenName) {
      trackScreenView(screenName)
    }
  }, [pathname])
  
  return <Stack />
}
```

---

### 2. 홈 콘텐츠 선택 (`select_content`)

```typescript
// src/features/home/components/TodayTopicRoom.tsx
import { trackSelectContent } from '@/lib/analytics/events'

export function TodayTopicRoom({ topics }: Props) {
  const navigation = useNavigation()
  
  const handleTopicClick = async (topic: Topic, index: number) => {
    // 추적
    await trackSelectContent({
      source_section: 'home_today_topic_room',
      content_type: 'topic_room',
      content_id: `topic_${topic.id}`,
      position: index + 1  // 1부터 시작
    })
    
    // 이동
    navigation.navigate('TopicRoom', { id: topic.id })
  }
  
  return (
    <FlatList
      data={topics}
      renderItem={({ item, index }) => (
        <TopicCard
          topic={item}
          onPress={() => handleTopicClick(item, index)}
        />
      )}
    />
  )
}
```

**다른 홈 섹션 예시:**

```typescript
// 오늘의 피드
trackSelectContent({
  source_section: 'home_today_feed',
  content_type: 'feed_post',
  content_id: `post_${post.id}`,
  position: 1
})

// 작품 카드
trackSelectContent({
  source_section: 'home_work_card',
  content_type: 'work',
  content_id: `work_${work.id}`,
  position: 2
})

// 추천 해시태그
trackSelectContent({
  source_section: 'home_recommended_hashtag',
  content_type: 'hashtag',
  content_id: `hashtag_${tag.name}`,
  position: 3
})
```

---

### 3. 피드 게시글 작성 (`create_feed_post`)

```typescript
// src/features/feed/components/FeedCreateForm.tsx
import { trackCreateFeedPost } from '@/lib/analytics/events'

export function FeedCreateForm() {
  const createPostMutation = useCreatePost()
  
  const handleSubmit = async (data: FeedFormData) => {
    try {
      // 게시글 생성
      const response = await createPostMutation.mutateAsync(data)
      
      // ✅ 등록 완료 후 추적
      await trackCreateFeedPost({
        post_id: `post_${response.id}`,
        has_spoiler: data.hasSpoiler || false,
        theme_type: data.theme || 'default'
      })
      
      // 이동
      navigation.navigate('FeedDetail', { id: response.id })
    } catch (error) {
      // ❌ 실패 시에는 추적하지 않음
      console.error(error)
    }
  }
  
  return <Form onSubmit={handleSubmit} />
}
```

---

### 4. 피드 댓글 작성 (`create_feed_comment`)

```typescript
// src/features/feed/components/CommentInput.tsx
import { trackCreateFeedComment } from '@/lib/analytics/events'

export function CommentInput({ postId }: Props) {
  const createCommentMutation = useCreateComment()
  
  const handleSubmit = async (content: string, hasSpoiler: boolean) => {
    const response = await createCommentMutation.mutateAsync({
      postId,
      content,
      hasSpoiler
    })
    
    // ✅ 댓글 등록 완료 후 추적
    await trackCreateFeedComment({
      post_id: `post_${postId}`,
      comment_id: `comment_${response.id}`,
      has_spoiler: hasSpoiler
    })
  }
  
  return <CommentForm onSubmit={handleSubmit} />
}
```

---

### 5. 피드 기능 사용 (`use_feed_feature`)

**중요:** 동일 작성 세션 내에서 최초 1회만 발생시켜야 합니다.

```typescript
// src/features/feed/components/FeedEditor.tsx
import { useRef } from 'react'
import { trackUseFeedFeature } from '@/lib/analytics/events'

export function FeedEditor() {
  const hasSpoilerTracked = useRef(false)
  const hasThemeTracked = useRef(false)
  
  const handleSpoilerToggle = async (enabled: boolean) => {
    setSpoilerEnabled(enabled)
    
    // ✅ 최초 사용 시에만 추적
    if (enabled && !hasSpoilerTracked.current) {
      await trackUseFeedFeature({
        feature_name: 'spoiler',
        target_type: 'post'
      })
      hasSpoilerTracked.current = true
    }
  }
  
  const handleThemeSelect = async (theme: string) => {
    setSelectedTheme(theme)
    
    if (theme === 'birthday' && !hasThemeTracked.current) {
      await trackUseFeedFeature({
        feature_name: 'birthday_theme',
        target_type: 'post'
      })
      hasThemeTracked.current = true
    }
  }
  
  return <Editor onSpoilerToggle={handleSpoilerToggle} />
}
```

---

### 6. 토픽룸 입장/퇴장 (`enter_topic_room`, `exit_topic_room`)

```typescript
// src/features/topic/TopicRoomScreen.tsx
import { useEffect, useRef } from 'react'
import { trackEnterTopicRoom, trackExitTopicRoom } from '@/lib/analytics/events'

export function TopicRoomScreen({ route }: Props) {
  const { topicRoomId } = route.params
  const entryTimeRef = useRef<number>(Date.now())
  
  useEffect(() => {
    // 입장 추적
    const entrySource = route.params?.from || 'home'
    trackEnterTopicRoom({
      topic_room_id: `topic_${topicRoomId}`,
      entry_source: entrySource
    })
    
    // 퇴장 추적 (unmount 시)
    return () => {
      const stayDuration = Math.floor((Date.now() - entryTimeRef.current) / 1000)
      trackExitTopicRoom({
        topic_room_id: `topic_${topicRoomId}`,
        stay_duration_sec: stayDuration
      })
    }
  }, [topicRoomId])
  
  return <TopicRoomContent />
}
```

---

### 7. 검색 (`search`)

```typescript
// src/features/search/SearchScreen.tsx
import { trackSearch } from '@/lib/analytics/events'

export function SearchScreen() {
  const [query, setQuery] = useState('')
  const searchMutation = useSearch()
  
  const handleSearch = async () => {
    // 검색 실행
    const results = await searchMutation.mutateAsync(query)
    
    // ✅ 결과 조회 완료 후 추적
    await trackSearch(query)
    
    // 결과 표시
    setResults(results)
  }
  
  return (
    <SearchInput
      value={query}
      onChange={setQuery}
      onSubmit={handleSearch}
    />
  )
}
```

---

### 8. 검색 필터 사용 (`use_search_filter`)

```typescript
// src/features/search/SearchFilter.tsx
import { trackUseSearchFilter } from '@/lib/analytics/events'

export function SearchFilter() {
  const [filters, setFilters] = useState({})
  
  const handleFilterApply = async (filterType: string, value: string) => {
    // 필터 적용
    const newFilters = { ...filters, [filterType]: value }
    setFilters(newFilters)
    
    // 검색 재실행
    await refetchSearchResults(newFilters)
    
    // ✅ 필터 적용 완료 후 추적
    await trackUseSearchFilter({
      filter_type: filterType,
      filter_value: value
    })
  }
  
  return (
    <FilterOptions
      onApply={(type, value) => handleFilterApply(type, value)}
    />
  )
}
```

---

### 9. 리뷰 작성 (`create_review`)

```typescript
// src/features/review/ReviewCreateForm.tsx
import { trackCreateReview } from '@/lib/analytics/events'

export function ReviewCreateForm({ workId }: Props) {
  const createReviewMutation = useCreateReview()
  
  const handleSubmit = async (data: ReviewFormData) => {
    const response = await createReviewMutation.mutateAsync({
      workId,
      ...data
    })
    
    // ✅ 리뷰 등록 완료 후 추적
    await trackCreateReview({
      review_id: `review_${response.id}`,
      work_id: `work_${workId}`
    })
    
    navigation.goBack()
  }
  
  return <ReviewForm onSubmit={handleSubmit} />
}
```

---

### 10. 리뷰카드/프로필카드 추출

```typescript
// src/features/review/ReviewCardExport.tsx
import { trackExportReviewCard } from '@/lib/analytics/events'

export function ReviewCardExport({ review }: Props) {
  const handleExport = async () => {
    // 이미지 생성
    const imageUri = await captureReviewCard(review.id)
    
    // ✅ 생성 완료 후 추적
    await trackExportReviewCard({
      review_id: `review_${review.id}`,
      work_id: `work_${review.workId}`
    })
    
    // 공유 시트 열기
    await Share.open({ url: imageUri })
  }
  
  return <Button onPress={handleExport}>카드 추출</Button>
}
```

```typescript
// src/features/profile/ProfileCardExport.tsx
import { trackExportProfileCard } from '@/lib/analytics/events'

export function ProfileCardExport() {
  const handleExport = async () => {
    const imageUri = await captureProfileCard()
    
    await trackExportProfileCard({
      profile_type: 'my_profile'
    })
    
    await Share.open({ url: imageUri })
  }
  
  return <Button onPress={handleExport}>프로필카드 추출</Button>
}
```

---

### 11. 프로필 섹션 도달 (`view_profile_section`)

**스크롤 시 최초 1회만 발생**

```typescript
// src/features/profile/ProfileScreen.tsx
import { useRef, useCallback } from 'react'
import { trackViewProfileSection } from '@/lib/analytics/events'

export function ProfileScreen() {
  const tasteAnalysisTracked = useRef(false)
  const activityTracked = useRef(false)
  
  const handleTasteAnalysisVisible = useCallback(() => {
    if (!tasteAnalysisTracked.current) {
      trackViewProfileSection({ section_name: 'taste_analysis' })
      tasteAnalysisTracked.current = true
    }
  }, [])
  
  const handleActivityVisible = useCallback(() => {
    if (!activityTracked.current) {
      trackViewProfileSection({ section_name: 'activity' })
      activityTracked.current = true
    }
  }, [])
  
  return (
    <ScrollView>
      <ProfileCard />
      
      <ViewabilityTracker onVisible={handleTasteAnalysisVisible}>
        <TasteAnalysisSection />
      </ViewabilityTracker>
      
      <ViewabilityTracker onVisible={handleActivityVisible}>
        <ActivitySection />
      </ViewabilityTracker>
    </ScrollView>
  )
}
```

---

### 12. 공유 시트 및 공유 완료 (`open_share_sheet`, `share`)

```typescript
// src/features/share/ShareCard.tsx
import { trackOpenShareSheet, trackShare } from '@/lib/analytics/events'

export function ShareCard({ cardType, itemId }: Props) {
  const handleShare = async () => {
    // 1. 공유 시트 열기 추적
    await trackOpenShareSheet({
      content_type: cardType, // 'review_card' | 'profile_card'
      item_id: itemId
    })
    
    // 2. iOS 공유 시트 실행
    const result = await Share.open({
      url: imageUri,
      message: '...'
    })
    
    // 3. 공유 완료 추적 (카카오톡 또는 X만)
    if (result.success && result.app) {
      const method = normalizeShareMethod(result.app)
      
      if (method === 'kakao' || method === 'x') {
        await trackShare({
          method,
          content_type: cardType,
          item_id: itemId
        })
      }
    }
  }
  
  return <Button onPress={handleShare}>공유</Button>
}

function normalizeShareMethod(appIdentifier: string): ShareMethod | null {
  if (appIdentifier.includes('kakao')) return 'kakao'
  if (appIdentifier.includes('twitter') || appIdentifier.includes('x.com')) return 'x'
  return null
}
```

---

## 🚨 주의사항

### 1. **이벤트는 성공 후에만 추적**

```typescript
// ❌ 잘못된 예시: 시도 시점에 추적
const handleSubmit = async () => {
  await trackCreateFeedPost({ ... })  // 아직 성공 전!
  await createPost()  // 실패할 수도 있음
}

// ✅ 올바른 예시: 성공 후 추적
const handleSubmit = async () => {
  const result = await createPost()
  await trackCreateFeedPost({ ... })  // 성공 후!
}
```

### 2. **동일 세션 내 중복 방지**

```typescript
// ❌ 잘못된 예시: 매번 추적
const handleSpoilerToggle = (enabled: boolean) => {
  if (enabled) {
    trackUseFeedFeature({ feature_name: 'spoiler', target_type: 'post' })
  }
}

// ✅ 올바른 예시: 최초 1회만
const hasSpoilerTracked = useRef(false)
const handleSpoilerToggle = (enabled: boolean) => {
  if (enabled && !hasSpoilerTracked.current) {
    trackUseFeedFeature({ feature_name: 'spoiler', target_type: 'post' })
    hasSpoilerTracked.current = true
  }
}
```

### 3. **ID 포맷 일관성**

```typescript
// ✅ prefix 포함 권장
trackSelectContent({
  content_id: `topic_${topic.id}`  // 'topic_123'
})

trackCreateReview({
  review_id: `review_${review.id}`,  // 'review_456'
  work_id: `work_${work.id}`  // 'work_789'
})
```

### 4. **position은 1부터 시작**

```typescript
// ✅ 올바른 예시
topics.map((topic, index) => (
  <TopicCard
    onPress={() => trackSelectContent({
      position: index + 1  // 1, 2, 3, ...
    })}
  />
))
```

---

## 📖 새로운 이벤트 추가하기

### 1. Type 정의 추가

```typescript
// src/lib/analytics/events.ts

// 1-1. Parameter interface 정의
interface MyNewEventParams {
  param1: string
  param2: number
  param3: boolean
}

// 1-2. EVENT_NAMES에 추가
const EVENT_NAMES = {
  // ... 기존 이벤트들
  MY_NEW_EVENT: 'my_new_event',
} as const
```

### 2. 함수 추가

```typescript
/**
 * 새로운 이벤트 설명
 * @param params - 파라미터 설명
 */
export async function trackMyNewEvent(params: MyNewEventParams) {
  await logAnalyticsEvent(EVENT_NAMES.MY_NEW_EVENT, params)
}
```

### 3. 사용

```typescript
import { trackMyNewEvent } from '@/lib/analytics/events'

await trackMyNewEvent({
  param1: 'value',
  param2: 123,
  param3: true
})
```

---

## 🧪 테스트 방법

### 개발 환경에서 확인

개발 모드에서는 모든 이벤트가 콘솔에 로깅됩니다:

```
[analytics] Event logged: {
  name: 'create_feed_post',
  params: {
    post_id: 'post_123',
    has_spoiler: true,
    theme_type: 'birthday'
  }
}
```

### Firebase Console에서 확인

1. Firebase Console → Analytics → Events
2. "View Events" 탭에서 실시간 이벤트 확인
3. DebugView 활성화하여 개발 디바이스 이벤트만 필터링

---

## 📊 GA4 Custom Dimension 등록

GA4 리포트에서 custom parameter를 사용하려면 Custom Dimension으로 등록해야 합니다.

### 등록 필요한 Parameter

| Parameter | Event Scope | 용도 |
|-----------|------------|------|
| `source_section` | Event | 홈 섹션별 분석 |
| `content_type` | Event | 콘텐츠 타입별 분석 |
| `feature_name` | Event | 피드 기능 사용 분석 |
| `target_type` | Event | 기능 적용 대상 분석 |
| `entry_source` | Event | 토픽룸 유입 경로 분석 |
| `filter_type` | Event | 검색 필터 사용 분석 |
| `section_name` | Event | 프로필 섹션 도달 분석 |

### 등록 방법

1. GA4 → Admin → Custom Definitions
2. "Create custom dimension" 클릭
3. Dimension name: `source_section`
4. Event parameter: `source_section`
5. Scope: Event

---

## ✅ 체크리스트

새로운 이벤트를 추가할 때 확인하세요:

- [ ] 타입 정의가 명확한가?
- [ ] EVENT_NAMES에 등록했는가?
- [ ] JSDoc 주석을 작성했는가?
- [ ] 성공 후에만 추적하는가?
- [ ] 중복 발생 방지 처리를 했는가?
- [ ] ID에 prefix를 포함했는가?
- [ ] position은 1부터 시작하는가?
- [ ] 개발 환경에서 테스트했는가?
