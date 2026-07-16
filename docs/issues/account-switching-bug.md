# 계정 전환 버그 분석 및 해결

## 문제 상황

### 증상
카카오 계정으로 로그인 → 앱 사용 → 앱 종료 → (일정 시간 이후) 재접속 시:
- **실제 로그인 계정**: 네이버 계정으로 변경됨
- **UI 표시**: 설정 > 소셜 로그인에는 "카카오"로 잘못 표시됨

### 재현 조건
1. 과거에 네이버 계정으로 로그인한 적이 있음 (리프레시 토큰이 SecureStore에 저장됨)
2. 현재 세션에서 카카오 계정으로 로그인
3. 앱 종료
4. 액세스 토큰이 만료될 만큼 시간 경과 후 재접속
5. API 호출 시 401 에러 → 토큰 재발급 로직 실행

### 발견 시점
- QA 토큰 재발급 API 호출 문제 해결 이후 발생
- 특정 기기에서만 확인됨 (다른 기기 재현 확인 필요)

---

## 원인 분석

### 근본 원인: 토큰 불일치 (Token Mismatch)

#### 1. 토큰 저장 메커니즘의 허점

**문제 시나리오**:
```
[초기 상태]
- 네이버로 로그인 → SecureStore에 네이버 리프레시 토큰 저장

[카카오로 재로그인]
- 카카오 액세스 토큰 저장 ✅
- 리프레시 토큰 처리:
  * 백엔드가 refreshToken을 반환하면 → 저장 ✅
  * 백엔드가 refreshToken을 반환하지 않으면 → removeRefreshToken() 호출
  * 하지만 실제로는 SecureStore에 네이버 리프레시 토큰이 남아있을 수 있음 ⚠️

[결과]
액세스 토큰 (카카오) ≠ 리프레시 토큰 (네이버)
```

**코드 위치**: `src/store/auth.store.ts:143-162`

```typescript
setLoginTokens: async ({ accessToken, refreshToken }) => {
  const ops: Promise<void>[] = [
    persistAccessToken(accessToken),
    removeOnboardingToken(),
  ]
  if (refreshToken) {
    ops.push(persistRefreshToken(refreshToken))
  } else {
    ops.push(removeRefreshToken())  // ❌ 실제로 삭제 안 될 수 있음
  }
  await Promise.all(ops)
  // ...
}
```

#### 2. 토큰 재발급 시 검증 부재

**문제 흐름**:
```
[토큰 만료 후 API 호출]
1. 401 에러 발생
2. axios interceptor가 토큰 재발급 시도
3. SecureStore에서 리프레시 토큰 읽기
   → 네이버 계정의 리프레시 토큰 (예전 것)
4. 백엔드에 재발급 요청
   → 백엔드는 리프레시 토큰의 sub(userId) 기준으로 토큰 발급
   → 네이버 계정의 새 액세스 토큰 + 리프레시 토큰 반환
5. 새 토큰 저장
6. 결과: 계정이 네이버로 전환됨 ⚠️
```

**코드 위치**: `src/lib/api/axios-instance.ts:194-239`

```typescript
try {
  const storedRefreshToken = await getRefreshToken();
  
  // ❌ 액세스 토큰과 리프레시 토큰이 같은 계정인지 검증하지 않음
  
  const refreshResponse = await axios.post(
    `${process.env.EXPO_PUBLIC_API_URL}/api/v1/auth/tokens/refresh`,
    { refreshToken: storedRefreshToken },
    // ...
  );
  
  // 네이버 계정의 새 토큰들을 받아서 저장
  // 사용자는 모르는 사이에 계정 전환됨
}
```

#### 3. 소셜 로그인 표시 캐싱 문제

**문제**:
- `socialProvider` 값은 `AsyncStorage`에 저장됨
- 로그아웃 시에만 삭제됨
- **토큰 재발급으로 계정이 바뀐 경우는 로그아웃이 아니므로 삭제되지 않음**
- 실제: 네이버 계정 / UI 표시: 카카오

**코드 위치**: `src/features/profile/hooks/useSocialProvider.ts`

---

## 백엔드 동작 (정상)

백엔드는 정상적으로 동작하고 있음:

1. **토큰 재발급 API**: 리프레시 토큰의 `sub` (userId)를 기준으로 새 토큰 발급
2. **계정 정보 API**: 액세스 토큰의 `sub` (userId)를 기준으로 사용자 정보 조회

→ 클라이언트가 잘못된 리프레시 토큰을 보내면, 백엔드는 그에 맞는 계정의 토큰을 정확히 발급함

---

## 해결 방법

### 1. API 스키마 정규화

**변경 사항**:
- `regularLoginResponse` 필드 제거 (API 명세서에 없음)
- `refreshToken`을 required로 변경 (더 이상 optional 아님)
- 두 토큰이 모두 존재할 때만 로그인 성공 처리

**파일**: `src/features/auth/api/auth.schema.ts`

```typescript
// Before
export const SocialLoginResultSchema = z.object({
  isRegistered: z.boolean(),
  regularLoginResponse: RegularLoginResponseSchema.nullable().optional(), // ❌ 제거
  readerLoginResponse: ReaderLoginResponseSchema.nullable().optional(),
  readerPreLoginResponse: ReaderPreLoginResponseSchema.nullable().optional(),
})

export const SignupResponseSchema = ApiResponseSchema(
  z.object({
    accessToken: z.string(),
    refreshToken: z.string().optional(), // ❌ optional
  }),
)

// After
export const SocialLoginResultSchema = z.object({
  isRegistered: z.boolean(),
  readerLoginResponse: ReaderLoginResponseSchema.nullable().optional(), // ✅
  readerPreLoginResponse: ReaderPreLoginResponseSchema.nullable().optional(),
})

export const SignupResponseSchema = ApiResponseSchema(
  z.object({
    accessToken: z.string(),
    refreshToken: z.string(), // ✅ required
  }),
)
```

### 2. JWT 토큰 검증 유틸리티 추가

**새 함수**: `areTokensFromSameUser()`

**파일**: `src/lib/utils/jwt.ts`

```typescript
/**
 * Validates that two JWT tokens belong to the same user by comparing their userId claims.
 * Returns true if both tokens have valid, matching userIds; false otherwise.
 */
export const areTokensFromSameUser = (
  token1: string | null | undefined,
  token2: string | null | undefined,
): boolean => {
  const userId1 = getUserIdFromJwt(token1)
  const userId2 = getUserIdFromJwt(token2)

  if (!userId1 || !userId2) return false

  return userId1 === userId2
}
```

### 3. 로그인 시 토큰 검증

**변경 사항**: `setLoginTokens`에서 두 토큰의 userId 일치 여부 검증

**파일**: `src/store/auth.store.ts`

```typescript
setLoginTokens: async ({ accessToken, refreshToken }) => {
  // ✅ 토큰 검증 추가
  if (!areTokensFromSameUser(accessToken, refreshToken)) {
    console.error('[setLoginTokens] Token mismatch detected')
    throw new Error('Token validation failed: userId mismatch')
  }

  // ✅ refreshToken을 항상 저장 (required로 변경)
  await Promise.all([
    persistAccessToken(accessToken),
    persistRefreshToken(refreshToken),
    removeOnboardingToken(),
  ])

  set({
    accessToken,
    onboardingToken: null,
    isAuthenticated: true,
  })
},
```

### 4. 토큰 재발급 시 다층 검증

**변경 사항**: 재발급 전/후 모두 검증

**파일**: `src/lib/api/axios-instance.ts`

```typescript
try {
  const storedRefreshToken = await getRefreshToken();

  if (!storedRefreshToken) {
    // 로그아웃 처리
    useAuthStore.getState().clearAuth().catch(() => {});
    return Promise.reject(error);
  }

  // ✅ 재발급 전 검증: 기존 토큰들이 같은 계정인지 확인
  if (!areTokensFromSameUser(currentAccessToken, storedRefreshToken)) {
    console.warn('[TokenRefresh] Token mismatch detected: logging out for security');
    isRefreshing = false;
    clearQueue();
    useAuthStore.getState().clearAuth().catch(() => {});
    return Promise.reject(new Error('Token mismatch: different user accounts'));
  }

  // 토큰 재발급 요청
  const refreshResponse = await axios.post(
    `${process.env.EXPO_PUBLIC_API_URL}/api/v1/auth/tokens/refresh`,
    { refreshToken: storedRefreshToken },
    { headers: { "Content-Type": "application/json" } },
  );

  const result = refreshResponse.data?.result;
  const newAccessToken: string | undefined = result?.accessToken;
  const newRefreshToken: string | undefined = result?.refreshToken;

  if (!newAccessToken || !newRefreshToken) {
    throw new Error("Refresh response is missing tokens");
  }

  // ✅ 재발급 후 검증: 받은 새 토큰들도 같은 계정인지 확인
  if (!areTokensFromSameUser(newAccessToken, newRefreshToken)) {
    console.error('[TokenRefresh] Backend returned mismatched tokens');
    throw new Error('Token refresh returned mismatched tokens');
  }

  // 검증 통과 → 저장
  await setAccessToken(newAccessToken);
  await setRefreshToken(newRefreshToken);
  
  // ...
} catch (refreshError) {
  clearQueue();
  useAuthStore.getState().clearAuth().catch(() => {});
  return Promise.reject(refreshError);
}
```

---

## 보안 강화 효과

### Before (위험)
```
[토큰 불일치 상황]
액세스 토큰: 카카오 계정 (userId: 123)
리프레시 토큰: 네이버 계정 (userId: 456)

[액세스 토큰 만료 시]
→ 네이버 리프레시 토큰으로 재발급
→ 조용히 네이버 계정으로 전환 ⚠️
→ 사용자는 모름
→ 카카오 계정 데이터를 네이버 계정에 잘못 저장할 수 있음
```

### After (안전)
```
[토큰 불일치 상황]
액세스 토큰: 카카오 계정 (userId: 123)
리프레시 토큰: 네이버 계정 (userId: 456)

[로그인 시]
→ userId 불일치 감지
→ 에러 throw ✅
→ 로그인 실패

[액세스 토큰 만료 시]
→ userId 불일치 감지
→ 즉시 로그아웃 ✅
→ 로그인 화면으로 이동
→ 사용자가 다시 로그인
→ 올바른 계정으로 재로그인
```

---

## 테스트 체크리스트

### 정상 시나리오
- [ ] 카카오 로그인 → 앱 종료 → 재접속 → 카카오 계정 유지
- [ ] 네이버 로그인 → 앱 종료 → 재접속 → 네이버 계정 유지
- [ ] 애플 로그인 → 앱 종료 → 재접속 → 애플 계정 유지
- [ ] 로그아웃 → 다른 계정으로 로그인 → 정상 로그인

### 보안 시나리오
- [ ] 수동으로 토큰 불일치 상태 만들기 → 재접속 시 로그아웃되는지 확인
- [ ] 네이버 로그인 → 카카오 로그인 → 재접속 → 카카오 계정 유지 확인
- [ ] 토큰 만료 후 API 호출 → 재발급 성공 → 같은 계정 유지

### UI 테스트
- [ ] 설정 > 소셜 로그인 표시가 실제 로그인 계정과 일치하는지
- [ ] 로그아웃 후 소셜 로그인 표시 초기화되는지

---

## 관련 파일

### 수정된 파일
1. `src/features/auth/api/auth.schema.ts` - 스키마 정규화
2. `src/lib/utils/jwt.ts` - 토큰 검증 유틸리티 추가
3. `src/store/auth.store.ts` - 로그인 시 검증 추가
4. `src/lib/api/axios-instance.ts` - 재발급 시 다층 검증 추가
5. `src/features/auth/hooks/useSignup.ts` - 주석 정리

### 관련 파일 (수정 안 함)
- `src/features/profile/hooks/useSocialProvider.ts` - 소셜 로그인 표시
- `src/lib/storage/secure.ts` - SecureStore 인터페이스
- `src/features/auth/api/*.api.ts` - 각종 로그인 API

---

## 추후 개선 사항

### 1. 소셜 로그인 표시 개선
현재는 AsyncStorage 캐시에 의존하고 있음. 개선 방안:
- 프로필 API 응답에 소셜 로그인 타입 포함 요청 (백엔드)
- 또는 액세스 토큰을 디코딩해서 provider 정보 추출 (클라이언트)

### 2. 토큰 TTL 모니터링
- 토큰 만료 시간 추적
- 만료 직전 자동 갱신 (proactive refresh)
- 사용자 경험 개선

### 3. 에러 메시지 개선
현재는 "Token mismatch" 같은 개발자용 메시지만 로그에 출력. 개선 방안:
- 사용자에게 "세션이 만료되었습니다. 다시 로그인해주세요" 같은 친화적 메시지
- 에러 추적 서비스 (Sentry 등) 연동

---

## 결론

이 버그는 **토큰 관리의 원자성(atomicity) 부족**으로 인해 발생했습니다:
- 액세스 토큰과 리프레시 토큰이 독립적으로 저장/삭제됨
- 두 토큰이 같은 계정의 것인지 검증하지 않음
- 백엔드는 정상 동작하지만, 클라이언트가 잘못된 토큰 조합을 보냄

**해결 핵심**:
1. ✅ 두 토큰을 항상 함께 검증 (atomic validation)
2. ✅ 의심스러운 상황에서는 로그아웃 (fail-safe)
3. ✅ API 명세서에 맞는 정확한 타입 정의

이로써 **보안 강화**와 **명확한 UX** (조용한 계정 전환 대신 명시적 재로그인)를 동시에 달성했습니다.

---

**작성일**: 2026-07-09  
**수정 버전**: FE 2.1  
**관련 이슈**: QA 토큰 재발급 수정 후 발생한 계정 전환 문제
