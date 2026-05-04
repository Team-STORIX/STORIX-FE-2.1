import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../../store/auth.store'
import { getReaderFavoriteArtists } from '../api/profile-content.api'
import type { FavoriteArtistPreview } from '../types'

export const PROFILE_FAVORITE_ARTISTS_QUERY_KEY = [
  'profile',
  'favorite-artists-preview',
] as const

type FavoriteArtistsPreviewResult = {
  count: number
  writers: FavoriteArtistPreview[]
}

export function useProfileFavoriteArtistsPreview() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery<FavoriteArtistsPreviewResult>({
    queryKey: PROFILE_FAVORITE_ARTISTS_QUERY_KEY,
    queryFn: async () => {
      const data = await getReaderFavoriteArtists({ page: 0, sort: 'LATEST' })

      return {
        count: data.totalFavoriteArtistCount ?? 0,
        writers: (data.result.content ?? []).slice(0, 10).map((artist) => ({
          id: artist.artistId,
          name: artist.artistName,
          imageUrl: artist.profileImageUrl ?? null,
        })),
      }
    },
    enabled: isAuthenticated,
    staleTime: 60 * 1_000,
    retry: 1,
  })
}
