import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../../store/auth.store'
import type { LibraryReviewSort } from '../../library/api/library.api'
import {
  getOtherUserFavoriteWorks,
  getOtherUserGenreStats,
  getOtherUserHashtags,
  getOtherUserLibrary,
  getOtherUserProfile,
  getOtherUserRatings,
} from '../api/profile-other-user.api'
import { getOtherUserProfileError } from '../lib/otherUserProfileError'
import { useMe } from './useMe'

export const otherUserQueryKey = (userId: number) => ['profile', 'other-users', userId] as const

// The documented errors (self, blocked, withdrawn) will not change on a retry.
const retryOnce = (failureCount: number, error: unknown) =>
  getOtherUserProfileError(error) == null && failureCount < 1

/**
 * Only another user's id may reach these endpoints; my own id answers 400.
 * Waits for my profile so the check is reliable.
 */
function useCanQueryOtherUser(userId: number) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const myUserId = useMe().data?.userId

  return (
    isAuthenticated &&
    Number.isFinite(userId) &&
    userId > 0 &&
    myUserId != null &&
    userId !== myUserId
  )
}

export function useOtherUserProfile(userId: number) {
  return useQuery({
    queryKey: otherUserQueryKey(userId),
    queryFn: () => getOtherUserProfile(userId),
    enabled: useCanQueryOtherUser(userId),
    staleTime: 60 * 1_000,
    retry: retryOnce,
  })
}

export function useOtherUserGenreStats(userId: number) {
  return useQuery({
    queryKey: [...otherUserQueryKey(userId), 'genre-stats'],
    queryFn: async () =>
      (await getOtherUserGenreStats(userId)).filter((item) => item.score > 0),
    enabled: useCanQueryOtherUser(userId),
    staleTime: 5 * 60 * 1_000,
    retry: retryOnce,
  })
}

export function useOtherUserRatings(userId: number) {
  return useQuery({
    queryKey: [...otherUserQueryKey(userId), 'ratings'],
    queryFn: () => getOtherUserRatings(userId),
    enabled: useCanQueryOtherUser(userId),
    staleTime: 60 * 1_000,
    retry: retryOnce,
  })
}

export function useOtherUserHashtags(userId: number) {
  return useQuery({
    queryKey: [...otherUserQueryKey(userId), 'hashtags'],
    queryFn: () => getOtherUserHashtags(userId),
    enabled: useCanQueryOtherUser(userId),
    staleTime: 60 * 1_000,
    retry: retryOnce,
  })
}

export function useOtherUserLibrary(userId: number, sort: LibraryReviewSort = 'LATEST') {
  return useInfiniteQuery({
    queryKey: [...otherUserQueryKey(userId), 'library', sort],
    queryFn: ({ pageParam }) => getOtherUserLibrary({ userId, sort, page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.result.last || lastPage.result.empty ? undefined : lastPageParam + 1,
    enabled: useCanQueryOtherUser(userId),
    retry: retryOnce,
  })
}

export function useOtherUserFavoriteWorks(userId: number) {
  return useInfiniteQuery({
    queryKey: [...otherUserQueryKey(userId), 'favorite-works'],
    queryFn: ({ pageParam }) => getOtherUserFavoriteWorks({ userId, page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.result.last || lastPage.result.empty ? undefined : lastPageParam + 1,
    enabled: useCanQueryOtherUser(userId),
    retry: retryOnce,
  })
}
