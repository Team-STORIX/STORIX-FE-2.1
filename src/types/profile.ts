// Full profile shape returned by GET /api/v2/profile/me
// V2 includes title system and genre progress
export type MeProfileResult = {
  userId: number
  role: string
  profileImageUrl: string | null
  nickName: string
  point: number
  profileDescription: string | null
  oauthProvider: string
  // V2 fields: title system
  topGenre: string
  title: string | null
  stage: string
  nextStage: string
  topGenreScore: number
  remainingScore: number
  progressPercentage: number
  /** 서재 공개 여부. PUT /api/v1/profile/library/visibility 로 바꾼다. */
  isLibraryPublic?: boolean
  // Legacy compatibility
  level?: number
}
