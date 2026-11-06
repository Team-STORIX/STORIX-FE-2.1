// Fields shared by my profile and another user's profile
export type ProfileSummary = {
  userId: number
  role: string
  profileImageUrl: string | null
  nickName: string
  profileDescription: string | null
  // V2 fields: title system
  topGenre: string
  title: string | null
  stage: string
  nextStage: string
  topGenreScore: number
  remainingScore: number
  progressPercentage: number
  isLibraryPublic: boolean
}

// Full profile shape returned by GET /api/v2/profile/me
// V2 includes title system and genre progress
export type MeProfileResult = ProfileSummary & {
  oauthProvider: string
  // Legacy compatibility
  level?: number
}

// GET /api/v1/profile/other-users/{userId}
export type OtherUserProfileResult = ProfileSummary
