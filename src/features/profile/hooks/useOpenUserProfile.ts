import { useCallback } from 'react'
import { useRouter } from 'expo-router'
import { useProfileStore } from '../store/profile.store'

export const otherUserProfileHref = (userId: number) => `/profile/user/${userId}`

/**
 * Opens a user's profile from an avatar / nickname tap. My own id lands on the
 * profile tab (the other-users API rejects it); anyone else is pushed on top of
 * the current screen so back returns here.
 */
export function useOpenUserProfile() {
  const router = useRouter()
  const myUserId = useProfileStore((state) => state.me?.userId)

  return useCallback(
    (userId: number | null | undefined) => {
      if (userId == null || !Number.isFinite(userId) || userId <= 0) return

      if (myUserId != null && userId === myUserId) {
        router.navigate('/(tabs)/profile')
        return
      }

      router.push(otherUserProfileHref(userId) as never)
    },
    [myUserId, router],
  )
}
