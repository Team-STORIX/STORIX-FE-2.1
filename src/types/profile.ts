// Full profile shape returned by GET /api/v1/profile/me
// Sourced from storix-fe/src/lib/api/profile/profile.api.ts in STORIX-FE-2.0.
export type MeProfileResult = {
  userId: number
  role: string
  profileImageUrl: string | null
  nickName: string
  level: number
  point: number
  profileDescription: string
}
