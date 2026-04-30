// Minimal profile shape used by the store layer.
// Expand this as profile.api.ts is ported in Phase 4.
export type MeProfileResult = {
  userId: number
  nickName: string
  profileImageUrl?: string | null
  profileDescription?: string | null
}
