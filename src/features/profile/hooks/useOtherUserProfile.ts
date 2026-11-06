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

export const otherUserQueryKey = (userId: number) => ['profile', 'other-users', userId] as const

// The documented errors (self, blocked, withdrawn) will not change on a retry.
const retryOnce = (failureCount: number, error: unknown) =>
  getOtherUserProfileError(error) == null && failureCount < 1

const isValidUserId = (userId: number) => Number.isFinite(userId) && userId > 0

/**
 * Shared enable/retry policy for the /profile/other-users/{userId} family.
 * My own id is not filtered here on purpose: the server answers it with
 * 400 PROFILE_ERROR_002, which getOtherUserProfileError maps to 'self', and
 * gating on /profile/me would leave every query pending forever if that call failed.
 */
function useOtherUserQueryPolicy(userId: number) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return { enabled: isAuthenticated && isValidUserId(userId), retry: retryOnce }
}

function useOtherUserQuery<T>(
  userId: number,
  suffix: readonly unknown[],
  queryFn: () => Promise<T>,
  staleTime: number,
) {
  return useQuery({
    queryKey: [...otherUserQueryKey(userId), ...suffix],
    queryFn,
    staleTime,
    ...useOtherUserQueryPolicy(userId),
  })
}

type PagedResult = { result: { last: boolean; empty: boolean } }

function useOtherUserInfiniteQuery<T extends PagedResult>(
  userId: number,
  suffix: readonly unknown[],
  queryFn: (page: number) => Promise<T>,
) {
  return useInfiniteQuery({
    queryKey: [...otherUserQueryKey(userId), ...suffix],
    queryFn: ({ pageParam }) => queryFn(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.result.last || lastPage.result.empty ? undefined : lastPageParam + 1,
    ...useOtherUserQueryPolicy(userId),
  })
}

export function useOtherUserProfile(userId: number) {
  return useOtherUserQuery(userId, [], () => getOtherUserProfile(userId), 60 * 1_000)
}

export function useOtherUserGenreStats(userId: number) {
  return useOtherUserQuery(
    userId,
    ['genre-stats'],
    async () => (await getOtherUserGenreStats(userId)).filter((item) => item.score > 0),
    5 * 60 * 1_000,
  )
}

export function useOtherUserRatings(userId: number) {
  return useOtherUserQuery(userId, ['ratings'], () => getOtherUserRatings(userId), 60 * 1_000)
}

export function useOtherUserHashtags(userId: number) {
  return useOtherUserQuery(userId, ['hashtags'], () => getOtherUserHashtags(userId), 60 * 1_000)
}

export function useOtherUserLibrary(userId: number, sort: LibraryReviewSort = 'LATEST') {
  return useOtherUserInfiniteQuery(userId, ['library', sort], (page) =>
    getOtherUserLibrary({ userId, sort, page }),
  )
}

export function useOtherUserFavoriteWorks(userId: number) {
  return useOtherUserInfiniteQuery(userId, ['favorite-works'], (page) =>
    getOtherUserFavoriteWorks({ userId, page }),
  )
}
